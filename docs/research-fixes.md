# Research handling fixes — 2026-09-13

Root causes from saved real execution: Britannica returned a target-site 403 challenge while Browserless returned HTTP 200; Wikipedia produced approximately 115,000 extracted characters including embedded link URLs, then the collector cut off at character 20,000.

The three page collectors now share a build-injected helper. It distinguishes source access denial, includes the affected URL in diagnostics, falls back from unusably short article markup to main/body paragraphs, removes rendered link URLs and numeric citation markers, deduplicates paragraphs, and selects complete paragraphs across the page under the existing character budget. Selection prioritizes the lead, Bio work/institution terms and biographical language. Evidence validation still requires an exact match against submitted text; selected excerpts remain explicitly marked partial. No challenge bypass or hidden increase in budget was added.

Checks passed: saved-page regression (403 excluded, two usable pages retained, bounded text, no rendered URLs, photoelectric paragraph present), short-markup fallback and oversized-paragraph edge cases; build/import validation; real local n8n synthetic mixed/stop/intake suites.

One real Gemini research replay used both saved usable pages in a single request. This differs from the original two research rounds. It accepted 13 facts but assessed the second source's independence as uncertain, leaving one qualified source; the two-source acceptance assertion failed. See research-replay-results.json. Do not claim complete research acceptance or replace the earlier final dossier with this intermediate output. No webpage or synthesis requests were repeated.

Remaining: the 403 cannot be fixed by extraction rules; use an alternative independent source. A long page still cannot be fully covered under the configured limit. Excerpt selection mitigates the old prefix cutoff but remains heuristic and may omit relevant material. Source independence needs further validation with a clearer second source; retain uncertainty rather than force success.
