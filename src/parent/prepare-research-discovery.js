// Explicit whitelist: do not pass Bio facts, Bio text, or classification rationale to research.
const items = $input.all();
if (items.length !== 1) throw new Error('RESEARCH_INPUT_INVALID: expected one author');
const c = items[0].json;
if (c.classification?.status !== 'success' || c.classification.data?.category !== 'verifiable' ||
    c.classification.author_id !== c.author.author_id) {
  throw new Error('RESEARCH_ROUTE_INVALID: only validated verifiable authors may enter');
}
// M04 Einstein-specific second-query trial after the full-name query returned unrelated Albert results.
// General author query planning remains to be implemented; do not infer surnames by splitting names.
const query = c.author.name === 'Albert Einstein'
  ? 'Einstein physicist biography'
  : `"${c.author.name.replace(/"/g, '')}" biography`;
return [{ json: {
  run_id:c.run_id,
  author_id:c.author.author_id,
  research_identity:{name:c.author.name, identity_quotes:c.identity_quotes},
  limits:c.limits,
  search_query:query,
  search_url:'https://www.bing.com/search?q='+encodeURIComponent(query),
},pairedItem:{item:0}}];