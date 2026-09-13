# Synthesis-only correction — 2026-09-13

Reused the saved real-page execution; no Browserless, classification, Bio, or research requests were repeated. One Gemini synthesis request returned HTTP 200 through local n8n.

Changes: the synthesis prompt now supplies a checklist of all site fact IDs and explicitly requires each to appear in a comparison. Verification caveats and counts belong in limitations, not the biographical profile. Packaging now flags profiles containing implementation field names or evidence IDs; missing comparisons continue to be flagged rather than silently invented.

Validation: local regression checks detect both defects in the original response and accept a complete clean test response. Import/build checks passed. The live replay covered all eight site facts, produced a three-sentence profile without implementation fields, and returned synthesis success with no validation issues. Classification, Bio and research objects were checked for exact equality with the previous output.

The dossier remains degraded because research retains its unavailable-page and text-truncation issues. This change does not repair research or establish full semantic accuracy. Narrative chronology and factual entailment still merit human review.

Run `powershell -NoProfile -File scripts/local/test-gemini.ps1 -SynthesisOnly` after the real-page checkpoint exists. Detailed outputs are ignored under artifacts/synthesis-replay. The replay resets only the synthesis time budget and limits upstream generation to one request. Sanitized results: synthesis-replay-results.json.
