# Supplemental source checkpoint — 2026-09-13

An explicit diagnostic supplement reused the prior research state, classification and Bio. This is not evidence that the original automatic candidate selection or its original page budget now reaches the target.

Two Browserless requests were made: IAS /scholars/einstein returned a target-site 403 and was abandoned before generation; NobelPrize.org /prizes/physics/1921/einstein/biographical/ returned 200 and usable text. One real Gemini research request processed the Nobel page with prior source references. The existing generated collector and normalization Code nodes ran locally; this was not a full n8n engine run. HTML was extracted with Cheerio and the existing selectors.

The model accepted the Nobel page as identity-matched, usable and without obvious overlap with the submitted prior reference excerpts. Eighteen new facts passed the current evidence checks. Qualified sources reached two and target_met became true. This is the current validator's assessment, not a proof of documentary independence. Classification and Bio were checked unchanged.

Research remains partial because earlier source access denial and partial Wikipedia coverage remain recorded. No synthesis request was made, so the prior final dossier was not replaced with an unreconciled result. Detailed intermediate state and HTML are in ignored artifacts/research-supplement; sanitized results are in research-supplement-results.json.

Next integration work is to improve automatic candidate selection so institutional sources are considered within the configured budget, and then regenerate synthesis from the updated evidence. Do not hard-code Einstein's URLs into the general author workflow.
