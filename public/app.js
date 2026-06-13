const panelTitles = {
  questions: '生成专项题',
  variant: '错题变式',
  paper: '生成周测卷',
  feedback: '家长反馈',
  homework: '课后作业反馈'
};

const panels = {
  questions: document.querySelector('#questionsPanel'),
  variant: document.querySelector('#variantPanel'),
  paper: document.querySelector('#paperPanel'),
  feedback: document.querySelector('#feedbackPanel'),
  homework: document.querySelector('#homeworkPanel')
};

const panelTitle = document.querySelector('#panelTitle');
const resultOutput = document.querySelector('#resultOutput');
const resultCards = document.querySelector('#resultCards');
const resultMeta = document.querySelector('#resultMeta');
const useAiToggle = document.querySelector('#useAiToggle');
const configStatus = document.querySelector('#configStatus');
let latestExport = { title: '成都小升初数学出题助手导出', content: '' };
let latestPrintPayload = { title: '成都小升初数学练习', payload: { items: [] } };

function formData(form) {
  return {
    ...Object.fromEntries(new FormData(form).entries()),
    useAi: Boolean(useAiToggle?.checked)
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function collectHomeworkData(form) {
  const data = formData(form);
  const files = Array.from(form.elements.homeworkImages.files || []).slice(0, 4);
  data.images = await Promise.all(files.map(async (file) => ({
    name: file.name,
    type: file.type,
    dataUrl: await fileToDataUrl(file)
  })));
  return data;
}

async function postJson(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '生成失败');
  return result;
}

function renderConfigStatus(status) {
  if (!configStatus) return;
  const items = [status.deepseek, status.vision].filter(Boolean);
  configStatus.replaceChildren(...items.map((item) => {
    const pill = document.createElement('span');
    pill.className = `config-pill ${item.configured ? 'ready' : 'missing'}`;
    pill.textContent = item.configured ? `${item.provider} 可用` : `${item.provider} 未配置`;
    pill.title = item.message || '';
    return pill;
  }));
}

async function refreshConfigStatus() {
  if (!configStatus) return;
  try {
    const response = await fetch('/api/config-status');
    const status = await response.json();
    if (!response.ok) throw new Error(status.error || '配置检查失败');
    renderConfigStatus(status);
  } catch (error) {
    configStatus.textContent = `配置检查失败：${error.message}`;
  }
}

function setMeta(result) {
  const source = result.source || 'template';
  resultMeta.dataset.source = source;
  if (source === 'deepseek') {
    resultMeta.textContent = `DeepSeek AI 生成 · ${result.model}`;
  } else {
    resultMeta.textContent = result.note
      ? `本地模板回退 · ${result.note}`
      : '本地模板生成';
  }
}

function showResult(title, content, result = {}) {
  const finalContent = result.aiContent || content;
  latestExport = { title, content: finalContent };
  latestPrintPayload = { title, payload: result };
  resultOutput.textContent = finalContent;
  resultOutput.hidden = false;
  resultCards.hidden = true;
  resultCards.replaceChildren();
  setMeta(result);
  refreshDashboard();
}

function card(title, body, actionText = '复制') {
  const article = document.createElement('article');
  article.className = 'result-mini-card';
  const heading = document.createElement('h4');
  const content = document.createElement('pre');
  const button = document.createElement('button');
  heading.textContent = title;
  content.textContent = body || '暂无内容';
  button.type = 'button';
  button.textContent = actionText;
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(content.textContent);
  });
  article.append(heading, content, button);
  return article;
}

