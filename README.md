# 成都小升初数学出题助手

这是一个本地运行的出题工作台，用于快速生成成都小升初数学训练材料。

当前恢复版覆盖：

- 生成专项题
- 错题变式
- 生成周测卷
- 家长反馈
- 复制结果
- 导出 HTML

## 运行方式

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

## 支持的知识点

- 量率对应
- 工程问题
- 行程问题
- 连续变化百分数
- 面积比
- 圆与扇形
- 比的应用
- 平均数问题

## 主要文件

- `src/generator.js`：本地出题逻辑。
- `src/server.js`：本地服务和 API。
- `public/index.html`：出题工作台页面。
- `public/app.js`：前端交互。
- `public/styles.css`：页面样式。

## 验证

```powershell
npm test
```
