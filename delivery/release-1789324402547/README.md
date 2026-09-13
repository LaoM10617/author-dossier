# Author Dossier — frozen delivery snapshot

Import child-workflow.json first, then parent-workflow.json. Both are inactive and contain no credential bindings. In the parent Call Live Author node, replace REPLACE_WITH_IMPORTED_CHILD_ID with the imported child. Bind Browserless query authentication (parameter token) on the HTTP nodes using that service, and the Gemini credential on Gemini HTTP nodes, including retry/repair nodes. If the installed n8n version requires a published child for sub-workflow execution, publish it before testing. Both workflows must be accessible to the importing user.

The parent normally fetches the first two Quotes to Scrape pages, deduplicates authors and calls the child once per author. The child performs classification, Bio, conditional web research, comparison and profile generation. The Gemini endpoint uses gemini-flash-lite-latest, the alias used in local live tests; provider aliases and quotas can change. Supply personal or explicitly authorized service credentials.

These production exports retain provider URLs. Tests bound those requests through a local credential bridge, so importing alone does not supply credentials. There are no loopback test endpoints or embedded API keys in the exports.

checksums.json identifies these exact workflow files. The final validation report and batch output accompany this snapshot when validation completes. A sampled smoke output is not the full batch. Degraded entries deliberately preserve evidence limitations; they are not claims of full independent verification.

The two-source target is a project quality setting, not a numerical requirement stated by the original exercise. Tests must still check routing, deduplication, distinct agents, comparisons, profiles and explicit limitations.

Validation completed on 2026-09-13: 20 quotes, 15 authors returned, 15 degraded and 0 failed dossiers. All 15 profiles are present. Research remains limited (5 partial, 10 failed); see VALIDATION.md for manual review findings and the distinction between runtime success and semantic quality. report.json contains measured counts; batch-output.json contains the observed dossiers.
