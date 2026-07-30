---
name: rebuild
description: 重新打包记账叭 App（electron-builder 打包为安装程序）
---

将记账叭项目重新打包为 Windows 安装程序。

执行步骤：
1. 先执行 `npm run build` 构建生产版本（electron-vite build）
2. 构建成功后，执行打包命令（跳过代码签名，因为 Windows 下需要管理员权限）：
   ```
   CSC_LINK="" WIN_CSC_LINK="" npx electron-builder --win --dir --config.win.signAndEditExecutable=false
   ```
3. 打包完成后，告诉用户输出目录在 `release/win-unpacked/` 下
4. 列出打包出的文件列表，包括 `记账叭.exe` 的大小
5. 注意：此打包方式生成的是免安装版（目录），双击 `记账叭.exe` 即可运行
