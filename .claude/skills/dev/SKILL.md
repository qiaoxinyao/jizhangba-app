---
name: dev
description: 启动记账叭 App 开发模式（Electron + Vite）
---

运行 `npm run dev` 启动 Electron 开发模式（在后台运行）。

执行步骤：
1. 先检查是否有 `npm run dev` 或 `electron-vite dev` 相关进程已在运行
2. 如果已有运行中的 dev 服务，告诉用户已经在运行了，端口号是多少
3. 如果没有，在后台执行 `npm run dev`，等几秒后检查输出
4. 告诉用户 App 已启动，Vite 开发服务器地址是什么（端口号）
