const c = $input.first().json;
const r = c.response;
const issues = [];
let data = null;
const fail = message => { throw new Error(message); };
const text = v => typeof v === 'string' && v.trim().length > 0;
const exact = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
const allFacts = [...(c.bio.data?.facts||[]), ...(c.research.data?.facts||[])];
const facts = new Map(allFacts.map(f => [f.fact_id, f]));
const bioIds = new Set((c.bio.data?.facts||[]).map(f=>f.fact_id));
try {
  if(c.synthesis_plan){data=finishStructuredSynthesis(c);issues.push(...c.synthesis_contract_issues);}else{
  if (r.error || r.statusCode !== 200) fail('HTTP request failed');
  const candidates = r.body?.candidates;
  if (candidates?.length !== 1 || candidates[0].finishReason !== 'STOP') fail('Incomplete model response');
  data = JSON.parse(candidates[0].content.parts.filter(p=>p.thought!==true && typeof p.text==='string').map(p=>p.text).join(''));
  }
  if (!exact(data,['comparisons','profile','profile_fact_ids','limitations'])) fail('Invalid synthesis fields');
  if (!Array.isArray(data.comparisons) || !Array.isArray(data.limitations) || !data.limitations.every(text)) fail('Invalid arrays');
  if (!Array.isArray(data.profile_fact_ids) || new Set(data.profile_fact_ids).size!==data.profile_fact_ids.length || !data.profile_fact_ids.every(id=>facts.has(id))) fail('Invalid profile references');
  if (data.profile===null ? data.profile_fact_ids.length!==0 : !text(data.profile) || data.profile_fact_ids.length===0) fail('Invalid profile');
  if (data.profile && /\b(?:research\.|bio\.|qualified_source_count|target_sources|profile_fact_ids|fact_ids|source_id|bio:\d|research:\d)/i.test(data.profile)) {
    issues.push({code:'SYNTHESIS_PROFILE_TECHNICAL_FIELDS',message:'Profile contains implementation fields or evidence identifiers.',source_id:null});
  }
  const accepted = [];
  for (const [index,x] of data.comparisons.entries()) {
    try {
    if (!exact(x,['scope','field','subject','conclusion','fact_ids','explanation'])) fail('Invalid comparison fields');
    if (!['site_vs_web','within_web','within_site'].includes(x.scope) || !['agreement','conflict','site_only','web_only','inconclusive'].includes(x.conclusion)) fail('Invalid comparison enum');
    if (!['birth_date','birth_place','occupation','work','affiliation'].includes(x.field) || !(x.subject===null || text(x.subject)) || !text(x.explanation)) fail('Invalid comparison content');
    if (!Array.isArray(x.fact_ids) || !x.fact_ids.length || new Set(x.fact_ids).size!==x.fact_ids.length || !x.fact_ids.every(id=>facts.has(id) && facts.get(id).field===x.field)) fail('Invalid comparison references');
    const site = x.fact_ids.filter(id=>bioIds.has(id)).length;
    const web = x.fact_ids.length-site;
    if (x.scope==='within_site' && web || x.scope==='within_web' && site) fail('Comparison scope mismatch');
    if (['site_only','web_only'].includes(x.conclusion) && x.scope!=='site_vs_web') fail('Invalid one-sided scope');
    if (x.conclusion==='site_only' && (web || !site) || x.conclusion==='web_only' && (site || !web)) fail('One-sided comparison mismatch');
    if (['agreement','conflict'].includes(x.conclusion) && (x.fact_ids.length<2 || x.scope==='site_vs_web' && (!site || !web))) fail('Insufficient comparison evidence');
    accepted.push(x);
    } catch (e) {
      issues.push({code:'SYNTHESIS_COMPARISON_REJECTED',message:`Comparison ${index+1}: ${e.message}`,source_id:null});
    }
  }
  data.comparisons = accepted;
  const covered = new Set(accepted.flatMap(x=>x.fact_ids));
  const missing = [...bioIds].filter(id=>!covered.has(id));
  if (missing.length) issues.push({code:'SYNTHESIS_COVERAGE_INCOMPLETE',message:'Site facts without an accepted comparison: '+missing.join(', '),source_id:null});
  if (issues.length) data.limitations = [...new Set([...data.limitations,'Some comparisons were rejected or missing; the comparison is incomplete.'])];
} catch (e) {
  data = null;
  issues.push({code:'SYNTHESIS_INVALID_OR_FAILED',message:String(e.message),source_id:null});
}
if(!allFacts.length){data=null;issues.length=0;}
// A structurally valid generated profile still requires human semantic review.
const synthesis = {author_id:c.author.author_id,status:!allFacts.length?'skipped':data?(issues.length?'partial':'success'):'failed',data,issues,skip_reason:!allFacts.length?'no_accepted_facts':null};
return [{json:{run_id:c.run_id,author_id:c.author.author_id,dossier:{
  author:c.author,classification:c.classification,bio:c.bio,research:c.research,synthesis,
  outcome:!allFacts.length?'failed':synthesis.status!=='success'||c.classification.status!=='success'||c.bio.status!=='success'||(c.research.status!=='skipped'&&(c.research.status!=='success'||!c.research.data?.target_met))||c.limitations.length?'degraded':'completed',limitations:[...c.limitations,...(!c.research.data?.facts.length?['Site evidence is not independently verified.']:[]),...(!c.research.data?.target_met&&c.research.status!=='skipped'?['External source target not met.']:[]),...(synthesis.data?.limitations||[])],
},control:c.control},pairedItem:{item:0}}];
