// Current M04 path has one author and one request. Replace first() when adding request loops.
const prepared = $('Prepare Classification Request').first().json;
const items = $input.all();
const response = items.length === 1 ? items[0].json : null;
let data = null;
let issue = null;
const reject = (code, message) => { issue = {code, message, source_id:null}; };
if (!response || Object.keys(response).length === 0) {
  reject('CLASSIFICATION_EMPTY_RESPONSE', 'No response was returned.');
} else if (items.length !== 1 || response.error || response.statusCode !== 200) {
  reject('CLASSIFICATION_REQUEST_FAILED', 'The classification request did not return a successful HTTP response.');
} else {
  const body = response.body;
  const candidates = body?.candidates;
  if (!Array.isArray(candidates) || candidates.length !== 1 || candidates[0].finishReason !== 'STOP') {
    reject('CLASSIFICATION_INCOMPLETE_RESPONSE', 'Expected one completed, unblocked model candidate.');
  } else {
    const parts = candidates[0].content?.parts;
    const text = Array.isArray(parts) ? parts.filter(p => p.thought !== true && typeof p.text === 'string').map(p => p.text).join('') : '';
    try {
      const parsed = JSON.parse(text);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object' ||
          Object.keys(parsed).length !== 2 || !Object.hasOwn(parsed, 'category') || !Object.hasOwn(parsed, 'reason') ||
          !['verifiable', 'unverifiable'].includes(parsed.category) ||
          typeof parsed.reason !== 'string' || !parsed.reason.trim()) throw new Error('invalid classification');
      data = parsed;
    } catch {
      reject('CLASSIFICATION_INVALID_OUTPUT', 'Model output did not satisfy the category/reason contract.');
    }
  }
}
return [{ json: {
  run_id: prepared.run_id,
  author: prepared.author,
  limits: prepared.limits,
  identity_quotes: prepared.identity_quotes,
  classification: {
    author_id: prepared.author.author_id,
    status: issue ? 'failed' : 'success',
    data,
    issues: issue ? [issue] : [],
    skip_reason:null,
  },
  classification_call: {
    attempt:1,
    http_status: Number.isInteger(response?.statusCode) ? response.statusCode : null,
    model_version: response?.body?.modelVersion ?? null,
    usage: response?.body?.usageMetadata ?? null,
  },
}, pairedItem: {item:0} }];