function showHomeworkResult(result) {
  const finalContent = result.aiContent || formatHomeworkFeedback(result);
  const correctSummary = formatDiagnostics(result.correctItems || [], '暂无明确正确题表现，请老师结合图片补充确认。');
  const issueSummary = formatDiagnostics(result.issueItems || [], '暂无明确错题，系统会按当前知识点给出巩固题。');
  latestExport = { title: result.title || '课后作业反馈', content: finalContent };
  latestPrintPayload = {
    title: `${result.title || '课后作业反馈'}-补救题`,
    payload: { supplementItems: result.supplementItems || [] }
  };
  resultOutput.textContent = finalContent;
  resultOutput.hidden = true;
  resultCards.hidden = false;
  resultCards.replaceChildren(
    card('识别状态', `${result.reviewStatus || '待老师确认'}\n${result.visionSource || ''}`),
    card('老师内部分析', result.teacherAnalysis || result.visionAnalysis),
    card('正确题表现', correctSummary),
    card('需补救题', issueSummary),
    card('家长微信反馈', result.wechatText),
    card('同错因补救题', formatSupplementItems(result.supplementItems || []), '复制题目')
  );
  setMeta(result);
  refreshDashboard();
}

function switchPanel(panel) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === panel);
  });
  Object.entries(panels).forEach(([key, element]) => {
    element.classList.toggle('active', key === panel);
  });
  panelTitle.textContent = panelTitles[panel];
}

function formatQuestions(result) {
  return [
    result.title,
    result.teacherReviewNotice,
    '',
    '【学生练习版】',
    ...result.items.map((item) => `${item.number}. ${item.question}\n答题区：____________________________________________`),
    '',
    '【答案解析版】',
    ...result.items.map((item) => [
      `${item.number}. ${item.question}`,
      `答案：${item.answer}`,
      `解析：${item.solution}`,
      `考点：${item.knowledgePoint}`,
      `难度：${item.difficulty}`,
      `易错提醒：${item.mistakeTip}`,
      `变式建议：${item.variationSuggestion}`
    ].join('\n'))
  ].join('\n\n');
}

function formatVariant(result) {
  return [
    '【错因分析】',
    `考点：${result.analysis.knowledgePoint}`,
    `错因：${result.analysis.mistakeReason}`,
    `建议：${result.analysis.suggestion}`,
    '',
    '【同模型变式】',
    ...result.variants.map((item) => [
      item.level,
      item.question,
      `答案：${item.answer}`,
      `解析：${item.solution}`,
      `易错提醒：${item.mistakeTip}`
    ].join('\n')),
    '',
    '【家长反馈参考】',
    result.parentFeedback
  ].join('\n\n');
}

function formatPaper(result) {
  return ['【学生卷】', result.studentPaper, '', '【答案解析】', result.answerPaper, '', '【讲评提纲】', result.teachingOutline].join('\n\n');
}

function formatFeedback(result) {
  return ['【微信简短版】', result.wechatText, '', '【正式记录版】', result.formalReport].join('\n\n');
}

function formatHomeworkFeedback(result) {
  return result.fallbackContent || [
    '【作业图片分析】',
    result.visionAnalysis || '',
    '',
    '【微信反馈】',
    result.wechatText || '',
    '',
    '【正式记录版】',
    result.formalReport || ''
  ].join('\n\n');
}

function formatSupplementItems(items = []) {
  return items.length
    ? items.map((item) => [
      `${item.number}. ${item.question}`,
      `答案：${item.answer}`,
      `解析：${item.solution}`
    ].join('\n')).join('\n\n')
    : '暂无补救题';
}

function formatDiagnostics(items = [], emptyText = '暂无内容') {
  return items.length
    ? items.map((item) => `${item.number}. ${item.title}\n${item.summary}`).join('\n\n')
    : emptyText;
}

function markLoading(text) {
  resultOutput.textContent = text;
  if (useAiToggle?.checked) {
    resultMeta.dataset.source = 'loading';
    resultMeta.textContent = '正在调用 DeepSeek...';
  } else {
    resultMeta.dataset.source = 'template';
    resultMeta.textContent = 'DeepSeek 已关闭，正在使用本地模板...';
  }
}

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => switchPanel(button.dataset.panel));
});

