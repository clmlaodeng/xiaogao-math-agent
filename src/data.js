export const knowledgePoints = [
  { id: 'kp-001', name: '量率对应', grade: '六年级', category: '应用题', commonMistakes: ['单位 1 找错', '效率比和时间比混淆'] },
  { id: 'kp-002', name: '单位 1 变化', grade: '六年级', category: '分数百分数', commonMistakes: ['把不同单位 1 的分率直接相加'] },
  { id: 'kp-003', name: '差不变', grade: '六年级', category: '应用题', commonMistakes: ['把和不变误判为差不变'] },
  { id: 'kp-004', name: '和倍差倍', grade: '六年级', category: '应用题', commonMistakes: ['份数和实际量对应错误'] },
  { id: 'kp-005', name: '工程问题', grade: '六年级', category: '量率对应', commonMistakes: ['工作总量没有统一为 1'] },
  { id: 'kp-006', name: '行程问题', grade: '六年级', category: '量率对应', commonMistakes: ['速度比和时间比方向弄反'] },
  { id: 'kp-007', name: '面积比', grade: '六年级', category: '几何', commonMistakes: ['把边长比直接当面积比'] },
  { id: 'kp-008', name: '连续变化百分数', grade: '六年级', category: '分数百分数', commonMistakes: ['误以为同百分比增减可以抵消'] },
  { id: 'kp-009', name: '浓度问题', grade: '六年级', category: '量率对应', commonMistakes: ['溶液、溶质、浓度对应混乱'] },
  { id: 'kp-010', name: '利润折扣', grade: '六年级', category: '分数百分数', commonMistakes: ['成本、标价、售价对应错误'] },
  { id: 'kp-011', name: '比的应用', grade: '六年级', category: '比例', commonMistakes: ['比和具体数量没有对应'] },
  { id: 'kp-012', name: '圆与扇形', grade: '六年级', category: '几何', commonMistakes: ['周长和面积公式混用'] },
  { id: 'kp-013', name: '图形分割', grade: '六年级', category: '几何', commonMistakes: ['没有抓住等底等高'] },
  { id: 'kp-014', name: '平均数问题', grade: '六年级', category: '应用题', commonMistakes: ['总量和个数不匹配'] },
  { id: 'kp-015', name: '周期规律', grade: '六年级', category: '综合', commonMistakes: ['余数为 0 时位置判断错误'] }
];

export const questionPatterns = [
  { name: '单位 1 连续变化', knowledgePoint: '单位 1 变化', structure: '先按一个单位 1 变化，再按新单位 1 继续变化', difficulty: '中档', solution: '逐步找单位 1', variationRule: '替换涨降比例、现价和场景' },
  { name: '效率合作后单独完成', knowledgePoint: '工程问题', structure: '总量为 1，两人合作一段时间后由一人完成剩余', difficulty: '中档', solution: '工作效率相加', variationRule: '替换单独完成时间和剩余安排' },
  { name: '差不变前后倍数变化', knowledgePoint: '差不变', structure: '两个量同增同减，差不变，前后倍数关系变化', difficulty: '中档', solution: '线段图或份数差', variationRule: '替换倍数和同增同减数量' },
  { name: '和倍关系求原量', knowledgePoint: '和倍差倍', structure: '给出总和与倍数关系，求各部分', difficulty: '基础', solution: '总份数对应总量', variationRule: '替换总量和倍数' },
  { name: '路程相同速度时间反比', knowledgePoint: '行程问题', structure: '路程相同，速度比和时间比互为反比', difficulty: '中档', solution: '统一路程或用比例', variationRule: '替换线路、速度和时间' },
  { name: '等高三角形面积比', knowledgePoint: '面积比', structure: '等高三角形面积比等于底边比', difficulty: '基础', solution: '抓等高关系', variationRule: '替换图形和底边数据' },
  { name: '交叉线段沙漏模型', knowledgePoint: '面积比', structure: '交叉线段形成相似结构，用面积转化求比', difficulty: '拔高', solution: '面积转化和比例', variationRule: '替换比值和面积' },
  { name: '折扣利润反推成本', knowledgePoint: '利润折扣', structure: '售价、利润率、折扣之间反推成本或标价', difficulty: '中档', solution: '明确成本为单位 1', variationRule: '替换折扣和利润率' },
  { name: '浓度混合', knowledgePoint: '浓度问题', structure: '两种浓度溶液混合，求新浓度或配比', difficulty: '中档', solution: '溶质守恒', variationRule: '替换浓度和质量' },
  { name: '周期余数定位', knowledgePoint: '周期规律', structure: '按周期重复排列，根据余数确定位置', difficulty: '基础', solution: '总数除以周期', variationRule: '替换周期元素和总数' },
  { name: '平均数补差', knowledgePoint: '平均数问题', structure: '平均数变化反推出新增或减少的数据', difficulty: '中档', solution: '总量变化', variationRule: '替换人数和平均值' },
  { name: '比例分配', knowledgePoint: '比的应用', structure: '总量按比例分配，求各部分或差量', difficulty: '基础', solution: '份数对应', variationRule: '替换比例和总量' },
  { name: '圆形跑道相遇', knowledgePoint: '行程问题', structure: '同向或相向在环形线路上追及相遇', difficulty: '拔高', solution: '速度和差与圈长对应', variationRule: '替换圈长和速度' },
  { name: '扇形面积组合', knowledgePoint: '圆与扇形', structure: '多个扇形或圆的面积加减组合', difficulty: '中档', solution: '分割补全', variationRule: '替换半径和圆心角' },
  { name: '图形割补求面积', knowledgePoint: '图形分割', structure: '复杂图形通过割补转为基本图形', difficulty: '中档', solution: '割补法', variationRule: '替换边长和组合方式' }
];

