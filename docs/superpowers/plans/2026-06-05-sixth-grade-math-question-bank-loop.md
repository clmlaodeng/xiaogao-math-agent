# Sixth Grade Math Question Bank Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable loop where selected Chengdu sixth-grade math exam papers can be split into reviewed questions, searched, and actually used as references for generated questions and weekly papers.

**Architecture:** Keep the current local Node.js app and in-memory MVP style. Add a separate reviewed question bank for teacher-approved OCR/manual split questions, then make generation call a retrieval step before falling back to templates. Exam paper images remain in the paper bank; only reviewed text questions become usable generation sources.

**Tech Stack:** Node.js ESM server, vanilla HTML/CSS/JS frontend, `node:test`, local JSON index files, no new external dependencies in this phase.

---

## File Structure

- Modify `src/generator.js`: add reviewed question bank state, split-question import, search/retrieval, generation source modes, dashboard data.
- Modify `src/server.js`: add APIs for sixth-grade paper listing, reviewed question import, reviewed question search, and generation options.
- Modify `public/index.html`: add “真题拆题审核” panel and generation source mode controls.
- Modify `public/app.js`: render sixth-grade paper selector, page preview, split-question editor, reviewed question cards, and reference traces in generated output.
- Modify `public/styles.css`: style split-review workspace, reviewed question cards, reference trace blocks.
- Modify `tests/generator.test.js`: add tests for reviewed question import, search, generation references, and source mode fallback.
- Create `data/sixth-grade-reviewed-seed.json`: a tiny local seed for one reviewed sixth-grade math paper, used for demo and tests.

---

### Task 1: Add Reviewed Question Bank Model

**Files:**
- Modify: `src/generator.js`
- Test: `tests/generator.test.js`

- [ ] **Step 1: Write failing tests for reviewed question import**

Append this test to `tests/generator.test.js`:

```js
test('imports reviewed sixth-grade math questions with source metadata', () => {
  resetRecords();

  const result = importReviewedQuestions({
    sourceName: '成都高新区六上2024-2025数学期末卷',
    questions: [
      {
        questionText: '一件商品先降价20%，再涨价20%，现在售价96元。原价是多少元？',
        answerText: '100元',
        analysisText: '现价对应原价的80%×120%=96%，所以原价为96÷96%=100元。',
        grade: '六年级',
        district: '高新区',
        year: '2024-2025',
        pageNumber: 2,
        questionNumber: '8',
        knowledgePoint: '连续变化百分数',
        patternName: '连续百分数变化',
        difficulty: '中档',
        mistakeReason: '单位 1 变化'
      }
    ]
  });

  const stats = getDashboardStats();
  assert.equal(result.imported.length, 1);
  assert.equal(result.imported[0].status, '可用');
  assert.equal(stats.seedCounts.reviewedQuestions, 1);
  assert.equal(stats.reviewedQuestionBank[0].sourceName, '成都高新区六上2024-2025数学期末卷');
  assert.equal(getGeneratedRecords()[0].type, '真题拆题入库');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test
```

Expected: FAIL with `importReviewedQuestions is not defined`.

- [ ] **Step 3: Export the new function from the test import list**

Update the import block in `tests/generator.test.js`:

```js
import {
  generateQuestions,
  variantFromMistake,
  generatePaper,
  generateParentFeedback,
  exportPrintableHtml,
  importQuestionBank,
  importStructuredQuestionBank,
  importExamPaperBank,
  importReviewedQuestions,
  getDashboardStats,
  getGeneratedRecords,
  resetRecords
} from '../src/generator.js';
```

- [ ] **Step 4: Implement reviewed bank state and import**

In `src/generator.js`, after `const importedExamPapers = [];`, add:

```js
const reviewedQuestionBank = [];
```

After `getExamPaperCounts()`, add:

