// M03 serial-loop stop path. Current Author and Normalize each run once per called author.
const fail = message => { throw new Error(`M03_STOP_CHECK_FAILED: ${message}`); };
const items = $input.all();
if (items.length !== 1) fail('expected one stop envelope');
const trigger = items[0].json;
const control = trigger.control;
if (!control || control.stop_new_authors !== true || control.scope !== 'batch' ||
    control.code !== 'FIXTURE_GLOBAL_SERVICE_BLOCKED' || control.service !== 'gemini') fail('invalid stop fixture');
const inputs = $('Build Fixture Authors').all().map(x => x.json);
const stopIndex = inputs.findIndex(x => x.author.author_id === trigger.author_id);
if (inputs.length !== 3 || stopIndex !== 1) fail('expected second fixture to stop');
const results = [];
// Serial input order and no bypass before Normalize are explicit prerequisites.
for (let i = 0; i <= stopIndex; i++) {
  const returned = $('Normalize Author Return').all(0, i);
  if (returned.length !== 1) fail('completed return cardinality');
  const envelope = returned[0].json;
  if (envelope.author_id !== inputs[i].author.author_id || envelope.run_id !== inputs[i].run_id ||
      envelope.dossier?.author.author_id !== envelope.author_id) fail('completed return identity');
  if (envelope.dossier.outcome !== 'completed' || envelope.dossier.bio.status !== 'success' ||
      envelope.dossier.synthesis.status !== 'success') fail('completed fixture data lost');
  if (i < stopIndex && envelope.control.stop_new_authors) fail('earlier stop ignored');
  results.push(envelope);
}
for (const input of inputs.slice(stopIndex + 1)) {
  const skipped = () => ({
    author_id: input.author.author_id,
    status: 'skipped', data: null,
    issues: [{code:control.code, message:control.reason, source_id:null}],
    skip_reason: 'global_service_blocked',
  });
  results.push({
    run_id: input.run_id,
    author_id: input.author.author_id,
    dossier: {
      author: input.author,
      classification: skipped(), bio: skipped(), research: skipped(), synthesis: skipped(),
      outcome: 'failed',
      limitations: ['Not scheduled because the batch was stopped.', 'Synthetic M03 batch-stop test; no actual service outage detected.'],
    },
    control: {...control},
  });
}
if (results.length !== inputs.length || new Set(results.map(x => x.author_id)).size !== inputs.length) fail('author reconciliation');
return [{ json: {
  test_passed:true, test_case:'batch_stop', run_id:trigger.run_id,
  author_count:results.length, completed_count:2, degraded_count:0, failed_count:1,
  scheduled_author_count:stopIndex+1, blocked_author_count:inputs.length-stopIndex-1,
  stop_reason:control.code, results,
} }];