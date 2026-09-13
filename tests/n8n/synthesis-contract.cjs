const fs=require('fs'),assert=require('assert/strict');
const lib=new Function(fs.readFileSync('src/shared/synthesis-contract.js','utf8')+';return {synthesisPlan,validateSynthesis,finishStructuredSynthesis,repairStructuredSynthesis};');
// Stub only the existing request-envelope helpers; real validation functions are shared.
const api=new Function('modelBody','output',fs.readFileSync('src/shared/synthesis-contract.js','utf8')+';return {synthesisPlan,validateSynthesis,finishStructuredSynthesis,repairStructuredSynthesis};')((i,p,s)=>({payload:p,schema:s}),c=>c);
const fact=(id,field)=>({fact_id:id,field,subject:null,value:'test',evidence_text:'test'});
const c={bio:{data:{facts:[fact('b1','occupation'),fact('b2','birth_date')]}},research:{status:'success',data:{facts:[fact('w1','occupation'),fact('w2','birth_date')],target_met:true}},limitations:[],author:{name:'Fixture'},limits:{gemini_repair_calls:1,max_gemini_requests_per_step:3,max_model_input_chars:60000},control:{stop_new_authors:false},deadline:Date.now()+60000,calls:[{step:'synthesis'}],req:{allowed:true,timeout:1000,reserve:1000}};
c.synthesis_plan=api.synthesisPlan(c);
assert.deepEqual(c.synthesis_plan[1].allowed.map(f=>f.fact_id),['b2','w2']);
const first={comparisons:[{task_id:'b1',conclusion:'agreement',fact_ids:['b1','w1'],explanation:'accepted'}],profile:'A supported profile.',profile_fact_ids:['b1']};
const response=d=>({statusCode:200,body:{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(d)}]}}]}});
c.response=response(first);api.repairStructuredSynthesis(c);assert(c.repair);assert.deepEqual(c.req.body.payload.tasks.map(t=>t.id),['b2']);assert.equal(c.req.body.payload.profile_needed,false);
c.response=response({comparisons:[{task_id:'b2',conclusion:'site_only',fact_ids:['b2'],explanation:'no counterpart'},{task_id:'b1',conclusion:'conflict',fact_ids:['b1','w1'],explanation:'attempt to overwrite'}],profile:'Changed profile',profile_fact_ids:['w1']});
let d=api.finishStructuredSynthesis(c);assert.equal(d.comparisons[0].explanation,'accepted');assert.equal(d.profile,first.profile);assert.equal(c.synthesis_contract_issues.length,0);
c.response={statusCode:500};d=api.finishStructuredSynthesis(c);assert.equal(d.comparisons[0].explanation,'accepted');assert.equal(d.comparisons[1].conclusion,'inconclusive');assert(c.synthesis_contract_issues.some(x=>x.code==='SYNTHESIS_TASK_UNRESOLVED'));
const bad={...first,comparisons:[{task_id:'b2',conclusion:'agreement',fact_ids:['b2','w1'],explanation:'wrong field'}],profile:'research.qualified_source_count is 2'};
assert(api.validateSynthesis(c,bad,c.synthesis_plan).errors.length);assert.equal(api.validateSynthesis(c,bad,c.synthesis_plan).profile,null);
const dup={...first,comparisons:[first.comparisons[0],first.comparisons[0]]};assert(api.validateSynthesis(c,dup,c.synthesis_plan).errors.some(x=>x.task_id==='b1'));
c.calls=[{step:'synthesis'},{step:'synthesis'},{step:'synthesis'}];c.response=response(bad);api.repairStructuredSynthesis(c);assert.equal(c.repair,false);
console.log('PASS: task coverage, allowed IDs, surgical repair, immutable successes, failed repair fallback, duplicate rejection and request cap.');
