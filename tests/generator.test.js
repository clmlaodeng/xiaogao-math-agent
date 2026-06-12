import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exportAsHtml,
  exportPrintableHtml,
  generateHomeworkFeedback,
  generatePaper,
  generateParentFeedback,
  generateQuestions,
  getDashboardStats,
  resetRecords,
  variantFromMistake
} from '../src/generator.js';

process.env.DEEPSEEK_DISABLE = '1';

test('generates targeted questions with answers and teaching fields', async () => {
  resetRecords();
  const result = await generateQuestions({
    grade: '六年级',
    knowledgePoint: '工程问题',
    weakness: '效率比和时间比混淆',
    count: 5,
    difficulty: '中档',
    useAi: false
  });

  assert.equal(result.source, 'template');
  assert.equal(result.items.length, 5);
  assert.equal(result.items[0].knowledgePoint, '工程问题');
  assert.ok(result.aiContent.includes('【学生练习版】'));
});

test('can explicitly disable DeepSeek generation', async () => {
  const result = await generateQuestions({
    grade: '六年级',
    knowledgePoint: '量率对应',
    count: 3,
    useAi: false
  });

  assert.equal(result.source, 'template');
  assert.equal(result.model, 'local-template');
  assert.ok(result.note.includes('已关闭 DeepSeek'));
});

test('creates same-model variants from a mistake', async () => {
  const result = await variantFromMistake({
    originalQuestion: '一件商品先降价 20%，再涨价 20%，现在售价是 96 元。原价是多少元？',
    teacherNote: '学生误以为一降一涨可以抵消'
  });

  assert.equal(result.analysis.knowledgePoint, '连续变化百分数');
  assert.equal(result.variants.length, 3);
  assert.ok(result.aiContent.includes('【错因分析】'));
});

test('generates a paper with student copy and answer copy', async () => {
  const result = await generatePaper({
    paperType: '周测',
    minutes: 25,
    count: 8,
    knowledgePoints: '量率对应,工程问题,连续变化百分数'
  });

  assert.equal(result.questions.length, 8);
  assert.ok(result.aiContent.includes('【学生卷】'));
  assert.ok(result.aiContent.includes('【答案解析】'));
});

test('generates parent feedback', async () => {
  const result = await generateParentFeedback({
    studentName: '小林',
    weakPoints: '量率对应',
    progressPoints: '愿意画图',
    mistakeReasons: '单位 1 不稳定',
    nextSteps: '做 2 组变式'
  });

  assert.ok(result.aiContent.includes('小林'));
  assert.ok(result.aiContent.includes('【微信简短版】'));
});

test('generates homework feedback with image placeholders', async () => {
  const result = await generateHomeworkFeedback({
    studentName: '小林',
    courseName: '六年级数学',
    knowledgePoint: '量率对应',
    homeworkContext: '课后10分钟作业',
    teacherObservation: '学生能列式，但单位 1 判断不稳定。',
    nextSteps: '补两道同模型题',
    images: [{ name: 'demo.png', type: 'image/png', dataUrl: 'data:image/png;base64,AAAA' }],
    useAi: false
  });

  assert.equal(result.source, 'template');
  assert.ok(['not-configured', 'vision-error'].includes(result.visionSource));
  assert.ok(result.aiContent.includes('课后10分钟作业'));
  assert.ok(result.visionAnalysis.includes('视觉模型') || result.visionAnalysis.includes('图片识别失败'));
});

test('dashboard exposes knowledge points and records', () => {
  const stats = getDashboardStats();

  assert.ok(stats.knowledgePointOptions.length >= 8);
  assert.ok(stats.highFrequencyKnowledgePoints.includes('量率对应'));
  assert.ok(Array.isArray(stats.recentRecords));
});

test('exports html', () => {
  const html = exportAsHtml({ title: '测试', content: '内容' });

  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('测试'));
  assert.ok(html.includes('内容'));
});

test('exports printable student and answer pages', async () => {
  const result = await generateQuestions({
    grade: '六年级',
    knowledgePoint: '工程问题',
    count: 3,
    useAi: false
  });
  const studentHtml = exportPrintableHtml({ title: result.title, payload: result }, 'student');
  const answerHtml = exportPrintableHtml({ title: result.title, payload: result }, 'answer');

  assert.ok(studentHtml.includes('@page'));
  assert.ok(studentHtml.includes('姓名'));
  assert.ok(studentHtml.includes('answer-space'));
  assert.ok(answerHtml.includes('答案解析卷'));
  assert.ok(answerHtml.includes('解析'));
});