export const mistakeReasons = [
  { name: '单位 1 找错', signal: '看到分率就直接计算', remediation: '每一步先圈出“谁的几分之几”', parentText: '孩子需要先判断每一步对应的基准量。' },
  { name: '不同单位 1 混加', signal: '把先降后涨当作抵消', remediation: '分步写出当前单位 1', parentText: '连续变化中每一步的基准不同，不能直接抵消。' },
  { name: '效率比时间比混淆', signal: '工作时间越短效率越低', remediation: '先统一总量为 1', parentText: '需要区分时间和效率的反向关系。' },
  { name: '面积比边长比混淆', signal: '边长扩大几倍就认为面积扩大几倍', remediation: '先判断是否等高或相似', parentText: '几何题要先看图形关系，再确定用边长比还是面积比。' },
  { name: '份数对应错误', signal: '找不到一份是多少', remediation: '画线段图标出总份数', parentText: '孩子需要把比和实际数量建立对应。' },
  { name: '条件遗漏', signal: '只用了一部分条件', remediation: '解题前划出已知量和问题', parentText: '审题时要把关键条件逐项标出来。' },
  { name: '总量不统一', signal: '前后总量变化后仍按原总量算', remediation: '每次变化后更新总量', parentText: '变化类题目要跟踪总量是否改变。' },
  { name: '速度方向判断错', signal: '追及与相遇关系混用', remediation: '先画运动方向', parentText: '行程题要先判断同向还是相向。' },
  { name: '溶质溶液混淆', signal: '浓度直接相加', remediation: '先求溶质质量', parentText: '浓度题要抓住溶质不变或溶质总量。' },
  { name: '利润基准错', signal: '利润率按售价算', remediation: '确认利润率通常以成本为单位 1', parentText: '经济类题目要分清成本、标价和售价。' },
  { name: '余数定位错', signal: '余数为 0 时取第一位', remediation: '余数为 0 对应周期最后一项', parentText: '周期题关键是处理余数。' },
  { name: '平均数总量错', signal: '只比较平均值不看人数', remediation: '先算总量变化', parentText: '平均数题要用总量思路。' },
  { name: '图形关系没识别', signal: '直接套公式', remediation: '先找等底等高、相似或割补关系', parentText: '几何题先看关系，再计算。' },
  { name: '计算顺序错误', signal: '括号和分步关系混乱', remediation: '每步写清含义', parentText: '不是不会方法，而是过程表达需要更规范。' },
  { name: '题意转化不完整', signal: '文字条件无法转成数量关系', remediation: '把文字改写成等量关系', parentText: '应用题需要加强建模表达。' },
  { name: '时间单位不统一', signal: '小时和分钟混算', remediation: '先统一单位', parentText: '孩子需要养成先统一单位的习惯。' },
  { name: '比值方向反了', signal: '甲乙比写成乙甲比', remediation: '标清比的顺序', parentText: '比例题要特别注意比较对象的顺序。' },
  { name: '多步变化漏一步', signal: '只算第一次变化', remediation: '用表格记录每步变化', parentText: '多步题适合用表格降低遗漏。' },
  { name: '答案未回代', signal: '算出后不检查是否符合题意', remediation: '代回原条件检验', parentText: '最后一步检查能减少低级失分。' },
  { name: '难度迁移不足', signal: '会例题，不会变式', remediation: '同模型做基础、标准、提升三层练习', parentText: '下一步要从会做一道题转向会做一类题。' }
];

