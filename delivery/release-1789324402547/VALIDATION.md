# Final validation — 2026-09-13

The frozen implementation completed the four-step closeout. No quality-driven batch reruns were performed.

1. Offline acceptance: `npm test` passed assembly, contracts, research policy, excerpts, candidate ordering and paragraph references. `npm run test:n8n` passed actual n8n 2.38.7 execution with simulated mixed failures, shared stop, intake and bounded candidate replacement.
2. Live smoke: Browserless fetched the first two Quotes to Scrape pages, producing 20 quotes and 15 unique authors. One sampled author completed the parent/child path.
3. Live batch: the full fresh intake was reused once. All 15 authors returned in 311,541 ms, without duplicates, missing identities, child fallback envelopes or a batch stop. Classification: 15 success. Bio: 14 success, 1 partial. Research: 5 partial, 10 failed. Synthesis: 15 runtime-contract success. Final outcomes: 0 completed, 15 degraded, 0 failed.
4. Delivery audit: quote associations, summary totals, fact references and comparison fields passed. Every author has a profile; all accepted Bio facts appear in comparisons. Clean workflow snapshots contain no credential bindings or embedded provider keys; their SHA-256 checksums were verified.

## Manual review and remaining limitations

- J.K. Rowling: two sources qualified under the model/policy assessment. Birth and school comparisons retained source references; research still carries truncation and rejected-fact warnings. The profile's Harry Potter claim is present elsewhere in research, but its `profile_fact_ids` do not cite the relevant fact. Runtime success therefore does not mean complete semantic/citation acceptance.
- Jane Austen: neither search produced an accepted identity-matching candidate. All ten accepted Bio facts remain explicitly `site_only`; the profile and author are retained with incomplete-verification limitations.
- Einstein: Nobel and Wikipedia content was retrieved, but the model marked independence uncertain. The conservative policy excluded these facts from synthesis corroboration. This shows that retrieval success alone is insufficient; independence judgments remain a quality bottleneck.
- Work-subject normalization is still inconsistent, and a valid paragraph reference cannot prove that a whole claim follows from the paragraph. Douglas Adams had one Bio fact rejected for absent supporting text. No workflow changes or extra model calls were made after this acceptance run.

Only one author met the configured two-source target. That target is a project quality setting, not an explicit numerical requirement of the original exercise. This run establishes operational completion and transparent degradation, not comprehensive independent research quality or model stability across repeated runs.

## Reproduction and scope

The live test used the real local n8n engine with a local credential bridge forwarding to Browserless and Gemini `gemini-flash-lite-latest`. Intake was fetched once, followed by a sampled smoke and a full saved-intake batch. This tests the complete chain in two stages; it is not a separate single-trigger live run of the final portable exports. Destination credentials, child selection and permissions must be configured after import.

Evidence: `docs/final-validation-results.json`; local raw artifacts: `artifacts/release-1789324402547`; portable snapshot: `delivery/release-1789324402547`. The snapshot includes the final batch result and excludes local execution logs and raw HTTP captures. Earlier reports document earlier revisions and should not be treated as this run's results.