```js
function getReviewedQuestionView(limit = 60) {
  return reviewedQuestionBank.slice(0, limit).map((item) => ({
    id: item.id,
    sourceName: item.sourceName,
    sourceId: item.sourceId || '',
    questionText: item.questionText,
    preview: summarizeQuestionText(item.questionText, 130),
    answerText: item.answerText || '',
    analysisText: summarizeQuestionText(item.analysisText || '', 140),
    grade: item.grade,
    district: item.district,
    year: item.year,
    pageNumber: item.pageNumber,
    questionNumber: item.questionNumber,
    knowledgePoint: item.knowledgePoint,
    patternName: item.patternName,
    difficulty: item.difficulty,
    mistakeReason: item.mistakeReason,
    status: item.status,
    usageCount: item.usageCount || 0
  }));
}

function getReviewedQuestionCounts() {
  return reviewedQuestionBank.reduce((counts, item) => {
    counts[item.knowledgePoint] = (counts[item.knowledgePoint] || 0) + 1;
    return counts;
  }, {});
}
```

After `importExamPaperBank`, add:

```js
export function importReviewedQuestions(options = {}) {
  const sourceName = options.sourceName || '六年级数学真题拆题';
  const questions = Array.isArray(options.questions) ? options.questions : [];
  const imported = questions
    .filter((item) => String(item.questionText || '').trim().length >= 8)
    .map((item, index) => {
      const classification = classifyQuestionText(`${item.questionText}\n${item.knowledgePoint || ''}\n${item.patternName || ''}`);
      return {
        id: `reviewed-${Date.now()}-${index}`,
        sourceName,
        sourceId: item.sourceId || '',
        questionText: String(item.questionText || '').trim(),
        answerText: String(item.answerText || '').trim(),
        analysisText: String(item.analysisText || '').trim(),
        grade: item.grade || '六年级',
        district: item.district || '成都',
        year: item.year || '2024-2025',
        pageNumber: item.pageNumber || '',
        questionNumber: item.questionNumber || '',
        knowledgePoint: item.knowledgePoint || classification.knowledgePoint,
        patternName: item.patternName || classification.knowledgePoint,
        difficulty: item.difficulty || '中档',
        mistakeReason: item.mistakeReason || classification.mistakeReason,
        category: classification.category,
        status: '可用',
        usageCount: 0,
        importedAt: new Date().toISOString()
      };
    });

  reviewedQuestionBank.unshift(...imported);
  const result = {
    sourceName,
    imported,
    summary: `已将《${sourceName}》中的 ${imported.length} 道六年级数学题确认入可用题库。`
  };
  addRecord('真题拆题入库', sourceName, result);
  return result;
}
```

- [ ] **Step 5: Add reviewed bank to reset and dashboard**

In `resetRecords()`, add:

```js
reviewedQuestionBank.length = 0;
```

In `getDashboardStats()`, add these properties near imported paper data:

```js
reviewedQuestionBank: getReviewedQuestionView(),
reviewedQuestionCounts: getReviewedQuestionCounts(),
```

In `seedCounts`, add:

```js
reviewedQuestions: reviewedQuestionBank.length
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```powershell
npm test
```

Expected: all tests pass after the new test is implemented.

---

### Task 2: Add Reviewed Question Search

**Files:**
- Modify: `src/generator.js`
- Test: `tests/generator.test.js`

- [ ] **Step 1: Write failing search test**

Append:

```js
test('searches reviewed questions by grade, knowledge point and weakness', () => {
  resetRecords();

  importReviewedQuestions({
    sourceName: '成都高新区六上2024-2025数学期末卷',
    questions: [
      {
        questionText: '一件商品先降价20%，再涨价20%，现在售价96元。原价是多少元？',
        answerText: '100元',
        grade: '六年级',
        knowledgePoint: '连续变化百分数',
        patternName: '连续百分数变化',
        mistakeReason: '单位 1 变化'
      },
      {
        questionText: '甲单独完成一项工程需要12天，乙单独完成需要18天。两人合作3天后，剩下由甲完成。',
        answerText: '7天',
        grade: '六年级',
        knowledgePoint: '工程问题',
        patternName: '合作后单独完成',
        mistakeReason: '效率比和时间比混淆'
      }
    ]
  });

  const result = searchReviewedQuestions({
    grade: '六年级',
    knowledgePoint: '连续变化百分数',
    weakness: '单位 1 变化',
    limit: 3
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].knowledgePoint, '连续变化百分数');
  assert.ok(result[0].score > 0);
});
```

- [ ] **Step 2: Update test imports**

Add `searchReviewedQuestions` to the import block:

```js
searchReviewedQuestions,
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```powershell
npm test
```

