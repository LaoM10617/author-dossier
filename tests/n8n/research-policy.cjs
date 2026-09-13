const fs=require('fs'),assert=require('assert/strict');
const w=JSON.parse(fs.readFileSync('dist/child-workflow.json'));
const run=(name,c)=>new Function('$input',w.nodes.find(n=>n.name===name).parameters.jsCode)({first:()=>({json:c})})[0].json;
function state(){return {author:{author_id:'https://example.org/a',name:'Test'},classification:{status:'success',data:{category:'verifiable'}},limits:{target_sources:2,max_pages:3,max_research_rounds:2,request_timeout_ms:1000,gemini_timeout_ms:1000,synthesis_reserve_ms:1000,packaging_reserve_ms:100,max_searches:2},deadline:Date.now()+60000,control:{stop_new_authors:false},queue:['https://one.example/a','https://two.example/a'],attempted:[],round_pages:[],webpages:[],webfacts:[],assessments:[],research_issues:[],limitations:[],round:1,searches:1};}
let c=state();c.deadline=0;c=run('Prepare R2 Page 1',c);assert(!c.req.allowed);assert.equal(c.attempted.length,0);assert.equal(c.queue.length,2);
c=state();c.attempted=Array(3).fill('used');c=run('Prepare R2 Page 1',c);assert(!c.req.allowed);
c=state();c.control.stop_new_authors=true;c=run('Prepare R2 Page 1',c);assert(!c.req.allowed);assert.equal(c.attempted.length,0);
c=state();c=run('Prepare Search 2',c);assert(c.req.allowed);assert.equal(c.searches,2);assert.equal(c.queue.length,2);
c=state();c=run('Prepare R2 Page 1',c);assert(c.req.allowed);assert.equal(c.attempted.length,1);assert.equal(c.queue.length,1);
for(let i=1;i<=2;i++){c.webpages.push({source:{source_id:'s'+i,requested_url:'https://s'+i+'.example/'},truncated:false});c.webfacts.push({source_id:'s'+i});c.assessments.push({source_id:'s'+i,usable:true,identity_match:'match',independence:'no_obvious_overlap'});}
c.research_issues=[{code:'SOURCE_ACCESS_DENIED',message:'historical 403',source_id:null}];c=run('Assemble Author Evidence',c);assert.equal(c.research.status,'success');assert.equal(c.research.issues.length,1);assert.equal(c.source_states.length,2);
c.research_issues.push({code:'TEXT_TRUNCATED',message:'partial evidence',source_id:'s1'});c=run('Assemble Author Evidence',c);assert.equal(c.research.status,'partial');
c.assessments[1].independence='uncertain';c=run('Assemble Author Evidence',c);assert.equal(c.research.data.target_met,false);assert.equal(c.research.status,'partial');
c=state();c=run('Assemble Author Evidence',c);assert.equal(c.research.status,'failed');assert(c.research.issues.length);
console.log('PASS: admission budgets, cached candidates, historical failure recovery, active truncation, uncertainty and empty evidence.');
