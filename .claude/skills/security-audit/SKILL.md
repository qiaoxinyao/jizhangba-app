---
name: security-audit
description: 对项目代码进行安全审计，检查密码泄露、注入风险、配置泄露等安全隐患
---

对项目代码进行全面的安全审查，发现潜在的安全风险。

## 检查范围
- 默认扫描 `src/` 目录下所有代码文件（`.ts`, `.tsx`, `.js`, `.json`, `.yml`, `.yaml`, `.env*`）
- 也检查项目根目录下的配置文件（`package.json`, `electron.vite.config.ts` 等）

## 检查维度

### 维度一：敏感信息泄露
检查代码中是否硬编码了不该公开的敏感信息。
- 使用 `grep` 搜索以下模式：
  - `password`、`passwd`、`pwd` — 密码硬编码
  - `api[_-]?key`、`apikey`、`api_key` — API 密钥
  - `secret`、`token`、`auth` — 令牌/密钥
  - `private.key`、`-----BEGIN` — 私钥泄露
  - `mongodb://`、`mysql://`、`postgres://` — 数据库连接字符串含密码
  - `AKIA[0-9A-Z]{16}` — AWS 访问密钥
- 排除注释和测试文件中的假数据/示例

### 维度二：代码注入风险
检查可能导致注入攻击的危险代码。
- `eval()`、`new Function()` — 危险执行
- `innerHTML`、`outerHTML`、`dangerouslySetInnerHTML` — XSS 风险
- `exec()`、`spawn()`、`execSync()`、`execFile()` — 命令注入
- `require('child_process')` 的未过滤输入
- `ipcMain.handle` 中未做参数校验 — Electron 特有风险
- `shell: true` — Shell 执行风险

### 维度三：配置/数据泄露
检查配置和存储安全。
- `electron-store` 存储是否加密（默认不加密，存明文 JSON）
- `.env` 文件是否被 git 追踪（是否在 `.gitignore` 中）
- `package.json` 中是否泄露了敏感信息
- `electron.vite.config.ts` 等构建配置中是否有敏感信息

### 维度四：Electron 特有安全风险
检查 Electron 桌面应用特有的安全问题。
- `contextIsolation: false` — 关闭上下文隔离（高危）
- `nodeIntegration: true` — 允许渲染进程访问 Node（高危）
- `sandbox: false` — 关闭沙箱
- `webSecurity: false` — 关闭同源策略
- `allowRunningInsecureContent: true` — 允许不安全内容
- `preload` 脚本中是否暴露了危险 API 给渲染进程

### 维度五：依赖安全
检查第三方依赖的安全状况。
- `npm audit` 检查已安装依赖的已知漏洞
- 检查是否有过时的、不再维护的依赖

## 输出报告格式

检查完成后，按以下格式输出报告：

```
🛡️ 安全审计报告
═══════════════════════════════

🔴 高危风险
  · [文件:行号] — 问题描述
  · [文件:行号] — 问题描述

🟡 中危风险
  · [文件:行号] — 问题描述

🔵 低危/建议
  · [文件:行号] — 问题描述

📦 依赖安全
  运行 `npm audit` 结果：
  · [发现的漏洞情况]
