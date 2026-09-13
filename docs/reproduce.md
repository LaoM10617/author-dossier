# Reproduce the author dossier workflow

Use `delivery/ui-verified-execution-17`, the sanitized exports from local editor validation. `batch-output.json` records that run; `validation.json` summarizes it. Hashes identify the two workflows and output. This is a full fresh-intake parent run, separate from the earlier staged credential-bridge test.

## Import and configure

1. Use n8n 2.38.7 for the closest match. Create a new workflow, choose Import from File, import `child-workflow.json`, and save.
2. Create another workflow and import `parent-workflow.json`. Do not paste both into one canvas.
3. Create Browserless **Query Auth** credentials: Name `token`, Value the token alone, without `?token=`. Select this credential in the parent's two Fetch Page nodes and the child's 12 Browserless HTTP nodes: Bio Page, Search 1/2, R1 Page 1/2, R2 Page 1, including retries.
4. Create **Google Gemini(PaLM) API** credentials: Host `https://generativelanguage.googleapis.com`, API key your authorized key. Select it in all 15 child Gemini HTTP nodes: Categorizer, Bio Gemini, Research 1/2, Synthesis, each with normal/retry/repair nodes. URLs use the tested `gemini-flash-lite-latest` alias.
5. In parent **Call Live Author**, replace `REPLACE_WITH_IMPORTED_CHILD_ID` by selecting the imported child. Keep waiting for the result. Ensure the child allows the parent project/user to call it. Save both; publish the child if required by the instance.
6. Inspect the canvas and all HTTP credential selections. Check loop return/done paths, skipped research reaching merge, and synthesis reaching output. A successful parent fetch or categorizer does not prove the other child nodes are configured.
7. Run the parent manual trigger. This calls real services for all authors from both pages. Do not judge the child by executing it without author input.

The [Windows editor guide](local-editor-check.md) covers startup and local account setup. Use the new `delivery/ui-verified-execution-17` snapshot instead of the earlier snapshot in that guide.

## Verify

In **Finalize Batch**, inspect page completeness, quote and author counts, unique IDs, outcome totals and stop reason. The recorded input has 20 quotes and 15 authors. Follow child executions from **Call Live Author** to inspect stage errors. Save the actual latest execution result, not an old editor output.

Expected engineering behavior is preserved author identity and explicit evidence limitations. The observed run has 15 degraded dossiers despite successful classification/Bio/synthesis contracts. Synthesis success does not prove complete citation or semantic correctness; live results can differ.

If Bio is universally unavailable, inspect **Bio Page HTTP** before changing prompts. `Credentials not found` is a binding error, not evidence of a failed website or invalid token. Check retry/repair nodes too.

## Offline acceptance

Run `npm test`. For integration scenarios in a real engine, run `npm run setup:n8n` then `npm run test:n8n`. The harness uses simulated responses and separate local data. Stop the editor first to avoid task-runner port conflicts. These tests validate orchestration without provider calls, not factual quality.

## Technical conclusion

The core routed pipeline completed a real local editor run. The main observed research-coverage failure is unrelated content in Bing pages retrieved through Browserless `/content`; the upstream mechanism is unresolved. Synthesis attribution and semantic matching remain limitations. See [search diagnosis](search-candidate-diagnosis.md) and [synthesis investigation](synthesis-quality-investigation.md).

A cover email should summarize this result briefly and link here. This document carries reproduction details and evidence; neither should claim that every quality requirement is fully verified or that Browserless itself is proven defective.
