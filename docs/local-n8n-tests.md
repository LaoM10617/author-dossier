# Local n8n integration tests

These tests use **n8n 2.38.7 itself**, including HTTP Request, HTML extraction, IF routing, Loop Over Items, Execute Workflow and Code nodes. A local HTTP server supplies synthetic provider responses; no Browserless or Gemini account is needed and the workflow HTTP nodes point only to `127.0.0.1:5689`.

## Run

With Node.js 24.x and npm available, from the project root:

```sh
npm run setup:n8n
npm run test:n8n
```

The pinned n8n package installs under `.runtime`, not globally. The first installation can take several minutes. Database and generated encryption configuration live under `.runtime/data/.n8n`. Nothing there is committed. n8n's internal task broker uses port 5679; the mock server uses 5689. Close any process already using these ports before testing.

The runner generates four workflows, imports them into the isolated local database, publishes only the mock child, and executes three scenarios sequentially. Publishing is needed for the child calls from CLI mode on this version. Before re-importing it unpublishes that same mock child so subsequent runs are repeatable. The mock server is stopped when the runner finishes.

## Scenarios

- **Mixed batch:** 8 synthetic authors: normal, unverifiable, classification failure, empty facts, synthesis HTTP failure, child exception, zero child output, and a final normal author. Expected: 3 completed, 2 degraded, 3 failed; the last author must complete. HTTP call records must show no research for unverifiable/classification-failed authors and no synthesis for empty facts. Synthesis failure must preserve Bio and Research facts.
- **Shared stop:** normal author, simulated provider 401, then unscheduled author. Only two child invocations; all three identities remain in the output, with the last explicitly blocked.
- **Full intake:** two synthetic HTML pages containing four quotes and three distinct authors, including an author repeated across pages. Uses the production intake graph and checks quote association, deduplication and three completed dossiers.

`artifacts/n8n-test-results.json` contains the concise result. Execution logs and HTTP call records are under `artifacts`; they are ignored by Git. `tests/n8n/responses.cjs` defines deterministic responses, and `tests/n8n/build.cjs` changes only the test workflow copies. Child exception/empty-output cases use an explicit test-only injection node.

## Boundaries

This proves local engine behavior on this version with fixed data, not search quality, model reasoning or compatibility with an unidentified company-server version. It does not close the known occupation-versus-belief semantic issue. The mixed scenario's empty-fact author currently has a failed Research status when subsequent discovery produces no new candidates; its no-profile and preservation behavior are asserted, but comprehensive legal-empty Research state semantics remain future coverage.

No UI account is required for these CLI tests. For optional visual inspection on Windows, run:

```powershell
$env:N8N_USER_FOLDER = Join-Path $PWD '.runtime/data'
$env:N8N_DIAGNOSTICS_ENABLED = 'false'
$env:N8N_LISTEN_ADDRESS = '127.0.0.1'
node .runtime/node_modules/n8n/bin/n8n start
```

Then open http://localhost:5678 and complete local account setup if prompted. Stop the UI server before running the CLI integration suite, as both use the same database/task broker. A published mock child is reachable only by local workflow execution; it has no webhook or schedule trigger.
