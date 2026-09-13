# 综合质量问题：可复现现象、代码边界与技术检索方向

本说明用于论坛/其他 AI 技术咨询。测试日期：2026-09-13。运行环境：本地 n8n 2.38.7、Browserless、Gemini `gemini-flash-lite-latest`。下述方案尚未实施或验证，不是已修复声明。

## 目标与已完成机制

每位作者由独立分类、Bio、Web Research、Synthesis 调用处理。综合应比较站点事实与外部事实，指出一致/冲突/无法判断，仅有站点证据时明确未独立验证，并生成 2–3 句简介。

核心源码：`src/shared/synthesis-contract.js`；研究段落归属：`src/shared/research-evidence.js`；最终来源充分性：`src/shared/research-policy.js`。公开输出结构包含 comparisons、profile、profile_fact_ids、limitations。

当前不是完全自由文本生成：代码为每条 Bio fact 生成一个必答 task，强制包含 anchor fact ID，只允许同字段候选，检查结论枚举和引用集合。只有单侧事实的任务由代码生成 site_only/web_only。修复仅针对未通过任务，保留已通过结果。段落 ID 由代码解析到实际原文，模型不能任意生成引文。

一次完整真实批次：15 位全部返回；Synthesis 运行时契约为 15 success；所有已接受的 Bio fact 都被比较覆盖。Research 为 5 partial、10 failed；最终全部 degraded。这些数值证明结构覆盖，不证明语义正确。

## A. 已确认：简介的引用集合不完整

真实样本 J.K. Rowling 的 profile 开头为：

> J.K. Rowling is a British author best known for writing the Harry Potter series.

其 `profile_fact_ids` 仅列 `bio:1:f1`、`bio:1:f2`、`bio:1:f3`、`bio:1:f4`、`research:1:f1`。这些指向出生日期、出生地点、学校与另一出生日期记录，没有覆盖该句的职业/作品声明。相应内容存在于其他研究记录中，因此这里确认的是**缺少正确的声明—证据映射**，不是证明该事实虚构。

根因定位：`validateSynthesis()` 的 profileOK 仅检查非空文本、非空且无重复的有效 ID，以及技术字段黑名单。它不验证每个句子/原子声明是否被引用 facts 蕴含。因此错误通过校验，不会触发定向修复。盲目重试或仅增加提示不解决检测缺口。

检索词：`claim-level citation completeness`、`attribution precision recall RAG`、`sentence-level grounded generation`、`ALCE citation evaluation`、`atomic claim evidence alignment`。

候选方案：先返回内部 `sentences: [{text, claims:[{claim, fact_ids}]}]`，验证后渲染原有 profile；或先选事实再用受控模板生成简介。ID 存在检查仍不足以证明蕴含；需要评估规则可判定字段、NLI/独立评审和人工固定样本的成本及误判。不要通过把全部事实 ID 都加进去伪造覆盖率。

验收：固定该样本；故意移除作品证据 ID 应被拒绝/降级；正确引用应通过；额外无关引用不能提高得分。只重放已存综合输入，不重抓网页。

## B. 代码缺口：同字段候选不等于同一事实

`synthesisPlan()` 对 Bio anchor 用 `web.filter(w => w.field === f.field)` 选候选，未在代码中匹配 work/affiliation 的具体 subject、事件时间或关系。提示要求模型区分不同作品/事件；`validateSynthesis()` 对 agreement/conflict 只要求合法 ID 和至少两条事实，没有确定性地验证“是否同一命题”。

这是可直接读代码确认的风险，但不代表已证明本批次每条比较错误。已观察到研究事实 subject 表示不统一（作品字段使用作者名字等）；因此直接字符串相等也会漏掉有效匹配。另一个覆盖边界是：有同字段 Bio 时，不会为该字段所有未匹配 web facts 单独建立任务；“Bio 全覆盖”不等于“所有 web facts 全覆盖”。

检索词：`entity resolution claim matching relation extraction`、`event coreference temporal fact comparison`、`contradiction detection structured claims`、`canonical subject relation object evidence`。

候选方案：内部规范化 subject/predicate/object/time/precision；先形成可能同命题的组，再让模型判断一致或冲突；无法匹配的事实保留为单侧。避免对同一字段做全连接比较，也避免把出生年与完整日期、不同任职期当冲突。

验收样本：不同作品年份不可互证；同作品别名可匹配；同机构不同任职期不自动冲突；日期精度差异允许 inconclusive。新方案应说明无法规范化时如何保留数据。

## C. 已确认：来源独立性门控让已有研究无法参与综合

Einstein 实际取得 Nobel 与 Wikipedia 内容及事实，但模型的 source_assessments 将 independence 标为 uncertain。`synthesisWebFacts()` 仅允许 match + usable + no_obvious_overlap 的来源，故这些事实被整体排除，比较退为 site_only。

这不是合并丢数据：原研究记录仍在 dossier 中；是**是否允许用于独立佐证**的策略决策。不能简单将 uncertain 全改为独立，也不能仅凭域名不同认定独立。所问问题是：如何区分“可参与内容比较”和“足以证明独立佐证”，避免把不确定的独立性等同于没有可比较内容？

检索词：`source independence provenance evidence corroboration`、`source dependency detection fact checking`、`content agreement versus independent corroboration`。

候选方案：分离内容比较资格与独立佐证资格，允许比较但标记 independent_corroboration=false/unknown；仍阻止此类比较提高独立来源数或输出 verified。需设计兼容现有输出结构的标记与简介限制，不能只放松成功阈值。

## D. 代码缺口：段落归属不等于完整事实支持

`resolveResearchFacts()` 保证 source_id 与 paragraph_id 属于同一实际页面，并将段落原文作为 evidence_text。它解决虚构引文/错源引用，却不保证该段落支持整个 value 和 subject。作品实体表示不一致是已观察现象；任意事实的语义蕴含仍需额外验证。

检索词：`provenance versus entailment RAG`、`fine grained factual consistency verification`、`evidence span extraction structured facts`。

候选方案：确定性校验可解析的日期/实体，其他保留证据跨度与置信状态；对高风险声明做有限独立验证。不要把同段出现关键词当作蕴含证明。

## E. 尚未完成的质量验收

2–3 句仅由提示要求，profileOK 没有句数约束；未逐份人工确认。英文缩写（J.K.、Ph.D.）使按句点计数不可靠。可检索 `sentence segmentation abbreviations Intl.Segmenter`，或内部直接输出 2–3 个句子元素后再渲染，但每个元素仍可能含多句。技术字段黑名单也不是通用的“无元数据污染”证明。

## 希望方案回答的具体问题

请优先解决 A，其次 B/C；保留公开 dossier 契约、作者数量、已接受结果和有界调用预算。提出可检测失败的规则与固定负例，再谈 prompt。说明哪些保证由代码提供、哪些仍依赖模型，以及拒绝/降级策略。不要建议重跑所有网页、无限 self-reflection、任意增加来源预算或把 uncertain 当 verified。

最小实验应复用存量综合输入，运行固定样本并统计：声明引用完整率、无关引用率、错误 agreement/conflict、未匹配事实保留率、额外模型调用数。当前并没有这些语义指标的完整基准，不能拿运行时 success 代替。

样本完整输出：`delivery/release-1789324402547/batch-output.json`；运行范围：`docs/final-validation.md`。以上问题描述不包含 API 密钥，也不需要公司内部材料即可复现。
