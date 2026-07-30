---
name: unit-test
description: 对项目代码运行单元测试，并给出测试报告
---

对记账叭项目运行 Vitest 单元测试。

执行步骤：
1. 执行 `npm test`（即 `vitest run`）运行所有测试
2. 如果测试全部通过，告诉用户 ✅ 所有测试通过
3. 如果有测试失败，列出失败的测试名称和错误信息
4. 如果用户想 watch 模式（改代码自动重跑），可以执行 `npm run test:watch`