panels.questions.addEventListener('submit', async (event) => {
  event.preventDefault();
  markLoading('正在生成专项题...');
  const data = formData(event.currentTarget);
  data.count = Number(data.count);
  const result = await postJson('/api/generate-questions', data);
  showResult(result.title, formatQuestions(result), result);
});

panels.variant.addEventListener('submit', async (event) => {
  event.preventDefault();
  markLoading('正在生成错题变式...');
  const result = await postJson('/api/variant-from-mistake', formData(event.currentTarget));
  showResult('错题变式训练', formatVariant(result), result);
});

panels.paper.addEventListener('submit', async (event) => {
  event.preventDefault();
  markLoading('正在生成周测卷...');
  const data = formData(event.currentTarget);
  data.count = Number(data.count);
  data.minutes = Number(data.minutes);
  const result = await postJson('/api/generate-paper', data);
  showResult(result.title, formatPaper(result), result);
});

panels.feedback.addEventListener('submit', async (event) => {
  event.preventDefault();
  markLoading('正在生成家长反馈...');
  const result = await postJson('/api/generate-parent-feedback', formData(event.currentTarget));
  showResult('家长反馈', formatFeedback(result), result);
});

panels.homework.addEventListener('submit', async (event) => {
  event.preventDefault();
  markLoading('正在分析作业图片并生成反馈...');
  const result = await postJson('/api/generate-homework-feedback', await collectHomeworkData(event.currentTarget));
  showHomeworkResult(result);
});

const homeworkInput = document.querySelector('input[name="homeworkImages"]');
const homeworkPreview = document.querySelector('#homeworkPreview');
homeworkInput?.addEventListener('change', () => {
  const files = Array.from(homeworkInput.files || []).slice(0, 4);
  homeworkPreview.replaceChildren(...files.map((file) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    caption.textContent = file.name;
    figure.append(image, caption);
    return figure;
  }));
});

document.querySelector('#copyResult').addEventListener('click', async () => {
  await navigator.clipboard.writeText(resultOutput.textContent);
});

document.querySelector('#exportResult').addEventListener('click', async () => {
  const response = await fetch('/api/export-html', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(latestExport)
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'math-question-output.html';
  link.click();
  URL.revokeObjectURL(url);
});

async function openPrintPage(endpoint) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(latestPrintPayload)
  });
  const html = await response.text();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

document.querySelector('#printStudent').addEventListener('click', () => {
  openPrintPage('/api/export-student-print');
});

document.querySelector('#printAnswer').addEventListener('click', () => {
  openPrintPage('/api/export-answer-print');
});

document.querySelector('#refreshRecords').addEventListener('click', refreshDashboard);

async function refreshDashboard() {
  const response = await fetch('/api/generated-records');
  const { records, stats } = await response.json();

  document.querySelector('#knowledgeList').innerHTML = stats.highFrequencyKnowledgePoints
    .map((item) => `<button class="chip" type="button" data-kp="${item}">${item}</button>`)
    .join('');

  document.querySelectorAll('[data-kp]').forEach((button) => {
    button.addEventListener('click', () => {
      switchPanel('questions');
      panels.questions.elements.knowledgePoint.value = button.dataset.kp;
    });
  });

  const labels = {
    knowledgePoints: '知识点',
    questionPatterns: '题型',
    mistakeReasons: '错因',
    generatedRecords: '生成记录'
  };
  document.querySelector('#seedStats').innerHTML = Object.entries(stats.seedCounts)
    .map(([key, value]) => `<div class="stat-item"><strong>${value}</strong><span>${labels[key] || key}</span></div>`)
    .join('');

  document.querySelector('#recordList').innerHTML = records.length
    ? records.map((record) => `
      <article class="record-item">
        <span>${record.type}</span>
        <strong>${record.title}</strong>
        <time>${new Date(record.createdAt).toLocaleString('zh-CN')}</time>
      </article>
    `).join('')
    : '<p class="empty">还没有生成记录。</p>';
}

refreshDashboard();
refreshConfigStatus();
