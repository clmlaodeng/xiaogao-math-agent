import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('.');

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

function getConfig() {
  const localEnv = parseEnvFile(join(root, '.env.local'));
  return {
    apiKey: process.env.ARK_API_KEY || localEnv.ARK_API_KEY || '',
    model: process.env.ARK_VISION_MODEL || localEnv.ARK_VISION_MODEL || '',
    baseUrl: process.env.ARK_BASE_URL || localEnv.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
  };
}

function isUsable(value) {
  return Boolean(value) && !value.includes('请') && value.length > 8;
}

function imageParts(images = []) {
  return images
    .filter((image) => image?.dataUrl)
    .slice(0, 4)
    .map((image) => ({
      type: 'image_url',
      image_url: { url: image.dataUrl }
    }));
}

export async function analyzeHomeworkImages({ images = [], studentName = '同学', knowledgePoint = '', homeworkContext = '课后10分钟作业' }) {
  const parts = imageParts(images);
  if (!parts.length) {
    return {
      source: 'none',
      content: '未上传作业图片。请补充课堂观察或学生错题信息后生成反馈。',
      note: 'no-images'
    };
  }

  const { apiKey, model, baseUrl } = getConfig();
  if (!isUsable(apiKey) || !isUsable(model)) {
    return {
      source: 'not-configured',
      content: [
        `已收到 ${parts.length} 张${homeworkContext}图片，但尚未配置豆包/火山方舟视觉模型。`,
        '请在 .env.local 中配置 ARK_API_KEY 和 ARK_VISION_MODEL 后启用图片识别。',
        '当前不会假装识别图片；后续反馈只能基于老师输入的文字信息生成。'
      ].join('\n'),
      note: 'missing-ark-config'
    };
  }

  const prompt = [
    `请分析${studentName}的${homeworkContext}图片。`,
    knowledgePoint ? `本节课知识点：${knowledgePoint}` : '',
    '请只基于图片中能看清的内容判断，不要猜测。',
    '输出以下结构：',
    '1. 图片可读性',
    '2. 作业完成情况',
    '3. 做得好的地方',
    '4. 明显错误或不规范过程',
    '5. 可能错因',
    '6. 建议补救题型',
    '7. 老师需要人工确认的地方'
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...parts
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1600
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `视觉模型返回 ${response.status}`);
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('视觉模型没有返回正文');

    return {
      source: 'doubao-vision',
      model,
      content,
      usage: data.usage || null,
      note: ''
    };
  } catch (error) {
    return {
      source: 'vision-error',
      content: `图片识别失败：${error.message}\n请老师根据图片补充错题情况后再生成反馈。`,
      note: error.message
    };
  }
}
