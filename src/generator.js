import { generateWithDeepSeek } from './deepseek.js';
import { analyzeHomeworkImages } from './vision.js';

const records = [];

const knowledgePoints = [
  { name: '量率对应', category: '应用题', mistakes: ['单位 1 找错', '分率和实际量对应错误'] },
  { name: '工程问题', category: '应用题', mistakes: ['工作总量没有统一为 1', '效率比和时间比混淆'] },
  { name: '行程问题', category: '应用题', mistakes: ['速度方向判断错误', '相遇和追及关系混用'] },
  { name: '连续变化百分数', category: '百分数', mistakes: ['两次变化的单位 1 不同', '误以为一降一涨可以抵消'] },
  { name: '面积比', category: '几何', mistakes: ['把边长比直接当面积比', '没有先判断等高关系'] },
  { name: '圆与扇形', category: '几何', mistakes: ['周长和面积公式混用', '忘记乘圆心角占比'] },
  { name: '比的应用', category: '比例', mistakes: ['比和具体数量没有对应', '份数和实际量换算错误'] },
  { name: '平均数问题', category: '统计', mistakes: ['只看平均数不看总量', '人数变化后总量没更新'] }
];

const scenes = ['成都地铁换乘', '校园图书整理', '天府绿道骑行', '社团义卖活动', '研学公交安排', '班级展板制作', '运动会报名统计', '文创店优惠'];

function pick(list, index) {
  return list[index % list.length];
}

