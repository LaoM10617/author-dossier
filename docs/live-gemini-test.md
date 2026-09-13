# Personal Gemini integration test

Run from PowerShell on the Windows account that saved the key:

```powershell
powershell -NoProfile -File scripts/local/save-gemini-key.ps1
powershell -NoProfile -File scripts/local/test-gemini.ps1
```

The key is encrypted with Windows DPAPI outside the repository. The test bridge receives it in process memory, removes it from the environment before launching n8n, and never inserts it into workflow JSON. Stop other local n8n test runs first.

This test runs the existing child workflow in the real local n8n engine. Gemini requests use `gemini-flash-lite-latest` (the initial connectivity probe resolved to `gemini-3.5-flash-lite`). Browserless responses reuse synthetic fixtures; no company credential is used. Maximum ten model requests per run. Provider quota/billing settings still apply.

Recorded result: four model requests returned HTTP 200; classification, Bio and synthesis passed their runtime validators. Research was partial and the final envelope was degraded, with an external-source-target limitation. This is API and workflow integration evidence, not real-world research quality validation. In particular, the synthetic Einstein page says “writer”; do not use the output as factual biographical evidence.

Sanitized summary: `live-gemini-results.json`. Detailed execution/output files stay in ignored `artifacts/live/`. Existing production workflow templates are unchanged.
