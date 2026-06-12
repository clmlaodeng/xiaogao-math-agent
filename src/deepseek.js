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
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, '');
        return [key, value];
      })
  );
}

function getConfig() {
  const localEnv = parseEnvFile(join(root, '.env.local'));
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || localEnv.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || localEnv.DEEPSEEK_MODEL || 'deepseek-v4-flash'
  };
}

function isUsableKey(apiKey) {
  return Boolean(apiKey) && !apiKey.includes('请把你的') && apiKey.length > 20;
}

export async function generateWithDeepSeek({ task, input, fallbackContent }) {
  if (process.env.DEEPSEEK_DISABLE === '1') {
    return {
      content: fallbackContent,
      source: 'template',
      model: 'local-template',
      note: '测试环境禁用 DeepSeek，使用本地模板。'
    };
  }

  const { apiKey, model } = getConfig();
  if (!isUsableKey(apiKey)) {
    return {
      content: fallbackContent,
      source: 'template',
      model: 'local-template',
      note: '未检测到可用的 DEEPSEEK_API_KEY，使用本地模板。'
    };
  }

  const systemPrompt = [
    '你是成都小升初数学教研出题专家。',
    '你要为一线老师生成可直接使用的训练材料。',
    '所有题目必须适合小学高年级方法，不使用初高中超纲方法。',
    '每道题都要给出答案、清晰解析、易错提醒、变式建议。',
    '题目数据要自洽，答案必须能由题干计算得到。',
    '输出使用清晰中文分段，不要输出 Markdown 表格。'
  ].join('\n');

  const userPrompt = [
    `任务：${task}`,
    '',
    '输入信息：',
    JSON.stringify(input, null, 2),
    '',
    '请按老师可复制使用的格式输出。',
    '如果是专项题或卷子，请包含【学生练习版】和【答案解析版】。',
    '如果是错题变式，请包含【错因分析】【同模型变式】【家长反馈参考】。',
    '如果是家长反馈，请包含【微信简短版】【正式记录版】。',
    '不要编造不存在的真实学校考试信息。'
  ].join('\n');

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.35,
        max_tokens: 3000,
        stream: false
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `DeepSeek API 返回 ${response.status}`);
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('DeepSeek API 没有返回正文');

    return {
      content,
      source: 'deepseek',
      model,
      usage: data.usage || null,
      note: ''
    };
  } catch (error) {
    return {
      content: fallbackContent,
      source: 'template',
      model: 'local-template',
      note: `DeepSeek 调用失败，已回退本地模板：${error.message}`
    };
  }
}
