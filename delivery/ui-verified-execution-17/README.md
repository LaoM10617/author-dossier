# Latest local-editor handoff

Import child-workflow.json first, then parent-workflow.json as a separate workflow. Bind credentials on every HTTP node and select the imported child in Call Live Author. No local credential bindings or keys are included.

See [reproduction instructions](../../docs/reproduce.md). `batch-output.json` is local editor execution #17; `validation.json` records scope and counts. It returned 20 quotes and 15 authors. Classification/Bio/synthesis contracts succeeded for all; research was partial for 4 and failed for 11. All dossiers were degraded, not independently verified in full.

`checksums.json` identifies the workflow files and observed output. Earlier snapshots are separately archived. Provider responses are environment dependent.
