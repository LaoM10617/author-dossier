# Institutional candidate priority — 2026-09-13

Both candidate selectors now inspect all extracted search results before choosing candidates. Identity matching remains mandatory. Academic/government domains and selected institutional domains receive priority, followed by Wikipedia, then other results. The heuristic does not establish trust or independence. Already attempted domains and duplicate domains are excluded, and candidate/page budgets are unchanged.

The second search replaces the prior Einstein-specific query with a quoted author name and institutional site filters. No author-specific source URL is hard-coded. This filter is a fallback heuristic with limited domain coverage, not a guarantee of relevant results.

Ranking/identity/diversity/budget tests, generated workflow checks and local n8n mock scenarios passed. The query construction was checked separately. Cached real search results contain no institutional candidates, so their selected URLs do not change; the revised query has not been verified with a live search.

One Gemini synthesis request through local n8n used the saved supplemented research state. Research target remains met, but three generated comparisons failed reference validation and one site fact remained uncovered (7/8 covered). Synthesis is partial; the final envelope remains degraded. Profile contains no implementation fields. Source stages were checked unchanged and no extra webpage, classification, Bio or research calls occurred.

The updated dossier is in ignored artifacts/supplement-synthesis/output.json; sanitized results are in supplement-synthesis-results.json. This is a diagnostic result, not a fully accepted replacement for the earlier checkpoint. Further work should make comparison reference repair aware of validator errors rather than relaxing validation or repeatedly regenerating blindly.