function clamp(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function addRecord(type, title, payload, source = 'template') {
  records.unshift({
    id: `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    source,
    createdAt: new Date().toISOString(),
    payload
  });
  if (records.length > 30) records.pop();
}

function getKnowledgePoint(name = '量率对应') {
  return knowledgePoints.find((item) => item.name === name) || knowledgePoints[0];
}

function attachAi(result, aiResult) {
  return {
    ...result,
    aiContent: aiResult.content,
    source: aiResult.source,
    model: aiResult.model,
    note: aiResult.note || '',
    usage: aiResult.usage || null
  };
}

async function withDeepSeek({ task, input, fallbackContent, result, recordType, recordTitle }) {
  const aiResult = input.useAi === false
    ? {
      content: fallbackContent,
      source: 'template',
      model: 'local-template',
      note: '已关闭 DeepSeek，使用本地模板。'
    }
    : await generateWithDeepSeek({ task, input, fallbackContent });
  addRecord(recordType, recordTitle || result.title, aiResult.content, aiResult.source);
  return attachAi(result, aiResult);
}

function buildRateQuestion(index, options) {
  const total = pick([240, 300, 360, 420, 480], index);
  const doneRate = pick([25, 30, 40, 45, 60], index);
  const remaining = total * (100 - doneRate) / 100;
  return {
    number: index + 1,
    question: `${pick(scenes, index)}中，六年级同学计划整理 ${total} 本图书，第一天完成了总数的 ${doneRate}%。还剩多少本没有整理？`,
    answer: `${remaining} 本`,
    solution: `把 ${total} 本看作单位 1。剩下的占 ${100 - doneRate}%，所以剩下 ${total}×${100 - doneRate}%=${remaining} 本。`,
    knowledgePoint: '量率对应',
    difficulty: options.difficulty || '中档',
    mistakeTip: '先判断谁是单位 1，再找分率对应的实际量。',
    variationSuggestion: '可以改成“已知剩下数量，反求总数”。'
  };
}

function buildEngineeringQuestion(index, options) {
  const cases = [
    { a: 12, b: 18, together: 3, answer: 7 },
    { a: 8, b: 12, together: 3, answer: 3 },
    { a: 15, b: 30, together: 6, answer: 6 },
    { a: 9, b: 18, together: 4, answer: 3 }
  ];
  const item = pick(cases, index);
  return {
    number: index + 1,
    question: `${pick(scenes, index)}中，甲队单独完成一项布置需要 ${item.a} 天，乙队单独完成需要 ${item.b} 天。两队先合作 ${item.together} 天，剩下由甲队单独完成，还需要多少天？`,
    answer: `${item.answer} 天`,
    solution: `把总工作量看作 1。甲每天做 1/${item.a}，乙每天做 1/${item.b}，合作 ${item.together} 天后，用剩余工作量除以甲的效率，得到 ${item.answer} 天。`,
    knowledgePoint: '工程问题',
    difficulty: options.difficulty || '中档',
    mistakeTip: '工程问题先统一总量为 1，再处理效率。',
    variationSuggestion: '可以改成剩下由乙完成，或先甲单独做再合作。'
  };
}

function buildTravelQuestion(index, options) {
  const distance = pick([18, 24, 30, 36], index);
  const aSpeed = pick([12, 15, 18, 20], index);
  const bSpeed = pick([6, 9, 12, 16], index);
  const time = Number((distance / (aSpeed + bSpeed)).toFixed(2));
  return {
    number: index + 1,
    question: `${pick(scenes, index)}中，甲、乙两人从相距 ${distance} 千米的两地同时相向出发，甲每小时行 ${aSpeed} 千米，乙每小时行 ${bSpeed} 千米。几小时后相遇？`,
    answer: `${time} 小时`,
    solution: `相向而行用速度和。相遇时间=${distance}÷(${aSpeed}+${bSpeed})=${time} 小时。`,
    knowledgePoint: '行程问题',
    difficulty: options.difficulty || '基础',
    mistakeTip: '先判断相向、同向还是追及，再决定用速度和还是速度差。',
    variationSuggestion: '可以改成同向追及，训练速度差。'
  };
}

function buildPercentQuestion(index, options) {
  const cases = [
    { current: 96, down: 20, up: 20, origin: 100 },
    { current: 120, down: 20, up: 20, origin: 125 },
    { current: 216, down: 10, up: 20, origin: 200 },
    { current: 150, down: 20, up: 25, origin: 150 }
  ];
  const item = pick(cases, index);
  return {
    number: index + 1,
    question: `${pick(scenes, index)}中，一件商品先降价 ${item.down}%，再涨价 ${item.up}%，现在售价是 ${item.current} 元。原价是多少元？`,
    answer: `${item.origin} 元`,
    solution: `降价后是原价的 ${100 - item.down}%，再涨价后是原价的 ${100 - item.down}%×${100 + item.up}%。现在售价对应原价的 ${(100 - item.down) * (100 + item.up) / 100}%，所以原价为 ${item.origin} 元。`,
    knowledgePoint: '连续变化百分数',
    difficulty: options.difficulty || '中档',
    mistakeTip: '两次百分数变化的单位 1 不同，不能直接抵消。',
    variationSuggestion: '可以改成先涨后降，或已知原价求现价。'
  };
}

function buildAreaQuestion(index, options) {
  const area = pick([45, 60, 75, 90], index);
  const answer = area * 2 / 3;
  return {
    number: index + 1,
    question: `三角形 ABC 中，D 在 BC 上，BD:DC=3:2，连接 AD。若三角形 ABD 的面积是 ${area} 平方厘米，求三角形 ADC 的面积。`,
    answer: `${answer} 平方厘米`,
    solution: `两个三角形共用从 A 到 BC 的高，面积比等于底边比。BD:DC=3:2，所以面积比也是 3:2。ABD 是 ${area}，一份是 ${area}÷3=${area / 3}，ADC 是 2 份，即 ${answer} 平方厘米。`,
    knowledgePoint: '面积比',
    difficulty: options.difficulty || '中档',
    mistakeTip: '先判断是否等高，再用底边比对应面积比。',
    variationSuggestion: '可以改成给总面积，分别求两个三角形面积。'
  };
}

function buildCircleQuestion(index, options) {
  const r = pick([6, 8, 10, 12], index);
  const angle = pick([90, 120, 72, 150], index);
  const answer = Number((3.14 * r * r * angle / 360).toFixed(2));
  return {
    number: index + 1,
    question: `一个半径为 ${r} 厘米的圆中，有一个圆心角为 ${angle}° 的扇形。求这个扇形的面积。（π 按 3.14 计算）`,
    answer: `${answer} 平方厘米`,
    solution: `先求整圆面积：3.14×${r}×${r}。扇形占整圆的 ${angle}/360，所以扇形面积为 3.14×${r}×${r}×${angle}/360=${answer} 平方厘米。`,
    knowledgePoint: '圆与扇形',
    difficulty: options.difficulty || '中档',
    mistakeTip: '面积用 πr²，扇形还要乘圆心角占比。',
    variationSuggestion: '可以改成已知扇形面积反求圆心角。'
  };
}

function buildRatioQuestion(index, options) {
  const total = pick([180, 240, 300, 360], index);
  const a = pick([2, 3, 4, 5], index);
  const b = pick([3, 5, 7, 4], index);
  const one = total / (a + b);
  return {
    number: index + 1,
    question: `${pick(scenes, index)}中，甲、乙两组共完成 ${total} 份材料，完成数量比是 ${a}:${b}。甲组完成多少份？`,
    answer: `${one * a} 份`,
    solution: `总份数是 ${a}+${b}=${a + b} 份，一份是 ${total}÷${a + b}=${one}，甲组是 ${a} 份，所以是 ${one * a} 份。`,
    knowledgePoint: '比的应用',
    difficulty: options.difficulty || '基础',
    mistakeTip: '先找总份数，再找一份对应多少实际量。',
    variationSuggestion: '可以改成已知差量，反求总量。'
  };
}

function buildAverageQuestion(index, options) {
  const oldCount = pick([4, 5, 6, 8], index);
  const oldAvg = pick([82, 84, 86, 88], index);
  const newScore = pick([94, 96, 98, 100], index);
  const newAvg = Number(((oldCount * oldAvg + newScore) / (oldCount + 1)).toFixed(1));
  return {
    number: index + 1,
    question: `某小组原来 ${oldCount} 名同学平均分是 ${oldAvg} 分，又加入 1 名同学，他的成绩是 ${newScore} 分。现在小组平均分是多少？`,
    answer: `${newAvg} 分`,
    solution: `先求总分：${oldCount}×${oldAvg}+${newScore}=${oldCount * oldAvg + newScore}，再除以现在人数 ${oldCount + 1}，平均分是 ${newAvg} 分。`,
    knowledgePoint: '平均数问题',
    difficulty: options.difficulty || '基础',
    mistakeTip: '平均数变化要先看总量变化，不能只比较平均数。',
    variationSuggestion: '可以改成已知新平均分，反求新增同学成绩。'
  };
}

function buildChartChoiceQuestion(number = 1) {
  return {
    number,
    question: '为了比较五年级（1）班和五年级（2）班每月阅读课外书的数量，适合选择哪种统计图？如果要观察某地区一年中每月平均气温的变化趋势，适合选择哪种统计图？',
    answer: '比较两个班每月阅读数量适合用复式条形统计图；观察平均气温变化趋势适合用折线统计图。',
    solution: '条形统计图适合比较数量多少；折线统计图适合观察数量随时间变化的趋势。题目中“两个班对比”看数量差异，用复式条形统计图；“一年中每月气温变化”看趋势，用折线统计图。',
    knowledgePoint: '统计图选择',
    difficulty: '基础',
    mistakeTip: '先判断题目要“比较数量”还是“观察变化趋势”。',
    variationSuggestion: '可以换成降雨量、身高变化、图书借阅量等场景辨析。'
  };
}

function buildJudgeScoreQuestion(number = 1) {
  return {
    number,
    question: '五位评委给一幅书法作品打分。如果去掉一个最高分和一个最低分后，剩下 3 位评委的平均分是 9.45 分；如果只去掉一个最低分，剩下 4 位评委的平均分是 9.55 分。最高分是多少分？',
    answer: '9.85 分',
    solution: '去掉最高分和最低分后，3 位评委总分是 9.45×3=28.35 分。只去掉最低分后，4 位评委总分是 9.55×4=38.2 分。最高分=38.2-28.35=9.85 分。',
    knowledgePoint: '平均数问题',
    difficulty: '中档',
    mistakeTip: '平均分问题先转化成总分；小数乘法算完要估算是否合理。',
    variationSuggestion: '可以改成求最低分，或给不同人数的平均分反推某个分数。'
  };
}

function buildReturnRouteQuestion(number = 1) {
  return {
    number,
    question: '学校 8:20 开始上课。乐乐 7:50 从家出发，先走 200 米到养鱼塘，发现没带课本后返回家取书，再按原路经过养鱼塘，走 300 米到广播站，又走 250 米到学校。乐乐每分钟走 50 米，会迟到吗？',
    answer: '不会迟到。',
    solution: '完整路程要包含折返：家到养鱼塘 200 米，养鱼塘返回家 200 米，再从家到养鱼塘 200 米，养鱼塘到广播站 300 米，广播站到学校 250 米，总路程 200+200+200+300+250=1150 米。用时 1150÷50=23 分钟。7:50 出发，23 分钟后是 8:13，早于 8:20，所以不会迟到。',
    knowledgePoint: '折返行程问题',
    difficulty: '中档',
    mistakeTip: '遇到折返路线要按实际走过的每一段累加，不能只算起点到终点的直线路程。',
    variationSuggestion: '可以改变出发时间、速度或折返点，训练完整路径梳理。'
  };
}

function buildDecimalCheckQuestion(number = 1) {
  return {
    number,
    question: '计算并验算：9.45×3。再判断 19.35 是否可能是 9.45×3 的结果，并说明理由。',
    answer: '9.45×3=28.35，19.35 不可能是正确结果。',
    solution: '9×3=27，0.45×3=1.35，合起来是 28.35。估算时 9.45 接近 9.5，9.5×3=28.5，所以结果应接近 28.5，不可能是 19.35。',
    knowledgePoint: '小数乘整数',
    difficulty: '基础',
    mistakeTip: '小数计算后要用估算检查结果是否在合理范围内。',
    variationSuggestion: '可以改成 8.75×4、7.28×5 等小数乘整数验算题。'
  };
}

function textHas(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function makeDiagnostic(number, title, status, summary, supplementType = '') {
  return {
    number,
    title,
    status,
    summary,
    needsSupplement: status !== 'correct',
    supplementType
  };
}

function buildExerciseDiagnostics(analysisText) {
  const text = String(analysisText || '');
  const diagnostics = [];
  const hasChart = textHas(text, [/统计图|条形|折线/, /缁熻.?鍥|鏉.?舰|鎶.?绾/]);
  const chartWrong = textHas(text, [/第\s*1\s*题[^。；\n]*(错误|不对|不准确|混淆)|统计图[^。；\n]*(错误|不对|混淆|不准确)/, /绗.\s*1\s*.?棰.*(閿|涓嶅)/]);
  const chartCorrect = hasChart && textHas(text, [/第\s*1\s*题[^。；\n]*(正确|打勾|掌握|做得好|到位)|统计图[^。；\n]*(正确|掌握|到位)/, /绗.\s*1\s*.?棰.*(姝|鎵|鎺)/]);
  if (chartCorrect) {
    diagnostics.push(makeDiagnostic(1, '统计图选择', 'correct', '统计图类型选择正确，可作为本次表现亮点记录。'));
  } else if (chartWrong) {
    diagnostics.push(makeDiagnostic(1, '统计图选择', 'wrong', '统计图类型选择仍需巩固。', 'chart-choice'));
  }

  const hasAverage = textHas(text, [/平均分|最高分|最低分|评委|9\.45|9\.55/, /骞冲潎|鏈.?楂|鏈.?浣|璇勫|9\.45|9\.55/]);
  const averageWrong = hasAverage && textHas(text, [/第\s*2\s*题|计算错误|误算|错误答案|18\.85|19\.35|小数乘法/, /绗.\s*2\s*.?棰|璇.|閿|19\.35|18\.85|灏忔暟/]);
  if (averageWrong || hasAverage) {
    diagnostics.push(makeDiagnostic(2, '平均分求最高分', 'wrong', '平均分转总分时计算出错，需要补平均数总量关系和小数乘法验算。', 'average-score'));
  }

  const hasRoute = textHas(text, [/折返|迟到|路程|返回家|养鱼塘|广播站|1150|1500|750/, /鎶.?杩|杩熷|璺.?绋|杩斿洖|鍏婚奔|骞挎挱|1150|1500|750/]);
  const routeRisk = hasRoute && textHas(text, [/第\s*3\s*题|过程错误|推导|路径|没有计入|结论碰巧|逻辑|不等式/, /绗.\s*3\s*.?棰|杩囩▼|鎺ㄥ|璺|娌℃湁|缁撹|閫昏緫/]);
  if (routeRisk || hasRoute) {
    diagnostics.push(makeDiagnostic(3, '折返行程问题', routeRisk ? 'process-risk' : 'wrong', '结论可能正确，但完整路径和比较过程需要重新梳理。', 'return-route'));
  }

  const needsDecimalOnly = !diagnostics.some((item) => item.supplementType === 'average-score')
    && textHas(text, [/小数乘|9\.45\s*[×x]\s*3|19\.35|验算/, /灏忔暟|9\.45.*3|19\.35|楠岀畻/]);
  if (needsDecimalOnly) {
    diagnostics.push(makeDiagnostic(diagnostics.length + 1, '小数乘法验算', 'wrong', '小数计算结果缺少估算检验，需要补一组验算题。', 'decimal-check'));
  }

  return diagnostics;
}

function buildSupplementItemsFromDiagnostics(diagnostics, fallbackKnowledgePoint) {
  const items = [];
  for (const diagnostic of diagnostics.filter((item) => item.needsSupplement)) {
    if (diagnostic.supplementType === 'chart-choice') items.push(buildChartChoiceQuestion(items.length + 1));
    if (diagnostic.supplementType === 'average-score') items.push(buildJudgeScoreQuestion(items.length + 1));
    if (diagnostic.supplementType === 'return-route') items.push(buildReturnRouteQuestion(items.length + 1));
    if (diagnostic.supplementType === 'decimal-check') items.push(buildDecimalCheckQuestion(items.length + 1));
  }
  if (!items.length) {
    items.push(
      { ...buildQuestion(0, { knowledgePoint: fallbackKnowledgePoint, difficulty: '鍩虹' }), number: 1 },
      { ...buildQuestion(1, { knowledgePoint: fallbackKnowledgePoint, difficulty: '涓。' }), number: 2 }
    );
  }
  return items.slice(0, 3).map((item, index) => ({ ...item, number: index + 1 }));
}

function buildSupplementItemsFromAnalysis(visionAnalysis, fallbackKnowledgePoint) {
  return buildSupplementItemsFromDiagnostics(buildExerciseDiagnostics(visionAnalysis), fallbackKnowledgePoint);
}

function buildQuestion(index, options = {}) {
  const point = getKnowledgePoint(options.knowledgePoint);
  const builders = {
    '量率对应': buildRateQuestion,
    '工程问题': buildEngineeringQuestion,
    '行程问题': buildTravelQuestion,
    '连续变化百分数': buildPercentQuestion,
    '面积比': buildAreaQuestion,
    '圆与扇形': buildCircleQuestion,
    '比的应用': buildRatioQuestion,
    '平均数问题': buildAverageQuestion
  };
  return (builders[point.name] || buildRateQuestion)(index, options);
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
  const correctSummary = (result.correctItems || []).map((item) => `${item.number}. ${item.title}：${item.summary}`).join('\n') || '暂无明确正确题表现，请老师结合图片补充确认。';
  const issueSummary = (result.issueItems || []).map((item) => `${item.number}. ${item.title}：${item.summary}`).join('\n') || '暂无明确错题，系统会按当前知识点给出巩固题。';
  return [
    '【老师内部分析】',
    result.teacherAnalysis,
    '',
    '【正确题表现】',
    correctSummary,
    '',
    '【需补救题】',
    issueSummary,
    '',
    '【老师确认项】',
    result.teacherChecklist,
    '',
    '【微信反馈】',
    result.wechatText,
    '',
    '【正式记录版】',
    result.formalReport,
    '',
    '【补救题】',
    ...result.supplementItems.map((item) => [
      `${item.number}. ${item.question}`,
      `答案：${item.answer}`,
      `解析：${item.solution}`
    ].join('\n'))
  ].join('\n\n');
}

function summarizeHomeworkForParent({ name, courseName, homeworkContext, teacherObservation, supplementItems, correctItems = [], issueItems = [] }) {
  const focus = supplementItems.map((item) => item.knowledgePoint).filter(Boolean).join('、') || '本节课相关题型';
  const strengths = correctItems.map((item) => item.title).join('、');
  const issues = issueItems.map((item) => item.title).join('、');
  return [
    `${name}今天在${courseName}的${homeworkContext}中完成了课堂即时练习，整体能跟上练习节奏，也愿意把过程写出来。`,
    strengths ? `做得好的地方：${strengths}完成情况较好，说明相关概念有基础。` : '',
    issues ? `后续主要巩固：${issues}，重点看孩子能不能把关键步骤说清楚。` : '',
    `这次需要重点巩固的是：${focus}。从作答看，孩子不是不会做，而是过程检查和路径梳理还需要加强。`,
    `老师会安排对应的小练习帮助孩子把方法稳住。家里配合时，建议让孩子先复述“这道题为什么这样算”，再看最后答案。`,
    teacherObservation ? '老师已结合课堂观察和作业过程做了针对性安排。' : ''
  ].filter(Boolean).join('\n');
}

function summarizeHomeworkFormal({ name, homeworkContext, teacherObservation, supplementItems, correctItems = [], issueItems = [], nextSteps }) {
  const focus = supplementItems.map((item) => `${item.knowledgePoint}：${item.mistakeTip}`).join('\n');
  const correctSummary = correctItems.map((item) => `${item.number}. ${item.title}`).join('；') || '待老师确认';
  const issueSummary = issueItems.map((item) => `${item.number}. ${item.title}：${item.summary}`).join('\n') || '待老师确认';
  return [
    `${name}${homeworkContext}阶段反馈：本次练习已完成，后续建议围绕以下薄弱点做短时巩固。`,
    `正确题表现：${correctSummary}`,
    `需补救题：\n${issueSummary}`,
    focus,
    teacherObservation ? `老师观察：${teacherObservation}` : '',
    `后续安排：${nextSteps}`,
    '说明：图片识别结果仅作为老师判断辅助，发送给家长前请以老师核对后的内容为准。'
  ].filter(Boolean).join('\n');
}

export async function generateQuestions(options = {}) {
  const count = clamp(options.count, 5, 3, 10);
  const grade = options.grade || '六年级';
  const knowledgePoint = options.knowledgePoint || '量率对应';
  const items = Array.from({ length: count }, (_, index) => buildQuestion(index, options));
  const result = {
    title: `${grade}${knowledgePoint}专项训练`,
    teacherReviewNotice: '正式发给学生前，请老师核对数据、答案和难度是否适合本班。',
    items
  };
  return withDeepSeek({
    task: '生成成都小升初数学专项训练题',
    input: { grade, knowledgePoint, count, difficulty: options.difficulty || '中档', weakness: options.weakness || '', useAi: options.useAi !== false },
    fallbackContent: formatQuestions(result),
    result,
    recordType: '专项出题',
    recordTitle: result.title
  });
}

export async function variantFromMistake(options = {}) {
  const originalQuestion = options.originalQuestion || '';
  let knowledgePoint = '量率对应';
  if (/降价|涨价|%|百分/.test(originalQuestion)) knowledgePoint = '连续变化百分数';
  else if (/合作|工程|完成/.test(originalQuestion)) knowledgePoint = '工程问题';
  else if (/相遇|追及|速度|路程/.test(originalQuestion)) knowledgePoint = '行程问题';
  else if (/面积|三角形|扇形|圆/.test(originalQuestion)) knowledgePoint = /圆|扇形/.test(originalQuestion) ? '圆与扇形' : '面积比';

  const variants = ['基础版', '标准版', '提升版'].map((level, index) => ({
    level,
    ...buildQuestion(index, {
      knowledgePoint,
      difficulty: level === '基础版' ? '基础' : level === '标准版' ? '中档' : '拔高'
    })
  }));
  const result = {
    title: '错题变式训练',
    analysis: {
      knowledgePoint,
      mistakeReason: options.teacherNote || getKnowledgePoint(knowledgePoint).mistakes[0],
      suggestion: '先做同模型低难度题，再做数据变化题，最后让学生口头说明关键依据。'
    },
    variants,
    parentFeedback: `这道错题反映的重点不是粗心，而是“${getKnowledgePoint(knowledgePoint).mistakes[0]}”。建议先用 2-3 道同模型题巩固方法，再逐步增加变化。`
  };
  return withDeepSeek({
    task: '根据学生错题生成同模型变式训练',
    input: {
      originalQuestion,
      studentAnswer: options.studentAnswer || '',
      teacherNote: options.teacherNote || '',
      inferredKnowledgePoint: knowledgePoint,
      useAi: options.useAi !== false
    },
    fallbackContent: formatVariant(result),
    result,
    recordType: '错题变式',
    recordTitle: knowledgePoint
  });
}

export async function generatePaper(options = {}) {
  const count = clamp(options.count, 8, 5, 12);
  const points = String(options.knowledgePoints || '量率对应,工程问题,连续变化百分数')
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const questions = Array.from({ length: count }, (_, index) => buildQuestion(index, {
    knowledgePoint: pick(points, index),
    difficulty: index < 3 ? '基础' : index < count - 1 ? '中档' : '拔高'
  }));
  const title = `成都小升初数学${options.paperType || '周测'}（${options.minutes || 25}分钟）`;
  const result = {
    title,
    questions,
    studentPaper: [title, `时间：${options.minutes || 25} 分钟  题量：${count} 题`, '', ...questions.map((item) => `${item.number}. ${item.question}`)].join('\n'),
    answerPaper: [`${title} 答案解析`, '', ...questions.map((item) => `${item.number}. 答案：${item.answer}\n解析：${item.solution}\n易错点：${item.mistakeTip}`)].join('\n'),
    teachingOutline: ['讲评提纲', `核心考点：${[...new Set(questions.map((item) => item.knowledgePoint))].join('、')}`, '建议顺序：先讲单位和数量关系，再讲变式迁移，最后让学生复述依据。', '课后补救：每个高频错点补 2 道基础题和 1 道同模型变式。'].join('\n')
  };
  return withDeepSeek({
    task: '生成成都小升初数学周测卷',
    input: { paperType: options.paperType || '周测', minutes: options.minutes || 25, count, knowledgePoints: points, useAi: options.useAi !== false },
    fallbackContent: formatPaper(result),
    result,
    recordType: '周测组卷',
    recordTitle: title
  });
}

export async function generateParentFeedback(options = {}) {
  const name = options.studentName || '同学';
  const weak = options.weakPoints || '量率对应';
  const progress = options.progressPoints || '愿意尝试画图分析';
  const reason = options.mistakeReasons || '单位 1 判断不稳定';
  const next = options.nextSteps || '完成 2 组同模型变式训练';
  const result = {
    title: `${name}家长反馈`,
    wechatText: `${name}本周在${progress}方面有进步。目前薄弱点集中在${weak}，常见原因是${reason}。下周建议重点做：${next}。家里配合时不用盲目加量，重点看孩子能否说清每一步的依据。`,
    formalReport: `${name}阶段反馈：本周积极表现为${progress}。当前主要问题集中在${weak}，不是简单粗心，而是${reason}。后续训练建议围绕“先判断关系、再列式、最后回代检查”的流程展开，安排为：${next}。`
  };
  return withDeepSeek({
    task: '根据学生数学薄弱点生成家长反馈',
    input: { name, weak, progress, reason, next, useAi: options.useAi !== false },
    fallbackContent: formatFeedback(result),
    result,
    recordType: '家长反馈',
    recordTitle: result.title
  });
}

export async function generateHomeworkFeedback(options = {}) {
  const name = options.studentName || '同学';
  const courseName = options.courseName || '六年级数学';
  const knowledgePoint = options.knowledgePoint || '本节课知识点';
  const homeworkContext = options.homeworkContext || '课后10分钟作业';
  const teacherObservation = options.teacherObservation || '老师暂未补充课堂观察。';
  const nextSteps = options.nextSteps || '课后完成同模型补题，并在下一次课前复盘错因。';
  const images = Array.isArray(options.images) ? options.images : [];
  const visionResult = await analyzeHomeworkImages({
    images,
    studentName: name,
    knowledgePoint,
    homeworkContext
  });
  const visionAnalysis = visionResult.content;
  const exerciseDiagnostics = buildExerciseDiagnostics(`${visionAnalysis}\n${teacherObservation}`);
  const correctItems = exerciseDiagnostics.filter((item) => !item.needsSupplement);
  const issueItems = exerciseDiagnostics.filter((item) => item.needsSupplement);
  const supplementItems = buildSupplementItemsFromDiagnostics(exerciseDiagnostics, knowledgePoint);
  const wechatText = summarizeHomeworkForParent({
    name,
    courseName,
    homeworkContext,
    teacherObservation,
    supplementItems,
    correctItems,
    issueItems
  });
  const formalReport = summarizeHomeworkFormal({
    name,
    homeworkContext,
    teacherObservation,
    supplementItems,
    correctItems,
    issueItems,
    nextSteps
  });
  const result = {
    title: `${name}课后作业反馈`,
    visionAnalysis,
    teacherAnalysis: visionAnalysis,
    visionSource: visionResult.source,
    reviewStatus: visionResult.source === 'doubao-vision' ? '待老师确认' : '需补充确认',
    teacherChecklist: [
      '1. 图片中看不清的步骤，需要老师人工确认后再发给家长。',
      '2. 如果识别结果和老师现场观察不一致，以老师现场观察为准。',
      '3. 反馈给家长前，建议删除过细的技术判断，保留“表现、问题、下一步”。'
    ].join('\n'),
    wechatText,
    formalReport,
    exerciseDiagnostics,
    correctItems,
    issueItems,
    supplementItems
  };
  const fallbackContent = formatHomeworkFeedback(result);
  const aiResult = options.useAi === false
    ? {
      content: fallbackContent,
      source: 'template',
      model: 'local-template',
      note: '已关闭 DeepSeek，使用本地模板。'
    }
    : await generateWithDeepSeek({
      task: '根据课后10分钟作业图片分析结果生成家长反馈',
      input: {
        studentName: name,
        courseName,
        knowledgePoint,
        homeworkContext,
        teacherObservation,
        nextSteps,
        visionSource: visionResult.source,
        visionAnalysis,
        useAi: true
      },
      fallbackContent
    });

  addRecord('作业反馈', result.title, aiResult.content, aiResult.source);
  return {
    ...attachAi(result, aiResult),
    fallbackContent,
    visionModel: visionResult.model || '',
    visionUsage: visionResult.usage || null,
    visionNote: visionResult.note || ''
  };
}

export function getDashboardStats() {
  return {
    recentRecords: [...records],
    knowledgePointOptions: knowledgePoints,
    highFrequencyKnowledgePoints: knowledgePoints.slice(0, 6).map((item) => item.name),
    highFrequencyMistakes: knowledgePoints.flatMap((item) => item.mistakes).slice(0, 6),
    seedCounts: {
      knowledgePoints: knowledgePoints.length,
      questionPatterns: 8,
      mistakeReasons: knowledgePoints.reduce((sum, item) => sum + item.mistakes.length, 0),
      generatedRecords: records.length
    }
  };
}

export function getGeneratedRecords() {
  return [...records];
}

export function resetRecords() {
  records.length = 0;
}

export function exportAsHtml(payload = {}) {
  const title = payload.title || '成都小升初数学出题助手导出';
  const content = payload.content || '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; color: #1d2430; line-height: 1.75; padding: 32px; }
    h1 { font-size: 24px; }
    pre { white-space: pre-wrap; font: inherit; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(content)}</pre>
</body>
</html>`;
}

function normalizePrintableItems(payload = {}) {
  const source = payload.payload || payload;
  return source.items || source.questions || source.supplementItems || [];
}

export function exportPrintableHtml(payload = {}, mode = 'student') {
  const title = payload.title || payload.payload?.title || '成都小升初数学练习';
  const items = normalizePrintableItems(payload);
  const isAnswer = mode === 'answer';
  const subtitle = isAnswer ? '答案解析卷' : '学生练习卷';
  const content = items.length
    ? items.map((item, index) => isAnswer ? printableAnswerItem(item, index) : printableStudentItem(item, index)).join('')
    : `<section class="empty">当前结果没有可打印的结构化题目，请先生成专项题或周测卷。</section>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}-${subtitle}</title>
  <style>
    @page { size: A4; margin: 15mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      background: #fff;
      font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
      line-height: 1.72;
      font-size: 14px;
    }
    .print-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin: 14px 0 18px;
    }
    button {
      border: 1px solid #245b89;
      border-radius: 6px;
      background: #245b89;
      color: #fff;
      padding: 8px 14px;
      cursor: pointer;
    }
    .page { max-width: 760px; margin: 0 auto; }
    h1 { text-align: center; font-size: 23px; margin: 0 0 4px; }
    .subtitle { text-align: center; color: #4b5563; margin-bottom: 14px; }
    .meta {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr 1fr;
      border: 1px solid #cbd5e1;
      margin-bottom: 18px;
    }
    .meta div { border-right: 1px solid #cbd5e1; padding: 8px 10px; min-height: 38px; }
    .meta div:last-child { border-right: 0; }
    .tip {
      border: 1px solid #d9dee7;
      background: #f8fafc;
      padding: 8px 10px;
      margin-bottom: 16px;
    }
    .question {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid #e5e7eb;
    }
    .q-head { display: flex; gap: 8px; align-items: baseline; margin-bottom: 7px; }
    .q-no { font-weight: 700; color: #245b89; min-width: 28px; }
    .q-text { flex: 1; }
    .answer-space {
      height: 84px;
      margin: 10px 0 0 36px;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      background:
        repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 27px,
          #eef2f7 28px
        );
    }
    .answer-space.large { height: 116px; }
    .answer-block {
      margin-left: 36px;
      display: grid;
      gap: 5px;
    }
    .answer-block strong { color: #111827; }
    .empty { border: 1px solid #d9dee7; padding: 18px; color: #4b5563; }
    .footer { margin-top: 18px; color: #6b7280; font-size: 12px; text-align: center; }
    @media print {
      .print-actions { display: none; }
      .page { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="print-actions">
      <button onclick="window.print()">打印 / 保存为 PDF</button>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div class="subtitle">${subtitle}</div>
    ${isAnswer ? '' : printableMeta()}
    ${isAnswer ? '<div class="tip">建议家长先让孩子独立完成学生卷，再使用本答案卷核对和讲评。</div>' : '<div class="tip">建议独立完成。做题时先圈关键词，再写数量关系或列式过程。</div>'}
    ${content}
    <div class="footer">成都小升初数学出题助手 · 家长打印版</div>
  </div>
</body>
</html>`;
}

function printableMeta() {
  return `<section class="meta">
    <div>姓名：</div>
    <div>日期：</div>
    <div>用时：</div>
    <div>正确率：</div>
  </section>`;
}

function printableStudentItem(item, index) {
  const question = item.question || item.text || '';
  const isGeometry = /图|三角形|圆|扇形|面积|周长/.test(question);
  return `<section class="question">
    <div class="q-head">
      <div class="q-no">${item.number || index + 1}.</div>
      <div class="q-text">${escapeHtml(question)}</div>
    </div>
    <div class="answer-space ${isGeometry ? 'large' : ''}"></div>
  </section>`;
}

function printableAnswerItem(item, index) {
  return `<section class="question">
    <div class="q-head">
      <div class="q-no">${item.number || index + 1}.</div>
      <div class="q-text">${escapeHtml(item.question || item.text || '')}</div>
    </div>
    <div class="answer-block">
      <div><strong>答案：</strong>${escapeHtml(item.answer || '')}</div>
      <div><strong>解析：</strong>${escapeHtml(item.solution || '')}</div>
      <div><strong>考点：</strong>${escapeHtml(item.knowledgePoint || '')}</div>
      <div><strong>易错提醒：</strong>${escapeHtml(item.mistakeTip || '')}</div>
      <div><strong>变式建议：</strong>${escapeHtml(item.variationSuggestion || '')}</div>
    </div>
  </section>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