export const chengduScenes = [
  '天府绿道骑行', '成都地铁换乘', '东安湖研学', '青城山登山', '都江堰水利研学',
  '锦城湖跑步', '春熙路文创店', '太古里书店', '熊猫基地志愿活动', '宽窄巷子研学',
  '校园图书整理', '学校运动会', '社团义卖', '科学社团实验', '校园花坛设计',
  '班级展板制作', '绿道维护', '图书义卖', '篮球社训练', '研学公交安排'
];

export const feedbackTemplates = [
  '{name}本周在{progress}上有进步，主要薄弱点集中在{weak}。下一步建议{next}。',
  '{name}本周的主要问题不是粗心，而是{reason}。下一步先做同模型小题，稳定后再提升难度。',
  '这周建议重点巩固{weak}，每次练习后让孩子说清“为什么这样列式”。',
  '{name}已经能完成基础题，但遇到条件变化时容易犹豫。下一步建议{next}。',
  '本周反馈重点是{weak}。建议家里配合检查解题过程，不只看最后答案。',
  '孩子在{progress}方面表现不错，后续要把方法迁移到变式题。',
  '从错题看，{reason}是主要原因。建议先用 3-5 道同模型题巩固。',
  '下周训练建议聚焦{next}，不需要盲目加量。',
  '这类题关键不是背答案，而是先找准数量关系。',
  '建议每次做题后补一句“本题单位 1 是谁”，帮助稳定思路。',
  '家里可让孩子复述解题步骤，确认不是只记住形式。',
  '本周练习适合少量多次，先保证正确率再提高速度。',
  '孩子目前需要把题目条件整理成图或表，减少遗漏。',
  '从表现看，基础方法已有，但遇到新场景还需要变式训练。',
  '建议下周保持 2 组专项练习，每组 15-20 分钟。',
  '反馈重点是过程规范，答案正确之外还要看步骤是否清楚。',
  '本周不建议直接拔高，先把{weak}稳定下来。',
  '如果孩子能讲清每一步的含义，正确率会更稳定。',
  '下一阶段目标是从“会做”提升到“会解释”。',
  '老师会继续用同模型变式跟进，家里配合看订正质量即可。'
];

export const questionBankSources = [
  {
    name: '六年级数学演示拆题',
    license: '本地演示数据',
    url: '#',
    usableNow: true,
    note: '用于演示“已审核真题 -> 检索引用 -> 改编生成”的最小闭环。'
  },
  {
    name: 'TAL-SCQ5K',
    license: 'MIT',
    url: 'https://github.com/math-eval/TAL-SCQ5K',
    usableNow: true,
    note: '中文/英文数学选择题数据集，含小学到高中题目、知识点路径和解析；可作为后续导入源，第一版先用其结构做题型映射。'
  },
  {
    name: 'Ape210K',
    license: '需要进一步确认',
    url: 'https://github.com/yuantiku/ape210k',
    usableNow: false,
    note: '中文小学数学应用题大规模数据集线索；未在当前版本直接复制题目，建议确认许可后再导入。'
  },
  {
    name: 'Math23K',
    license: '需要进一步确认',
    url: 'https://matheval.ai/en/dataset/math23k/',
    usableNow: false,
    note: '中文小学数学应用题数据集线索；适合后续做题型归类和求解验证，当前版本只记录来源。'
  },
  {
    name: '成都期末数学真题卷库',
    license: '本地上传资料，需确认使用边界',
    url: '#',
    usableNow: true,
    note: '本地上传的成都 3-9 年级上册数学期末卷图片库；当前先按整卷入库和预览，后续再做 OCR 拆题与逐题审核。'
  },
  {
    name: '成都公开 PDF 试题线索',
    license: '通常不可直接商用复制',
    url: 'https://mat1.gtimg.com/cd/image/shiti/shuxue1.pdf',
    usableNow: false,
    note: '可人工参考题型结构，不能未经授权整卷复制进商业产品。'
  }
];
