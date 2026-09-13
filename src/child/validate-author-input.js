// AuthorInput boundary validator. Shared Limits rules mirror validate-config.js; keep synchronized.
const minima = {
  "gemini_transport_retries": 0,
  "max_page_text_chars": 1,
  "synthesis_reserve_ms": 1,
  "request_timeout_ms": 1,
  "max_pages": 1,
  "max_searches": 1,
  "candidates_per_search": 1,
  "max_research_rounds": 1,
  "author_budget_ms": 1,
  "gemini_repair_calls": 0,
  "max_gemini_requests_per_step": 1,
  "prior_reference_chars_per_source": 1,
  "retry_wait_ms": 1,
  "request_retries": 0,
  "gemini_timeout_ms": 1,
  "packaging_reserve_ms": 1,
  "target_sources": 1,
  "max_model_input_chars": 1
};

const items = $input.all();
const fail = message => { throw new Error(`AUTHOR_INPUT_INVALID: ${message}`); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function exactKeys(value, keys, path) {
  if (!object(value)) fail(`${path} must be an object`);
  for (const key of keys) if (!Object.prototype.hasOwnProperty.call(value, key)) fail(`${path}.${key} is required`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key} is unexpected`);
}
if (items.length !== 1) fail('expected exactly one item');
const config = items[0].json;
exactKeys(config, ['run_id', 'author', 'limits', 'identity_quotes'], 'input');
if (typeof config.run_id !== 'string' || !config.run_id.trim()) fail('run_id must be a nonblank string');
const limits = config.limits;
exactKeys(limits, Object.keys(minima), 'limits');
for (const [key, min] of Object.entries(minima)) {
  if (!Number.isSafeInteger(limits[key]) || limits[key] < min) fail(`limits.${key} must be a safe integer >= ${min}`);
}
if (limits.target_sources > limits.max_pages) fail('target_sources exceeds max_pages');
if (limits.max_research_rounds > 2) fail('max_research_rounds exceeds the two-round design');
if (limits.synthesis_reserve_ms < limits.gemini_timeout_ms) fail('synthesis_reserve_ms must cover one Gemini request');
if (limits.author_budget_ms < Math.max(limits.request_timeout_ms, limits.gemini_timeout_ms) +
    limits.synthesis_reserve_ms + limits.packaging_reserve_ms) fail('author_budget_ms cannot admit an initial request with reserves');
const author = config.author;
exactKeys(author, ['author_id', 'name', 'bio_url', 'quote_ids'], 'author');
if (typeof author.name !== 'string' || !author.name.trim()) fail('author.name must be a nonblank string');
// Check HTTP(S) identity form without relying on a URL global in the Code sandbox.
for (const key of ['author_id', 'bio_url']) {
  if (typeof author[key] !== 'string' || !/^https?:\/\/[^\s/?#]+(?:[^\s]*)$/.test(author[key])) fail(`author.${key} must be an HTTP(S) URL`);
}
if (author.author_id !== author.bio_url) fail('author_id must equal canonical bio_url');
for (const [path, value] of [['author.quote_ids', author.quote_ids], ['identity_quotes', config.identity_quotes]]) {
  if (!Array.isArray(value) || value.some(x => typeof x !== 'string' || !x.trim())) fail(`${path} must be an array of nonblank strings`);
}
if (new Set(author.quote_ids).size !== author.quote_ids.length) fail('author.quote_ids must be unique');
// Empty arrays are allowed. identity_quotes may be a subset; do not require equal lengths.
// Preserve AuthorInput without adding internal state or result fields.
return [{ json: config, pairedItem: { item: 0 } }];

