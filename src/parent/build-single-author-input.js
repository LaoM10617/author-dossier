// M04 input-only setup. Replace this temporary run ID before live service calls.
const items = $input.all();
if (items.length !== 1) throw new Error('SINGLE_AUTHOR_INPUT_INVALID: expected one validated Config');
const config = items[0].json;
const bioUrl = 'https://quotes.toscrape.com/author/Albert-Einstein/';
return [{ json: {
  run_id: 'm04-input-001',
  author: { author_id: bioUrl, name: 'Albert Einstein', bio_url: bioUrl, quote_ids: [] },
  limits: {...config.limits},
  identity_quotes: [],
}, pairedItem: {item:0} }]