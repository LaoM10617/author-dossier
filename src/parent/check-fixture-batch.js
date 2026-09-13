const inputs = $('Build Fixture Authors').all().map(x => x.json);
const results = $input.all().map(x => x.json);
const fail = message => { throw new Error(`M03_BATCH_CHECK_FAILED: ${message}`); };
if (inputs.length !== 3 || results.length !== inputs.length) fail('expected three authors and three results');
if (new Set(results.map(x => x.author_id)).size !== inputs.length) fail('duplicate authors');
for (const input of inputs) {
  const result = results.find(x => x.author_id === input.author.author_id);
  if (!result || result.run_id !== input.run_id || result.dossier?.author.author_id !== input.author.author_id) fail('missing or mismatched identity');
  const failedCategory = input.author.author_id.endsWith('/fixture-classification-failed/');
  const verifiable = input.author.author_id.endsWith('/fixture-verifiable/');
  if (result.dossier.outcome !== (failedCategory ? 'degraded' : 'completed')) fail(`unexpected outcome: ${input.author.author_id}`);
  if (result.dossier.bio.status !== 'success') fail('Bio lost');
  const r = result.dossier.research;
  if (verifiable ? r.status !== 'success' : r.status !== 'skipped' || r.skip_reason !== (failedCategory ? 'classification_failed' : 'category_unverifiable')) fail('wrong Research route');
  if (result.control.stop_new_authors !== false) fail('unexpected batch stop');
}
return [{ json: {
  test_passed: true,
  run_id: inputs[0].run_id,
  author_count: results.length,
  completed_count: results.filter(x => x.dossier.outcome === 'completed').length,
  degraded_count: results.filter(x => x.dossier.outcome === 'degraded').length,
  failed_count: results.filter(x => x.dossier.outcome === 'failed').length,
  results,
} }];