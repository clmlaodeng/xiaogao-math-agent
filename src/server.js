import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import {
  exportAsHtml,
  exportPrintableHtml,
  generateHomeworkFeedback,
  generatePaper,
  generateParentFeedback,
  generateQuestions,
  getDashboardStats,
  getGeneratedRecords,
  variantFromMistake
} from './generator.js';
import { getDeepSeekStatus } from './deepseek.js';
import { getVisionStatus } from './vision.js';

const port = Number.parseInt(process.env.PORT || '8787', 10);
const root = resolve('.');
const publicDir = join(root, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function sendJson(response, data, statusCode = 200) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function sendError(response, error) {
  sendJson(response, { error: error.message || '请求处理失败' }, 500);
}

async function handleApi(request, response, pathname) {
  try {
    if (request.method === 'GET' && pathname === '/api/generated-records') {
      sendJson(response, { records: getGeneratedRecords(), stats: getDashboardStats() });
      return;
    }
    if (request.method === 'GET' && pathname === '/api/config-status') {
      sendJson(response, {
        deepseek: getDeepSeekStatus(),
        vision: getVisionStatus()
      });
      return;
    }

    if (request.method !== 'POST') {
      sendJson(response, { error: 'Method not allowed' }, 405);
      return;
    }

    const body = await readJson(request);
    if (pathname === '/api/generate-questions') sendJson(response, await generateQuestions(body));
    else if (pathname === '/api/variant-from-mistake') sendJson(response, await variantFromMistake(body));
    else if (pathname === '/api/generate-paper') sendJson(response, await generatePaper(body));
    else if (pathname === '/api/generate-parent-feedback') sendJson(response, await generateParentFeedback(body));
    else if (pathname === '/api/generate-homework-feedback') sendJson(response, await generateHomeworkFeedback(body));
    else if (pathname === '/api/export-html' || pathname === '/api/export-student-print' || pathname === '/api/export-answer-print') {
      const html = pathname === '/api/export-student-print'
        ? exportPrintableHtml(body, 'student')
        : pathname === '/api/export-answer-print'
          ? exportPrintableHtml(body, 'answer')
          : exportAsHtml(body);
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-disposition': 'attachment; filename="math-question-output.html"'
      });
      response.end(html);
    } else {
      sendJson(response, { error: 'API not found' }, 404);
    }
  } catch (error) {
    sendError(response, error);
  }
}

async function serveStatic(response, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  if (url.pathname.startsWith('/api/')) await handleApi(request, response, url.pathname);
  else await serveStatic(response, url.pathname);
});

server.listen(port, () => {
  console.log(`成都小升初数学出题助手已启动：http://127.0.0.1:${port}`);
});
