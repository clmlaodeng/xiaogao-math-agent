const fs = require('fs');
const path = require('path');

const root = path.resolve('成都期末考试真题3-9上册');
const out = path.resolve('data/chengdu-math-exam-bank.json');
const gradeOrder = {
  '三年级': 3,
  '四年级': 4,
  '五年级': 5,
  '六年级': 6,
  '七年级': 7,
  '八年级': 8,
  '九年级': 9
};

function inferDistrict(name) {
  const districts = ['高新区', '天府新区', '锦江', '青羊', '金牛', '武侯', '成华', '龙泉驿', '青白江', '新都', '温江', '双流'];
  return districts.find((district) => name.includes(district)) || '成都';
}

function inferYear(name) {
  if (/24[-～~]25|2024[-～~]2025/.test(name)) return '2024-2025';
  const match = name.match(/20\d{2}/);
  return match ? match[0] : '年份待确认';
}

function inferSemester(name) {
  if (/上|七上|三上|四上|五上|六上|八上|九上/.test(name)) return '上册';
  if (/下/.test(name)) return '下册';
  return '上册';
}

function normalizeSlash(value) {
  return value.split(path.sep).join('/');
}

function readDirs(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).filter((item) => item.isDirectory());
}

const papers = [];
for (const gradeDir of readDirs(root)) {
  const gradePath = path.join(root, gradeDir.name);
  const mathDirs = readDirs(gradePath).filter((dir) => dir.name.includes('数学'));

  for (const dir of mathDirs) {
    const paperPath = path.join(gradePath, dir.name);
    const images = fs.readdirSync(paperPath, { withFileTypes: true })
      .filter((file) => file.isFile() && /\.(jpe?g|png)$/i.test(file.name))
      .map((file) => normalizeSlash(path.relative(process.cwd(), path.join(paperPath, file.name))))
      .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

    if (!images.length) continue;
    papers.push({
      id: `chengdu-math-${String(papers.length + 1).padStart(3, '0')}`,
      title: dir.name,
      grade: gradeDir.name,
      gradeNumber: gradeOrder[gradeDir.name] || 0,
      subject: '数学',
      district: inferDistrict(dir.name),
      year: inferYear(dir.name),
      semester: inferSemester(dir.name),
      sourceFolder: normalizeSlash(path.relative(process.cwd(), paperPath)),
      pageCount: images.length,
      images,
      coverImage: images[0],
      status: '待OCR拆题',
      usageNote: '图片版真题卷已入库，可用于老师预览、人工审核和后续OCR拆题；未授权前不建议直接作为商业题目文本分发。'
    });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  sourceRoot: normalizeSlash(path.relative(process.cwd(), root)),
  subject: '数学',
  paperCount: papers.length,
  imageCount: papers.reduce((sum, paper) => sum + paper.pageCount, 0),
  papers
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify({
  paperCount: summary.paperCount,
  imageCount: summary.imageCount,
  out: normalizeSlash(path.relative(process.cwd(), out))
}, null, 2));
