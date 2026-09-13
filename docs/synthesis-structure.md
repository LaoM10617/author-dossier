# Deterministic synthesis tasks

The internal Gemini response now answers code-generated tasks instead of constructing the public comparison collection freely. Each Bio fact has a mandatory anchor task. Allowed references consist of that anchor and same-field web facts; unmatched web fields receive one-sided tasks. Same-field candidates are not presumed to be equivalent claims. The model still judges the relationship.

Code supplies public scope, field and subject from the anchor. It checks anchor inclusion, reference membership, duplicate/missing task responses and conclusion/evidence compatibility. A single bounded repair request contains only failed tasks and their validation errors. A previously accepted profile and comparisons remain immutable. A missing/invalid profile is repaired independently. Repair respects the existing time, input-size and call budgets.

When a task remains invalid or a repair request fails, code emits an explicit inconclusive comparison with only its anchor and records SYNTHESIS_TASK_UNRESOLVED. This is a processing failure, not a model-derived judgment. The dossier stays partial/degraded. Missing profiles remain null with an issue. Verification limitations are built by code, outside the profile. The public dossier schema is unchanged; internal prompts and model responses changed together.

Regression coverage includes wrong-field references, missing/duplicate tasks, accepted-result preservation during repair, transport failure after partial success, technical profile fields and exhausted call budgets. Tests are part of npm test. Mock responses use the new internal task contract.

This prevents structural omissions and invalid IDs from silently passing. It does not prove semantic entailment, genuine source independence or prose accuracy. Same-field work/affiliation candidates can concern different events; model judgment remains necessary.

Real-provider validation subsequently used two calls. All eight Bio tasks and the profile passed initially and remained unchanged during targeted repair. Seven one-sided web tasks incorrectly used site_only even after repair. These assignments are now determined by code and omitted from model tasks. Reprocessing the saved response with the deterministic correction passed all 15 comparisons and preserved accepted results/profile. The original live run was partial; the corrected result is an offline validation, not a new live-model run. Overall dossier remains degraded because Research limitations persist. See structured-synthesis-validation.json.

Implementation: src/shared/synthesis-contract.js is injected into the preparation, repair and packaging nodes by the build. Rebuild both workflow JSON files before importing; do not update only one of these nodes in n8n.
