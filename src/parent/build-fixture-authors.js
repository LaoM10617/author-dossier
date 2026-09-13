// M03 synthetic inputs only. These URLs are identifiers, never fetch targets.
// Routing will be tested with separate classification fixtures in the child.
const items = $input.all();
if (items.length !== 1) throw new Error('FIXTURE_INPUT_INVALID: expected one Config');
const config = items[0].json;
const fixtures = [
  ['fixture-verifiable', 'Fixture Verifiable Author'],
  ['fixture-unverifiable', 'Fixture Unverifiable Author'],
  ['fixture-classification-failed', 'Fixture Classification Failure'],
];
return fixtures.map(([slug, name]) => {
  const bioUrl = `https://example.org/authors/${slug}/`;
  return {
    json: {
      run_id: config.run_id,
      author: { author_id: bioUrl, name, bio_url: bioUrl, quote_ids: [] },
      limits: { ...config.limits },
      identity_quotes: [],
    },
    pairedItem: { item: 0 },
  };
});