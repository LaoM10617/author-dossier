const fs=require('node:fs'),assert=require('node:assert/strict');
require('../../scripts/build.cjs');
const paragraphCheck=process.env.AUTHOR_DOSSIER_PARAGRAPH_CHECK==='1';
const out=paragraphCheck?'artifacts/paragraph-validation-'+Date.now():'artifacts/research-replay';
console.log('OUTPUT '+out);
const w=JSON.parse(fs.readFileSync('dist/child-workflow.json'));
function run(name,c){return new Function('$input',w.nodes.find(n=>n.name===name).parameters.jsCode)({first:()=>({json:c})})[0].json;}
const raw=fs.readFileSync('artifacts/live-web/execution.log','utf8');
const runs=JSON.parse(raw.slice(raw.search(/^\{/m))).data.resultData.runData;
const saved=name=>structuredClone(runs[name].at(-1).data.main[0][0].json);
let c=saved('R1 Page 1 Parsed');c.round_pages=[];c.webpages=[];c.webfacts=[];c.assessments=[];c.research_issues=[];
for(const name of ['R1 Page 1 Parsed','R1 Page 2 Parsed','R2 Page 1 Parsed']){
 const p=saved(name);Object.assign(c,{response:p.response,req:p.req,extracted:p.extracted});c=run('Collect R1 Page 1',c);
}
assert.equal(c.round_pages.length,2);assert(c.research_issues.some(x=>x.code==='SOURCE_ACCESS_DENIED'));
assert(c.round_pages.every(p=>p.submitted_text.length<=c.limits.max_page_text_chars));
assert(!/\[https?:\/\//.test(c.round_pages[0].submitted_text));
assert(/photoelectric/i.test(c.round_pages[0].submitted_text));
// Small article markup must fall back to a usable main, and paragraphs are never split.
const helper=fs.readFileSync('src/shared/research-page.js','utf8');
const excerpt=new Function(helper+';return researchExcerpt;')();
const paragraph='A substantive biographical paragraph with enough content. '.repeat(4);
assert.equal(excerpt({article:['Menu'],main:[paragraph]},[],1000).text,paragraph.trim());
assert.equal(excerpt({article:[paragraph]},[],100).text,'');
fs.mkdirSync(out,{recursive:true});
console.log('Saved-page regression checks passed; no webpage requests.');
if(!process.argv.includes('--live'))process.exit(0);
const key=process.env.AUTHOR_DOSSIER_GEMINI_KEY;delete process.env.AUTHOR_DOSSIER_GEMINI_KEY;
if(!key)throw new Error('Missing personal Gemini key');
c.deadline=Date.now()+180000;c.calls=[];c=run('Prepare Research Round 1',c);assert(c.req.allowed);
(async()=>{
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(c.req.body),signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw new Error('Gemini HTTP '+r.status);
 c.response={statusCode:r.status,body:await r.json()};c=run('Normalize Research 1',c);c=run('Assemble Author Evidence',c);
 fs.writeFileSync(out+'/state.json',JSON.stringify(c,null,2));
 const report={scope:'Saved real pages combined into one research replay; current generated Code nodes executed locally; one real Gemini research request, no new crawling or synthesis',status:c.research.status,targetMet:!!c.research.data?.target_met,qualifiedSources:c.research.data?.qualified_source_count,facts:c.research.data?.facts.length,issues:c.research.issues,assessments:c.assessments,excerptLengths:c.webpages.map(p=>({source:p.source.url,chars:p.submitted_text.length,partial:p.truncated}))};
 fs.writeFileSync(paragraphCheck?'docs/paragraph-validation-results.json':'docs/research-replay-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!paragraphCheck)assert(c.research.data?.target_met,'Research did not meet source target');
 else { assert(c.research.data?.facts.length,'No accepted facts');const d=JSON.parse(c.response.body.candidates[0].content.parts.filter(p=>!p.thought).map(p=>p.text).join(''));assert(d.facts.every(f=>f.paragraph_id&&!Object.hasOwn(f,'evidence_text')));console.log('Paragraph response contract passed; evidence quality remains separately reported.'); }
})().catch(()=>{console.error('Research replay failed; inspect local evidence or provider availability.');process.exitCode=1;});
