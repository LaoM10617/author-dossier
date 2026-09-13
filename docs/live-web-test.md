# Single-author real-provider checkpoint

On 2026-09-13, the local n8n child workflow processed Albert Einstein with real Browserless content requests and personal Gemini generation requests. The existing workflow logic and request budgets were retained. The test bridge kept credentials out of workflow exports and the n8n process environment.

Result: six Browserless and five Gemini requests returned HTTP 200. Classification and Bio succeeded. Research obtained two sources accepted by the current validator and met the source target; research and synthesis remained partial. The final envelope was degraded, not failed.

Recorded issues: one candidate lacked usable text, one source text was truncated by the configured limit, and synthesis omitted comparisons for two Bio facts. The profile also includes implementation-oriented wording and needs presentation cleanup. HTTP success and accepted evidence do not establish complete factual accuracy or source independence.

See `live-web-results.json` for the sanitized summary. Detailed execution and output remain in ignored `artifacts/live-web/`. The Browserless token was supplied only to the test process, not saved in project files.

Next targeted work: use the saved execution to inspect missing synthesis coverage and profile wording offline; then validate that change with one synthesis-only request. A new 15-author batch is unnecessary at this checkpoint.
