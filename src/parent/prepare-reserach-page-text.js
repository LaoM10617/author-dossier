// M04 single-author probe. Reuses Prepare Bio Request's source/text preparation.
const context = $('Prepare Research Discovery').first().json;
const fetch = $('Fetch Research Page').first().json;
const items = $input.all();
const fail = message => { throw new Error(`RESEARCH_PAGE_INVALID: ${message}`); };
if (items.length !== 1) fail('expected one extracted page');
const extracted = items[0].json;
const clean = text => text.replace(/\s+/g, ' ').trim();
if (fetch.statusCode !== 200 || Number(fetch.headers?.['x-response-code']) !== 200) fail('fetch was not successful');
if (!Array.isArray(extracted.page_titles) || extracted.page_titles.length !== 1 || typeof extracted.page_titles[0] !== 'string') fail('expected one title');
if (!Array.isArray(extracted.page_texts) || !extracted.page_texts.every(x => typeof x === 'string')) fail('expected paragraph array');
const paragraphs = extracted.page_texts.map(clean).filter(Boolean);
const fullText = paragraphs.join('\n\n');
if (!fullText) fail('empty text');
const limit = context.limits.max_page_text_chars;
if (!Number.isSafeInteger(limit) || limit < 1) fail('invalid text limit');
const submitted_text = fullText.slice(0, limit);
// Explicit current probe candidate; generic candidate scheduling comes later.
const requested_url = 'https://en.wikipedia.org/wiki/Albert_Einstein';
if (fetch.headers?.['x-response-url'] !== requested_url) fail('unexpected final URL');
const title = clean(extracted.page_titles[0]);
if (title !== context.research_identity.name) fail('unexpected probe title');
const responseDate = new Date(fetch.headers?.date);
if (!Number.isFinite(responseDate.getTime())) fail('missing response timestamp');
return [{json: {
  ...context,
  research_page: {
    source: {source_id:'research:1', url:requested_url, requested_url, title, retrieved_at:responseDate.toISOString()},
    submitted_text, original_text_chars:fullText.length,
    truncated:submitted_text.length < fullText.length,
    paragraph_count:paragraphs.length, timestamp_basis:'http_response_date',
  },
}, pairedItem:{item:0}}];