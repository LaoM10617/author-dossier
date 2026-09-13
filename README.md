# Author Dossier

An n8n parent/child pipeline for quote intake, author classification, website biography extraction, independent research and evidence-based synthesis.

## Quick start

For the local editor, credential binding and import verification, see [the local UI guide](docs/local-editor-check.md). For precisely scoped open quality questions and search terms, see [synthesis quality investigation](docs/synthesis-quality-investigation.md).

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

Research policy, paragraph selection and synthesis contracts are maintained in `src/shared` and injected during the build. Some legacy Code-node helpers remain duplicated.

## Architecture

Parent: fetch two quote pages via Browserless, extract quotes, deduplicate by author biography URL, call one child at a time, reconcile results by identity.

Child: four separate Gemini responsibilities (classification, Bio, Research, Synthesis). Bio is intended for every author; Research calls are gated by a verifiable classification. Research uses external page excerpts with paragraph references. Accepted facts retain source references and supporting text. Bounded retries and time reserves protect synthesis and result packaging. Missing child results produce explicit fallbacks rather than disappearing authors.

## Testing options

1. **Local build checks:** `npm test` has no API calls and does not emulate n8n execution.
2. **Real local n8n engine:** use the self-hosted Community edition via Docker or npm. Import the workflows, bind personal credentials and test one author before a full batch. Match the original engine version where known; it has not been recovered from node type versions.
3. **Real n8n with mock responses:** `npm run setup:n8n` followed by `npm run test:n8n` executes mixed failures, shared stop, and full synthetic two-page intake in n8n 2.38.7. See [local integration tests](docs/local-n8n-tests.md).
4. **Live integration:** requires independently configured Browserless and Gemini access. Hosting n8n locally does not provide those API services or company credentials.

Official setup: https://docs.n8n.io/hosting/installation/docker/

## Validation status

On 2026-09-13, local n8n 2.38.7 fetched both real pages (20 quotes, 15 unique authors), passed a one-author smoke, then completed one full real-provider batch using that fresh saved intake in 5m12s. All 15 authors returned without duplicates or child fallbacks. Classification: 15 success; Bio: 14 success, 1 partial; Research: 5 partial, 10 failed; Synthesis: 15 success under the runtime contract. All 15 dossiers remain degraded. All accepted Bio facts occur in comparisons, and all authors have profiles; this does not establish factual correctness or complete citation coverage.

`npm test` and `npm run test:n8n` passed before this run. See [final validation](docs/final-validation.md) for scope and remaining quality limitations. The [frozen delivery](delivery/release-1789324402547/README.md) includes clean parent/child imports, the observed batch output and checksums. Tests used a local credential bridge to real providers; the exports require credentials and a child binding in the destination instance. Original company correspondence and credential records are excluded.

## Known limitations

Search candidate recall, source access and model independence judgments still limit research. Paragraph references enforce provenance, not semantic entailment. Manual review found incomplete profile citation coverage and inconsistent work-subject normalization. Research uses bounded candidate replacement, two model rounds and a default three-page budget. The project demonstrates complete orchestration and explicit degradation, not production-grade independent verification.

## Development policy

Preserve the delivered baseline while improving retrieval and semantic tests. Keep credentials in n8n, never in source. `dist`, personal `.env` files and local execution artifacts are ignored. This project has no selected open-source license yet; repository visibility and licensing are pending owner choice.