Expected: FAIL with `searchReviewedQuestions is not defined`.

- [ ] **Step 4: Implement simple rule search**

In `src/generator.js`, after `findImportedReference`, add:

```js
function scoreReviewedQuestion(item, options = {}) {
  let score = 0;
  const grade = options.grade || '六年级';
  const knowledgePoint = options.knowledgePoint || '';
  const weakness = options.weakness || '';

  if (item.grade === grade) score += 5;
  if (knowledgePoint && item.knowledgePoint === knowledgePoint) score += 10;
  if (knowledgePoint && item.patternName.includes(knowledgePoint)) score += 4;
  if (weakness && item.mistakeReason.includes(weakness)) score += 5;
  if (weakness && item.questionText.includes(weakness)) score += 2;
  if (item.status === '可用') score += 3;
  return score;
}

export function searchReviewedQuestions(options = {}) {
  const limit = clampCount(options.limit, 5, 1, 20);
  return reviewedQuestionBank
    .map((item) => ({ ...item, score: scoreReviewedQuestion(item, options) }))
    .filter((item) => item.score > 0 && item.status === '可用')
    .sort((a, b) => b.score - a.score || a.usageCount - b.usageCount)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      sourceName: item.sourceName,
      questionText: item.questionText,
      answerText: item.answerText,
      analysisText: item.analysisText,
      grade: item.grade,
      district: item.district,
      year: item.year,
      pageNumber: item.pageNumber,
      questionNumber: item.questionNumber,
      knowledgePoint: item.knowledgePoint,
      patternName: item.patternName,
      difficulty: item.difficulty,
      mistakeReason: item.mistakeReason,
      score: item.score
    }));
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

---

### Task 3: Make Generation Actually Use Reviewed Questions

**Files:**
- Modify: `src/generator.js`
- Test: `tests/generator.test.js`

- [ ] **Step 1: Write failing generation mode test**

Append:

```js
test('generates questions from reviewed bank in source modes', () => {
  resetRecords();

  importReviewedQuestions({
    sourceName: '成都高新区六上2024-2025数学期末卷',
    questions: [
      {
        questionText: '一件商品先降价20%，再涨价20%，现在售价96元。原价是多少元？',
        answerText: '100元',
        analysisText: '现价对应原价的96%。',
        grade: '六年级',
        district: '高新区',
        year: '2024-2025',
        pageNumber: 2,
        questionNumber: '8',
        knowledgePoint: '连续变化百分数',
        patternName: '连续百分数变化',
        mistakeReason: '单位 1 变化'
      }
    ]
  });

  const original = generateQuestions({
    grade: '六年级',
    knowledgePoint: '连续变化百分数',
    weakness: '单位 1 变化',
    count: 3,
    sourceMode: 'original'
  });

  assert.equal(original.items[0].sourceUsage, '题库原题');
  assert.ok(original.items[0].question.includes('先降价20%'));
  assert.ok(original.referenceTrace[0].sourceName.includes('高新区'));

  const adapted = generateQuestions({
    grade: '六年级',
    knowledgePoint: '连续变化百分数',
    weakness: '单位 1 变化',
    count: 3,
    sourceMode: 'adapted'
  });

  assert.equal(adapted.items[0].sourceUsage, '题库改编');
  assert.ok(adapted.items[0].importedReference);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test
```

Expected: FAIL because `sourceMode` and `referenceTrace` are not implemented.

- [ ] **Step 3: Add source trace helper**

In `src/generator.js`, before `buildQuestion`, add:

```js
function makeReferenceTrace(reference, sourceUsage) {
  return {
    sourceName: reference.sourceName,
    district: reference.district,
    year: reference.year,
    pageNumber: reference.pageNumber,
    questionNumber: reference.questionNumber,
    knowledgePoint: reference.knowledgePoint,
    patternName: reference.patternName,
    sourceUsage
  };
}

function buildOriginalFromReviewed(reference, index) {
  return {
    number: index + 1,
    question: reference.questionText,
    answer: reference.answerText || '待老师补充',
    solution: reference.analysisText || '该题来自已审核题库，正式使用前请老师补充讲评解析。',
    knowledgePoint: reference.knowledgePoint,
    difficulty: reference.difficulty,
    mistakeTip: `易错提醒：${reference.mistakeReason}`,
    trainingValue: `来自${reference.sourceName}的已审核题库原题，适合用于诊断${reference.knowledgePoint}掌握情况。`,
    variationSuggestion: `可围绕“${reference.patternName}”做同模型改编。`,
    sourceUsage: '题库原题',
    importedReference: makeReferenceTrace(reference, '题库原题')
  };
}

function attachReviewedReference(question, reference, sourceUsage) {
  if (!reference) return question;
  return {
    ...question,
    sourceUsage,
    importedReference: makeReferenceTrace(reference, sourceUsage),
    trainingValue: `${question.trainingValue} 参考已审核真题“${reference.patternName}”，来源为${reference.sourceName}。`
  };
}
```

- [ ] **Step 4: Update `generateQuestions` to retrieve first**

Replace the first lines of `generateQuestions(options = {})` with:

```js
export function generateQuestions(options = {}) {
  const count = clampCount(options.count, 3, 3, 10);
  const sourceMode = options.sourceMode || (options.preferImported ? 'adapted' : 'template');
  const references = searchReviewedQuestions({
    grade: options.grade || '六年级',
    knowledgePoint: options.knowledgePoint || '量率对应',
    weakness: options.weakness || '',
    limit: count
  });

  const items = Array.from({ length: count }, (_, index) => {
    const reference = references[index % references.length];
    if (reference && sourceMode === 'original') return buildOriginalFromReviewed(reference, index);
    const generated = buildQuestion(index, { ...options, preferImported: false });
    if (reference && sourceMode === 'adapted') return attachReviewedReference(generated, reference, '题库改编');
    if (reference && sourceMode === 'style') return attachReviewedReference(generated, reference, '真题风格仿写');
    return generated;
  });

  const referenceTrace = items.map((item) => item.importedReference).filter(Boolean);
  const importedReferences = [
    ...referenceTrace,
    ...items.map((item) => item.importedReference).filter(Boolean)
  ];
  const result = {
    title: `${options.grade || '六年级'}${options.knowledgePoint || '量率对应'}专项训练`,
    teacherReviewNotice: '正式发给学生前，请老师审核题目数据、答案唯一性和解析方法边界。',
    referenceTrace,
    importedReferences,
    items
  };
  addRecord('专项题', result.title, result);
  return result;
}
```

- [ ] **Step 5: Remove duplicate old code inside `generateQuestions`**

Ensure the old declarations are removed:

```js
const count = clampCount(options.count, 3, 3, 10);
const items = Array.from({ length: count }, (_, index) => buildQuestion(index, options));
const importedReferences = items.map((item) => item.importedReference).filter(Boolean);
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

---

### Task 4: Add Server APIs for Reviewed Questions and Sixth-Grade Papers

**Files:**
- Modify: `src/server.js`
- Test: add API self-check command after code changes

- [ ] **Step 1: Add imports**

Update `src/server.js` import block from `./generator.js`:

```js
  importReviewedQuestions,
  searchReviewedQuestions,
```

- [ ] **Step 2: Add helper for sixth-grade papers**

After `loadChengduMathExamBank()`, add:

```js
async function loadSixthGradeMathPapers() {
  const bank = await loadChengduMathExamBank();
  return bank.papers.filter((paper) => paper.grade === '六年级');
}
```

- [ ] **Step 3: Add GET API for sixth-grade paper choices**

Inside `handleApi`, before the POST-only guard, add:

```js
    if (request.method === 'GET' && pathname === '/api/sixth-grade-math-papers') {
      sendJson(response, { papers: await loadSixthGradeMathPapers() });
      return;
    }
```

- [ ] **Step 4: Add POST APIs**

Inside the existing POST routing block, after `/api/import-questions`, add:

```js
    else if (pathname === '/api/import-reviewed-questions') {
      sendJson(response, importReviewedQuestions(body));
    }
    else if (pathname === '/api/search-reviewed-questions') {
      sendJson(response, { items: searchReviewedQuestions(body) });
    }
```

- [ ] **Step 5: Run syntax checks**

Run:

```powershell
node --check src\server.js
node --check src\generator.js
```

Expected: no output and exit code 0.

- [ ] **Step 6: Run API self-check**

Run:

```powershell
@'
import http from 'node:http';
import './src/server.js';

const requestJson = (path, body) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : '';
  const request = http.request({
    hostname: '127.0.0.1',
    port: 8787,
    path,
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}
  }, (response) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
  });
  request.on('error', reject);
  request.end(payload);
});

await new Promise((resolve) => setTimeout(resolve, 500));
const papers = await requestJson('/api/sixth-grade-math-papers');
const imported = await requestJson('/api/import-reviewed-questions', {
  sourceName: '成都高新区六上2024-2025数学期末卷',
  questions: [{
    questionText: '一件商品先降价20%，再涨价20%，现在售价96元。原价是多少元？',
    answerText: '100元',
    grade: '六年级',
    knowledgePoint: '连续变化百分数',
    mistakeReason: '单位 1 变化'
  }]
});
const found = await requestJson('/api/search-reviewed-questions', {
  grade: '六年级',
  knowledgePoint: '连续变化百分数',
  weakness: '单位 1 变化'
});
console.log(JSON.stringify({ papers: papers.papers.length, imported: imported.imported.length, found: found.items.length }, null, 2));
process.exit(0);
'@ | node --input-type=module -
```

Expected output has all three counts greater than 0.

---

### Task 5: Add Split-Review UI

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Add nav item and panel**

In `public/index.html`, add a new nav button after “导入题库”:

```html
<button class="nav-item" data-panel="review">真题拆题审核</button>
```

Inside `.panel-stack`, add this form after `importPanel`:

```html
<form id="reviewPanel" class="tool-panel">
  <div class="panel-heading">
    <h3>真题拆题审核</h3>
    <p>先选择六年级数学卷，再粘贴 OCR/人工拆出的题目，确认后进入可用题库。</p>
  </div>
  <section class="selector-block">
    <div class="selector-head">
      <strong>六年级数学卷</strong>
      <span>只处理第一批小升初相关卷</span>
    </div>
    <div id="sixthPaperPicker" class="paper-picker"></div>
  </section>
  <div class="review-layout">
    <div>
      <strong>原卷预览</strong>
      <div id="reviewPaperPreview" class="review-paper-preview"></div>
    </div>
    <div>
      <label>拆题文本<textarea name="reviewText">1. 一件商品先降价20%，再涨价20%，现在售价96元。原价是多少元？
答案：100元
解析：现价对应原价的80%×120%=96%，所以原价为96÷96%=100元。</textarea></label>
      <div class="form-grid">
        <label>知识点<input name="knowledgePoint" value="连续变化百分数"></label>
        <label>错因<input name="mistakeReason" value="单位 1 变化"></label>
        <label>题型结构<input name="patternName" value="连续百分数变化"></label>
        <label>难度<select name="difficulty"><option>基础</option><option selected>中档</option><option>拔高</option></select></label>
      </div>
      <button type="submit" class="primary">确认入可用题库</button>
    </div>
  </div>
</form>
```

- [ ] **Step 2: Add panel wiring**

In `public/app.js`, update `panelTitles`:

```js
review: '真题拆题审核'
```

Update `panels`:

```js
review: document.querySelector('#reviewPanel')
```

- [ ] **Step 3: Add selected paper state and parser**

Near existing state variables, add:

```js
let selectedReviewPaper = null;
```

Add this parser function before event listeners:

```js
function parseReviewedText(text, defaults) {
  return text
    .replace(/\r/g, '\n')
    .split(/\n(?=\s*\d+[\.\、])/)
    .map((block, index) => {
      const clean = block.replace(/^\s*\d+[\.\、]\s*/, '').trim();
      if (!clean) return null;
      const answerMatch = clean.match(/答案[:：]\s*([^\n]+)/);
      const analysisMatch = clean.match(/解析[:：]\s*([\s\S]+)/);
      const questionText = clean
        .replace(/答案[:：]\s*[^\n]+/g, '')
        .replace(/解析[:：][\s\S]+/g, '')
        .trim();
      return {
        questionText,
        answerText: answerMatch?.[1]?.trim() || '',
        analysisText: analysisMatch?.[1]?.trim() || '',
        questionNumber: String(index + 1),
        ...defaults
      };
    })
    .filter((item) => item && item.questionText.length >= 8);
}
```

- [ ] **Step 4: Render sixth-grade papers**

Add:

```js
async function loadSixthGradePapers() {
  const response = await fetch('/api/sixth-grade-math-papers');
  const { papers } = await response.json();
  const picker = document.querySelector('#sixthPaperPicker');
  if (!picker) return;
  selectedReviewPaper = selectedReviewPaper || papers[0] || null;
  picker.innerHTML = papers.map((paper) => `
    <button class="choice ${selectedReviewPaper?.id === paper.id ? 'active' : ''}" type="button" data-review-paper="${paper.id}">
      <strong>${escapeHtml(paper.title)}</strong>
      <span>${escapeHtml(paper.district)} · ${paper.pageCount}页</span>
    </button>
  `).join('');
  document.querySelectorAll('[data-review-paper]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedReviewPaper = papers.find((paper) => paper.id === button.dataset.reviewPaper);
      renderReviewPaperPreview();
      loadSixthGradePapers();
    });
  });
  renderReviewPaperPreview();
}

function renderReviewPaperPreview() {
  const preview = document.querySelector('#reviewPaperPreview');
  if (!preview) return;
  preview.innerHTML = selectedReviewPaper
    ? selectedReviewPaper.images.slice(0, 4).map((image) => `<img src="${imageUrl(image)}" alt="六年级数学卷页">`).join('')
    : '<p class="empty">未找到六年级数学卷。</p>';
}
```

- [ ] **Step 5: Add submit behavior**

After import panel submit handler, add:

```js
panels.review.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedReviewPaper) {
    showResult('未选择卷子', '请先选择一套六年级数学卷。');
    return;
  }
  const data = formData(event.currentTarget);
  const questions = parseReviewedText(data.reviewText, {
    grade: '六年级',
    district: selectedReviewPaper.district,
    year: selectedReviewPaper.year,
    pageNumber: 1,
    sourceId: selectedReviewPaper.id,
    knowledgePoint: data.knowledgePoint,
    patternName: data.patternName,
    difficulty: data.difficulty,
    mistakeReason: data.mistakeReason
  });
  const result = await postJson('/api/import-reviewed-questions', {
    sourceName: selectedReviewPaper.title,
    questions
  });
  showResult('真题拆题入库结果', formatImportResult(result));
});
```

- [ ] **Step 6: Load papers on startup**

At the bottom of `public/app.js`, before or after `refreshDashboard();`, add:

```js
loadSixthGradePapers();
```

- [ ] **Step 7: Add styles**

Append to `public/styles.css`:

```css
.paper-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.review-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(280px, 1.1fr);
  gap: 14px;
}

.review-paper-preview {
  display: grid;
  gap: 10px;
  max-height: 560px;
  overflow: auto;
}

.review-paper-preview img {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}

@media (max-width: 980px) {
  .paper-picker,
  .review-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 8: Run browser-free checks**

Run:

```powershell
node --check public\app.js
node --check src\server.js
npm test
```

Expected: syntax checks pass and tests pass.

---

### Task 6: Add Generation Source Mode Controls

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`

- [ ] **Step 1: Add source mode selector**

In `questionsPanel`, inside `.form-grid`, after the `preferImported` checkbox, add:

```html
<label>题库引用模式
  <select name="sourceMode">
    <option value="adapted" selected>优先题库改编</option>
    <option value="original">优先题库原题</option>
    <option value="style">真题风格仿写</option>
    <option value="template">题库不足再原创</option>
  </select>
</label>
```

- [ ] **Step 2: Ensure submit sends `sourceMode`**

No special code is needed because `formData()` already captures it. Verify `panels.questions` submit still includes:

```js
const data = formData(event.currentTarget);
```

- [ ] **Step 3: Improve reference output formatting**

In `formatQuestions(result)`, replace the existing `references` block with:

```js
  const references = result.referenceTrace?.length
    ? [
      '【题库引用依据】',
      ...result.referenceTrace.slice(0, 5).map((item, index) =>
        `${index + 1}. ${item.sourceName}${item.pageNumber ? ` 第${item.pageNumber}页` : ''}${item.questionNumber ? ` 第${item.questionNumber}题` : ''}\n知识点：${item.knowledgePoint}\n题型结构：${item.patternName}\n使用方式：${item.sourceUsage}`
      ),
      ''
    ]
    : [];
```

- [ ] **Step 4: Run checks**

Run:

```powershell
node --check public\app.js
npm test
```

Expected: all pass.

---

### Task 7: Add Demo Seed for Immediate Usability

**Files:**
- Create: `data/sixth-grade-reviewed-seed.json`
- Modify: `src/server.js`
- Test: API self-check

- [ ] **Step 1: Create seed file**

Create `data/sixth-grade-reviewed-seed.json`:

```json
{
  "sourceName": "成都六年级数学演示拆题",
  "questions": [
    {
      "questionText": "一件商品先降价20%，再涨价20%，现在售价96元。原价是多少元？",
      "answerText": "100元",
      "analysisText": "降价后是原价的80%，再涨价20%是以降价后的价格为单位1，所以现价对应原价的80%×120%=96%，原价为96÷96%=100元。",
      "grade": "六年级",
      "district": "高新区",
      "year": "2024-2025",
      "pageNumber": 2,
      "questionNumber": "8",
      "knowledgePoint": "连续变化百分数",
      "patternName": "连续百分数变化",
      "difficulty": "中档",
      "mistakeReason": "单位 1 变化"
    },
    {
      "questionText": "甲单独完成一项工程需要12天，乙单独完成需要18天。两人合作3天后，剩下由甲完成，甲还需要多少天？",
      "answerText": "7天",
      "analysisText": "总工程看作1，甲效率1/12，乙效率1/18。合作3天完成3×(1/12+1/18)=5/12，剩下7/12，由甲完成需要7天。",
      "grade": "六年级",
      "district": "温江",
      "year": "2024-2025",
      "pageNumber": 3,
      "questionNumber": "12",
      "knowledgePoint": "工程问题",
      "patternName": "合作后单独完成",
      "difficulty": "中档",
      "mistakeReason": "效率比和时间比混淆"
    }
  ]
}
```

- [ ] **Step 2: Add import-source support for demo seed**

In `src/server.js`, inside `/api/import-source` route before final error, add:

```js
      if (body.sourceName === '六年级数学演示拆题') {
        const seed = JSON.parse(await readFile(join(root, 'data', 'sixth-grade-reviewed-seed.json'), 'utf8'));
        sendJson(response, importReviewedQuestions(seed));
        return;
      }
```

- [ ] **Step 3: Add source entry**

In `src/data.js`, add one source object before “成都期末数学真题卷库”:

```js
  {
    name: '六年级数学演示拆题',
    license: '本地演示数据',
    url: '#',
    usableNow: true,
    note: '用于演示“已审核真题 -> 检索引用 -> 改编生成”的最小闭环。'
  },
```

- [ ] **Step 4: API self-check**

Run:

```powershell
@'
import http from 'node:http';
import './src/server.js';

const requestJson = (path, body) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : '';
  const request = http.request({
    hostname: '127.0.0.1',
    port: 8787,
    path,
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}
  }, (response) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
  });
  request.on('error', reject);
  request.end(payload);
});

await new Promise((resolve) => setTimeout(resolve, 500));
await requestJson('/api/import-source', { sourceName: '六年级数学演示拆题' });
const generated = await requestJson('/api/generate-questions', {
  grade: '六年级',
  knowledgePoint: '连续变化百分数',
  weakness: '单位 1 变化',
  count: 3,
  sourceMode: 'adapted'
});
console.log(JSON.stringify({ references: generated.referenceTrace.length, firstUsage: generated.items[0].sourceUsage }, null, 2));
process.exit(0);
'@ | node --input-type=module -
```

Expected:

```json
{
  "references": 3,
  "firstUsage": "题库改编"
}
```

---

### Task 8: Final Verification

**Files:**
- No source edits unless checks fail.

- [ ] **Step 1: Run full automated checks**

Run:

```powershell
node --check public\app.js
node --check src\server.js
node --check src\generator.js
npm test
```

Expected: all syntax checks pass and all tests pass.

- [ ] **Step 2: Manual local flow**

Start app:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:8787/
```

Manual acceptance:

- Click “题库来源” -> `六年级数学演示拆题` -> “导入”.
- Go to “生成专项题”.
- Set 知识点为 `连续变化百分数`.
- Set 薄弱点为 `单位 1 变化`.
- Set 题库引用模式为 `优先题库改编`.
- Generate.
- Confirm output shows `【题库引用依据】`.
- Confirm generated questions have `使用方式：题库改编`.
- Confirm Word/打印导出 still works.

- [ ] **Step 3: Record known limitation in final response**

State clearly:

```text
当前版本已经让“已审核逐题题库”参与生成；整卷图片仍需要 OCR/人工拆题后才能成为可用题库。
```

---

## Self-Review

Spec coverage:
- Six-grade-only scope is covered by Task 4 and Task 5.
- Semi-automatic split and teacher review is covered by Task 5.
- Reviewed usable question bank is covered by Task 1 and Task 7.
- Search and retrieval is covered by Task 2.
- Generation actually using references is covered by Task 3 and Task 6.
- Demo flow is covered by Task 7 and Task 8.

Placeholder scan:
- No `TBD`, `TODO`, or vague implementation steps remain.
- Every code-changing task includes concrete code snippets or exact replacement text.

Type consistency:
- Reviewed question fields use the same names across tests, server, generator, and frontend: `questionText`, `answerText`, `analysisText`, `knowledgePoint`, `patternName`, `mistakeReason`, `sourceMode`, `referenceTrace`.
