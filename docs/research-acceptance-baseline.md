# Fixed research acceptance baseline

Run `npm test` for offline contract, policy, ranking and evidence-selection tests. Run `npm run test:n8n` for the real local engine with synthetic provider responses. Neither command makes external provider requests. Fixtures live in tests/fixtures/research-cases.json and the long-text assertions in tests/n8n/research-acceptance.cjs; tests do not require personal keys or downloaded execution logs. Optional cached-page checks use tests/n8n/research-replay.cjs without --live.

Fixed cases: target 403 despite provider 200; empty body; same-name candidate assessed as the wrong person; Wikipedia language mirrors; insufficient sources; two distinct qualifying source assessments. Additional assertions cover long pages, a relevant work paragraph beyond the lead, missing candidate evidence, oversized paragraphs, duplicate paragraphs, excerpt offsets, request budgets, source replacement and unsuccessful synthesis repair.

Identity/independence fixtures supply controlled model assessments. They verify that code enforces those assessments, not that a live model will always judge them correctly. Real-model semantic evaluation remains a separate bounded test.

## Question-oriented excerpts

The extractor first gives each Bio fact a chance to retrieve a relevant paragraph, then fills remaining space with context. Birth/role cues and work/institution tokens are retrieval heuristics. Selection retains whole normalized paragraphs under the existing character budget. It does not generate summaries or claim complete page coverage.

Per-source runtime `excerpt_trace` records the extraction selector, original index within that selector's paragraph array, normalized-text start/end, submitted-text start/end, original extracted paragraph length, selection reason and candidate fact IDs. End offsets are exclusive. Normalized offsets refer to the deduplicated cleaned paragraph stream, not raw HTML or DOM byte locations. Submitted offsets locate exact evidence within submitted_text.

Each question is marked candidate_found or not_found_in_excerpt. Neither value is a truth/entailment judgment; not_found does not mean the website lacks the information. Existing source identity, evidence quotation and comparison validators still apply. Diagnostics remain in source_states to avoid expanding model input or changing the public dossier contract.

Current limitations: English cue vocabulary, lexical work/institution matching, and complete-paragraph selection can miss paraphrases or oversized paragraphs. Tests deliberately preserve these cases as incomplete coverage rather than quietly cutting a paragraph or marking evidence verified.
