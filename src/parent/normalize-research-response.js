// Intermediate single-page extraction, NOT the final ResearchResult contract.
// Current probe used one initial call plus one manual revision.
// Same single-request transport checks as Normalize Classification Response.
const prepared = $('Prepare Research Request').first().json;
const items = $input.all();
const response = items.length === 1 ? items[0].json : null;
const issues = [];
const issue = (code, message) => issues.push({code,message,source_id:prepared.research_page.source.source_id});
let parsed = null;
if (!response || response.error || response.statusCode !== 200) {
  issue('RESEARCH_REQUEST_FAILED','Research request did not return one successful HTTP response.');
} else {
  const candidates = response.body?.candidates;
  if (!Array.isArray(candidates) || candidates.length !== 1 || candidates[0].finishReason !== 'STOP') {
    issue('RESEARCH_INCOMPLETE_RESPONSE','Expected one completed, unblocked candidate.');
  } else {
    const parts = candidates[0].content?.parts;
    const text = Array.isArray(parts) ? parts.filter(p=>p.thought!==true && typeof p.text==='string').map(p=>p.text).join('') : '';
    try {
      parsed = JSON.parse(text);
      if (!parsed || Array.isArray(parsed) || Object.keys(parsed).length !== 1 || !Array.isArray(parsed.facts)) throw new Error();
    } catch { parsed=null; issue('RESEARCH_INVALID_OUTPUT','Expected an object containing only a facts array.'); }
  }
}
const facts = [];
const seen = new Set();
const keys = ['field','subject','value','source_id','evidence_text'];
const nonblank = v=>typeof v==='string' && v.trim().length>0;
const validDate = v=> {
  if (!/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/.test(v)) return false;
  if (v.length < 10) return true;
  const date = new Date(v+'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===v;
};
for (const [index,f] of (parsed?.facts ?? []).entries()) {
  let reason = null;
  if (!f || Array.isArray(f) || typeof f!=='object' || Object.keys(f).length!==keys.length || !keys.every(k=>Object.hasOwn(f,k))) reason='wrong fields';
  else if (!['birth_date','birth_place','occupation','work','affiliation'].includes(f.field)) reason='unknown fact field';
  else if (!nonblank(f.value) || !nonblank(f.evidence_text)) reason='empty value or evidence';
  else if (['work','affiliation'].includes(f.field) ? !nonblank(f.subject) : f.subject!==null) reason='invalid subject';
  else if (f.source_id!==prepared.research_page.source.source_id) reason='unknown source';
  else if (!prepared.research_page.submitted_text.includes(f.evidence_text)) reason='evidence is not a verbatim submitted-text substring';
  else if (f.field==='birth_date' && !validDate(f.value)) reason='invalid date';
  // Conservative checks; these reject ambiguous claims rather than rewriting model facts.
  if (!reason && f.field==='work' && ['paper','theory','work',prepared.research_identity.name.toLowerCase()].includes(f.subject.trim().toLowerCase())) reason='work subject is too generic or is the author';
  if (!reason && /\bby (\d{4})\b/i.test(f.value)) {
    const year = f.value.match(/\bby (\d{4})\b/i)[1];
    if (f.evidence_text.includes('In '+year) && !new RegExp('\\bby '+year+'\\b','i').test(f.evidence_text)) reason='value changes an explicit in-year to by-year';
  }
  if (reason) { issue('RESEARCH_FACT_REJECTED',`Fact ${index+1}: ${reason}.`); continue; }
  const key=JSON.stringify([f.field,f.subject,f.value,f.source_id]);
  if (seen.has(key)) { issue('RESEARCH_FACT_DUPLICATE',`Fact ${index+1}: duplicate removed.`); continue; }
  seen.add(key);
  facts.push({fact_id:`research:1:f${facts.length+1}`, ...f});
}
if (prepared.research_page.truncated) issue('RESEARCH_TEXT_TRUNCATED','Only the submitted prefix of the Research text was available.');
const failed = parsed===null || (parsed.facts.length>0 && facts.length===0);
const research_extraction = {
  author_id:prepared.author_id,
  status:failed?'failed':issues.length?'partial':'success',
  data:failed?null:{sources:[prepared.research_page.source],facts,evidence_status:facts.length?'available':'none'},
  issues,skip_reason:null,
};
const {gemini_request, ...context}=prepared;
return [{json:{...context,research_extraction,research_call:{attempt:2,
  http_status:Number.isInteger(response?.statusCode)?response.statusCode:null,
  model_version:response?.body?.modelVersion??null,usage:response?.body?.usageMetadata??null,
}},pairedItem:{item:0}}];
