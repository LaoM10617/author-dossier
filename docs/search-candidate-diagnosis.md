# 两轮搜索无候选：实际执行定位

数据来自本地父执行 #17、子执行 #18–32。只读取保存的执行数据并重新解析 HTML，没有重跑网页、调用模型或修改流程。

## 已确认的故障边界

30 次搜索均返回 HTTP 200，目标页面状态也为 200。每次 HTML 的 `li.b_algo h2 a` 标题重新解析后，都与 n8n 提取的十条标题完全一致。11 位作者两轮均没有候选通过身份匹配；对应本次 11 个 Research failed。失败发生在“返回的搜索内容与查询身份不相关”，随后被候选筛选正确拒绝；不是 Research Gemini 抽取失败。

Jane Austen（子执行 #20）是完整证据样本：

1. 第一轮请求 URL 的 q 为 `Jane Austen biography`；第二轮为 `"Jane Austen" biography (site:edu OR site:gov OR site:ac.uk OR site:nobelprize.org)`。
2. 两轮返回 HTML 的 title 和搜索输入框均保留完整查询。没有证据表明 n8n 在构造 URL 时将名字截成 Jane。
3. 返回的有机结果是 Jane App、购物网站、Jane!、Jane 词条等，两轮十条提取标题相同。并没有相应的 Jane Austen 传记候选。
4. Bing 跳转地址已正确解码为 jane.app、veryjane.com 等实际地址；不是未解码导致所有 URL 被丢弃。
5. 筛选要求姓名 token 同时出现在标题与 URL 组成的词集合中。这些候选缺少 Austen，relevant=false，queue=[]。在这个样本中，放宽筛选只会放进错人/无关网页。

其他样本呈现类似第一名字相关结果：Steve Martin → Minecraft Steve；Bob Marley → Bob's 家具店；Douglas Adams → Douglas 玩具；Friedrich Nietzsche → Friedrich 空调；Mark Twain → Mark 福音章节。André Gide、Eleanor Roosevelt 还出现明显不相关页面。不能将全部样本概括为已证明的“首词截断”。

正对照：同一批次 Einstein 第一轮、J.K. Rowling、Marilyn Monroe、Elie Wiesel 有匹配结果并进入队列。说明 HTML 提取/跳转解码/筛选并非全局失效。中间名与别名的严格 token 匹配仍可能在其他样本漏选，但不能解释 Jane 样本的原始无关结果。

## 尚未确定的上游原因

可以确定异常已存在于 Browserless 返回的 Bing HTML 中；仅靠现有日志无法进一步归因到 Bing 的查询改写/反自动化响应、执行环境/网络行为、缓存，或其他上游机制。HTTP 200 与正确搜索框只证明收到页面，不证明结果语义正确。不要将“Bing 忽略姓氏”或“Browserless 截断参数”写成已证实根因。

两轮更换查询仍返回同类无关结果，因此当前第二轮并未提供有效的独立检索补救。继续修改 Research Gemini prompt 无法恢复根本没有进入候选队列的页面。

## 面试可使用的表述

我将问题按请求构造、HTTP 响应、HTML 提取、跳转解码和身份筛选五层定位。30 次保存响应的提取结果与原始 DOM 一致；11 位作者的搜索内容在筛选前已经不相关，严格身份门控避免了错误归属。系统保留作者并明确降级。当前已定位到检索响应质量边界，尚未证明搜索服务内部机制；下一步会用同一查询的交互浏览器/另一检索通道做小规模对照，而不是继续调综合提示或放宽身份筛选。

## 如以后继续，最小判别实验

只选 Jane Austen：比较保存的 Browserless 响应与普通浏览器同一 URL 的 title、搜索框、前十条真实结果；再通过独立检索通道对照。一次只改变一个因素，记录请求、最终 URL、时间和结果。这样才能进一步区分查询、运行环境与提供方问题。此实验本轮未执行；无须重跑 15 位作者。

精简证据：`docs/search-diagnosis-evidence.json`。完整本地审计：`artifacts/search-diagnosis/audit.json`。本结论仅针对本次执行，不声称所有 Research 问题都由该原因造成，来源独立性和抽取质量仍是另外的限制。
