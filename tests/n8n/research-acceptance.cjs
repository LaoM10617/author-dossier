const fs=require('fs'),assert=require('assert/strict');
const w=JSON.parse(fs.readFileSync('dist/child-workflow.json'));
const run=(name,c)=>new Function('$input',w.nodes.find(n=>n.name===name).parameters.jsCode)({first:()=>({json:c})})[0].json;
function base(){return {author:{author_id:'https://fixture.example/person',name:'Alex Example'},bio:{data:{facts:[]}},classification:{status:'success',data:{category:'verifiable'}},limits:{target_sources:2,max_pages:3,max_research_rounds:2,max_page_text_chars:1000,gemini_timeout_ms:1000,synthesis_reserve_ms:1000,packaging_reserve_ms:100},control:{stop_new_authors:false},deadline:Date.now()+60000,attempted:[],webpages:[],round_pages:[],webfacts:[],assessments:[],research_issues:[],limitations:[],round:1,req:{allowed:true,body:{url:'https://fixture.example/page'}}};}
let count=0;
for(const f of require('../fixtures/research-cases.json')){
 let c=base();
 if(f.kind==='page'){
  c.response={statusCode:200,headers:{'x-response-code':String(f.targetStatus)},html:'<html>fixture</html>'};c.extracted={article:[f.text]};c=run('Collect R1 Page 1',c);
  assert.equal(c.round_pages.length,f.expectedPages,f.id);assert(c.research_issues.some(i=>i.code===f.expectedIssue),f.id);assert.equal(c.source_states[0].request_status,'success');assert.equal(c.source_states[0].target_status,f.targetStatus);
 }else {
  c.round_pages=f.hosts.map((host,i)=>({source:{source_id:'s'+i,url:'https://'+host+'/person',requested_url:'https://'+host+'/person'},submitted_text:'Alex Example worked as a writer.',truncated:false}));
  const data={source_assessments:c.round_pages.map(p=>({source_id:p.source.source_id,identity_match:f.identity,usable:true,reason:'Fixed test assessment',independence:'no_obvious_overlap',related_source_ids:[]})),facts:c.round_pages.map(p=>({source_id:p.source.source_id,field:'occupation',subject:null,value:'writer',evidence_text:'worked as a writer'}))};
  c.response={statusCode:200,body:{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]}};
  c=run('Normalize Research 1',c);c=run('Assemble Author Evidence',c);
  assert.equal(c.assessments.filter(a=>a.identity_match==='match'&&a.independence==='no_obvious_overlap'&&c.webfacts.some(x=>x.source_id===a.source_id)).length,f.expectedQualified,f.id);
  assert.equal(c.research.data?.target_met||false,f.expectedQualified>=2,f.id);
  if(f.identity==='mismatch')assert.equal(c.webfacts.length,0);
 }
 count++;
}
const excerpt=new Function(fs.readFileSync('src/shared/research-page.js','utf8')+';return researchExcerpt;')();
const paragraphs=['Alex Example was born in York. '+ 'Background information. '.repeat(6),'Unrelated context. '.repeat(20),'Alex Example published The Glass Orchard in 1999. '+ 'Publication details. '.repeat(5),'Other unrelated information. '.repeat(20)];
const facts=[{fact_id:'birth',field:'birth_place',subject:null},{fact_id:'book',field:'work',subject:'Glass Orchard'},{fact_id:'missing',field:'affiliation',subject:'North University'}];
const x=excerpt({article:paragraphs},facts,400);assert(x.truncated);assert(x.text.length<=400);assert(x.text.includes('Glass Orchard'));assert(!x.text.includes('Unrelated context.'));
for(const span of x.trace.paragraphs){assert.equal(x.text.slice(span.submitted_start,span.submitted_end),paragraphs[span.paragraph_index].trim());assert.equal(span.normalized_end-span.normalized_start,span.submitted_end-span.submitted_start);}
assert.equal(x.trace.questions.find(q=>q.fact_id==='missing').status,'not_found_in_excerpt');assert.equal(x.trace.questions.find(q=>q.fact_id==='book').status,'candidate_found');
const oversized=excerpt({article:['oversized '.repeat(100)]},facts,100);assert.equal(oversized.text,'');assert(oversized.truncated);
const dup=excerpt({article:[paragraphs[0],paragraphs[0],paragraphs[2]]},facts,1000);assert.deepEqual(dup.trace.paragraphs.map(p=>p.paragraph_index),[0,2]);
console.log('PASS: '+count+' fixed research cases; long-page question selection, exact offsets, missing evidence, oversized and duplicate paragraphs.');
