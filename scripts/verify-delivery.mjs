import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 19000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const nodeBin = process.execPath;
const server = spawn(nodeBin, ['src/server.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    DEEPSEEK_DISABLE: '1'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text.slice(0, 300)}`);
  }
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? JSON.parse(text) : text;
}

async function postJson(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      const html = await request('/');
      if (html.includes('课后10分钟反馈助手')) return;
    } catch {
      await delay(150);
    }
  }
  throw new Error(`server did not become ready. Output:\n${serverOutput}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await waitForServer();

  const questions = await postJson('/api/generate-questions', {
    grade: '六年级',
    knowledgePoint: '工程问题',
    count: 3,
    useAi: false
  });
  assert(questions.items?.length === 3, 'generate-questions should return three items');

  const homework = await postJson('/api/generate-homework-feedback', {
    studentName: '小林',
    knowledgePoint: '课后10分钟作业',
    teacherObservation: [
      '第1题统计图选择正确，老师已经打勾。',
      '第2题平均分计算错误，9.45×3 误算为 19.35。',
      '第3题折返行程过程错误，没有计入返回家取书的路程。'
    ].join('\n'),
    useAi: false
  });
  assert(homework.correctItems?.some((item) => item.title === '统计图选择'), 'homework should keep correct item as a strength');
  assert(homework.issueItems?.length === 2, 'homework should identify two issue items');
  assert(homework.supplementItems?.length === 2, 'homework should generate supplements only for issues');
  assert(homework.aiContent === homework.fallbackContent, 'homework official output should stay structured');

  const studentPrint = await postJson('/api/export-student-print', { title: homework.title, payload: homework });
  assert(studentPrint.includes('打印 / 保存为 PDF'), 'student print page should include print action');
  assert(studentPrint.includes('answer-space'), 'student print page should include answer space');

  const answerPrint = await postJson('/api/export-answer-print', { title: homework.title, payload: homework });
  assert(answerPrint.includes('答案解析卷'), 'answer print page should include answer title');
  assert(answerPrint.includes('解析'), 'answer print page should include solutions');

  const records = await request('/api/generated-records');
  assert(Array.isArray(records.records), 'generated-records should return records');
  assert(records.stats?.seedCounts?.knowledgePoints >= 1, 'generated-records should return stats');

  console.log('delivery smoke test passed');
} finally {
  server.kill();
}
