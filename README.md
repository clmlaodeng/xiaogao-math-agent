# 课后10分钟反馈助手

面向教培老师的本地工作台，用于把课后10分钟作业图片转成可发家长的反馈，并自动生成同错因补救题。

## 当前能力

- 上传作业图片，调用豆包/火山方舟视觉模型识别作业情况
- 区分“正确题表现”和“需补救题”
- 只针对错题或过程错误生成补救题，不给正确题重复补题
- 支持 DeepSeek 生成专项题、错题变式、周测卷和家长反馈
- 支持关闭 AI，使用本地模板兜底
- 支持打印学生练习页和答案解析页，浏览器中可保存为 PDF

## 本地启动

```powershell
npm start
```

浏览器访问：

```text
http://127.0.0.1:8787
```

也可以双击：

```text
start-mvp.bat
```

## API 配置

在项目根目录创建 `.env.local`，按需填写：

```text
DEEPSEEK_API_KEY=你的 DeepSeek Key
DEEPSEEK_MODEL=deepseek-v4-flash

ARK_API_KEY=你的火山方舟/豆包 Key
ARK_VISION_MODEL=你的视觉模型
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

没有配置 Key 时，系统不会假装识别图片，会回退到老师输入的文字观察和本地模板。

## 交付前验收

每次交付或推送前运行：

```powershell
npm run verify
```

这个命令会依次检查：

- `src/generator.js`、`src/server.js`、`public/app.js` 语法
- 生成题、错题变式、家长反馈、打印页等单元测试
- 本地服务启动、核心 API、作业反馈、打印页面的冒烟测试

## 常用命令

```powershell
npm run check
npm test
npm run smoke
npm run verify
```

## 主要文件

- `src/generator.js`：出题、反馈、补救题和打印内容生成逻辑
- `src/vision.js`：豆包/火山方舟图片识别
- `src/deepseek.js`：DeepSeek 调用和本地模板回退
- `src/server.js`：本地 HTTP 服务和 API
- `public/index.html`：老师工作台页面
- `public/app.js`：前端交互
- `scripts/verify-delivery.mjs`：交付冒烟测试
- `tests/generator.test.js`：自动化测试
