# Author Dossier

An n8n parent/child pipeline for quote intake, author classification, website biography extraction, independent research and evidence-based synthesis.

## Quick start

Requires Node.js 20+ for local build checks. No npm dependencies are needed.

```sh
npm run build
npm test
```

Import `dist/child-workflow.json` first, then `dist/parent-workflow.json` into your own n8n instance. Bind your own Gemini and Browserless credentials on the HTTP nodes, and select the imported child in `Call Live Author`. Execute the parent manual trigger. The two workflows are separate imports, not an automatically linked bundle.

## Layout

- `src/parent`, `src/child`: editable JavaScript for each Code node.
- `workflows/*.template.json`: node settings, prompts outside Code nodes and connections.
- `scripts/build.cjs`: assembles importable workflow JSON into `dist`.
- `scripts/test.cjs`: compilation, wiring and clean-import checks.

Code nodes currently embed shared helpers repeatedly. This preserves the existing operational code during extraction; consolidating these helpers is a follow-up refactor, not a completed optimization.

## Architecture

Parent: fetch two quote pages via Browserless, extract quotes, deduplicate by author biography URL, call one child at a time, reconcile results by identity.

Child: four separate Gemini responsibilities (classification, Bio, Research, Synthesis). Bio is intended for every author; Research calls are gated by a verifiable classification. Research model input excludes extracted Bio facts. Accepted facts retain source references and supporting text. Bounded retries and time reserves protect synthesis and result packaging. Missing child results produce explicit fallbacks rather than disappearing authors.

## Testing options

1. **Local build checks:** `npm test` has no API calls and does not emulate n8n execution.
2. **Real local n8n engine:** use the self-hosted Community edition via Docker or npm. Import the workflows, bind personal credentials and test one author before a full batch. Match the original engine version where known; it has not been recovered from node type versions.
3. **Real n8n with mock responses:** `npm run setup:n8n` followed by `npm run test:n8n` executes mixed failures, shared stop, and full synthetic two-page intake in n8n 2.38.7. See [local integration tests](docs/local-n8n-tests.md).
4. **Live integration:** requires independently configured Browserless and Gemini access. Hosting n8n locally does not provide those API services or company credentials.

Official setup: https://docs.n8n.io/hosting/installation/docker/

## Validation status

Before repository extraction, the saved-intake variant completed a real 15-author run: no missing or duplicate authors; all dossiers degraded. Classification and Bio succeeded for all; Research was partial for 4 and failed for 11; Synthesis was successful for 10 and partial for 5. Separately, the two-page intake returned 20 quotes. The cleaned fresh-intake variant still needs a live end-to-end run in the destination environment.

`npm test` validates assembly and structure; `npm run test:n8n` separately validates actual local engine behavior using synthetic HTTP responses. Earlier workspace semantic regression tests are not yet fully migrated here; neither command implies complete semantic acceptance. No company execution exports, task text, correspondence, credential records or raw scraped pages are included.

## Known limitations

Search relevance remains inconsistent (including irrelevant results for correctly formed full-name searches). Semantic grounding and comparison coverage need improvement; one prior semantic test still accepted a belief as an occupation. Intake retries and comprehensive conflict/fault testing are incomplete. Research has two rounds and three page slots; increasing a configuration number does not create more slots. This is a working development baseline, not production certification.

## Development policy

Preserve the delivered baseline while improving retrieval and semantic tests. Keep credentials in n8n, never in source. `dist`, personal `.env` files and local execution artifacts are ignored. This project has no selected open-source license yet; repository visibility and licensing are pending owner choice.
