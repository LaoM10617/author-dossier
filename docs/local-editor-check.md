# 本地 n8n 画布与目标环境复验

使用仓库已安装的 n8n 2.38.7；不需要公司服务器。这个入口使用 `.runtime/ui-data`，与自动测试的 `.runtime/data` 分离，因此首次打开看到空白项目是正常的。工作流与凭据会保存在本地数据库中，关闭终端不会清空数据。

## 1. 打开画布

在 PowerShell 执行：

```powershell
cd D:\Projects\Voll-Zeit\author-dossier
powershell -ExecutionPolicy Bypass -File .\scripts\local\start-n8n.ps1
```

等待启动提示，浏览器打开 http://localhost:5678 。首次使用按页面建立本地 owner 账户；它与公司 n8n 或 n8n Cloud 登录无关。终端保持运行，Ctrl+C 停止服务。不要同时运行本仓库的 CLI 集成测试，两者可能争用任务运行器端口 5679。

若缺少运行时，先执行 `npm run setup:n8n`；当前电脑已安装。若 5678 被占用，先确认已有哪个 n8n 正在运行，不要直接结束不明进程。

## 2. 导入两个工作流

新建工作流，右上角菜单选择 Import from File：

1. 导入 `delivery/release-1789324402547/child-workflow.json`，保存为 `Author Dossier - Child`。
2. 再新建另一份工作流，导入同目录 `parent-workflow.json`，保存为 `Author Dossier - Parent`。

不要导入 `artifacts` 中的测试流程：它们使用测试桥接地址。两份正式导出是独立工作流，需要手动关联。

## 3. 绑定凭据

创建两个可复用凭据，然后在每个相关 HTTP 节点选择它们。

**Browserless**：Authentication = Generic Credential Type，Generic Auth Type = Query Auth；新建凭据，Name 字段填 `token`，Value 填 token 本身（不带 `?token=`）。请求 URL 保持导出中的 `/content` 地址。父流程 `Fetch Page 1/2` 两个节点，以及子流程 Bio Page、Search 1/2、R1 Page 1/2、R2 Page 1 的 HTTP 和 Retry HTTP 共 12 个节点，都选择此凭据。

**Gemini**：Authentication = Predefined Credential Type，Credential Type = Google Gemini(PaLM) Api（界面名称可能略有差异，内部类型为 `googlePalmApi`）。Host = `https://generativelanguage.googleapis.com`，API Key 填你的 Gemini key。子流程 Categorizer、Bio Gemini、Research 1、Research 2、Synthesis 五组，每组 HTTP、Retry HTTP、Repair HTTP，共 15 个节点，都选择此凭据。模型 URL 已设为本次测试的 `gemini-flash-lite-latest`。

之前 PowerShell 测试使用的 DPAPI 文件不会自动成为 n8n 凭据；此处需要在凭据界面保存 key。后续各节点复用同一个凭据，不必创建 15 份。

## 4. 选择子流程

打开父流程 `Call Live Author`，在 Workflow 选择刚导入的 `Author Dossier - Child`，替换 `REPLACE_WITH_IMPORTED_CHILD_ID`。如果用 ID 模式，填子工作流编辑页 URL 中的工作流 ID，不能填执行记录 ID。

确认子流程允许同一项目/账户中的父流程调用，保留等待子流程完成的设置。保存两个流程；若实例提示要求发布子流程，先发布子流程再执行父流程。父流程使用手动 trigger，无需为了定时运行而激活。

## 5. 视觉验收与执行

先缩放到全图，再放大到节点标签可读：检查起点到抓取、去重、循环是否相连；循环回线和 done 出口是否正确；子流程分类后的 Research 跳过分支是否都回到合并；Synthesis 和最终输出是否相连。排版可移动节点改善，但不要改连接。检查所有 HTTP 节点（含重试、修复）没有缺失凭据提示。

从父流程点击 Execute workflow，完整环境复验会再次调用真实 API，正常入口预计处理 15 位作者。它和无 API 调用的画布检查不同。不要在子流程无输入时直接点 Execute 来判断是否正确。

完成后查看父流程 `Finalize Batch`：20 quotes、15 authors，无重复或缺失，stop_reason 为 null。查看 `Call Live Author` 的子执行，抽查 J.K. Rowling 与 Jane Austen：前者看实际比较与引用，后者看 Research 失败后是否保留 Bio、简介与未独立验证标记。结果允许随网络和模型变化；不要求把 degraded 变成 completed 才算环境跑通。记录执行 ID、时间和输出，并与 `VALIDATION.md` 分开保存。

官方参考：[导入说明源码](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/manage-workflows/export-and-import.md)、[HTTP 凭据说明源码](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/credentials/httprequest.md)、[Gemini 凭据](https://docs.n8n.io/integrations/builtin/credentials/googleai/)。本地启动脚本使用本项目安装的 CLI，未替你执行新的付费服务请求。
