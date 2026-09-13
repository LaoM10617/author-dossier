const fs=require('fs'),assert=require('assert/strict');
const w=JSON.parse(fs.readFileSync('dist/child-workflow.json'));
const source=w.nodes.find(n=>n.name==='Normalize Research 1').parameters.jsCode;
const api=new Function(source.slice(0,source.lastIndexOf('const c=$input.first().json;'))+';return {resolveResearchFacts};')();
const p={source:{source_id:'s1'},submitted_text:'She worked as a writer.',paragraphs:[{paragraph_id:'s1:p1',text:'She worked as a writer.'}]};
const f={source_id:'s1',paragraph_id:'s1:p1',field:'occupation',subject:null,value:'writer'};
let r=api.resolveResearchFacts({},[f],[p]);assert.equal(r.facts[0].evidence_text,p.submitted_text);assert(!Object.hasOwn(r.facts[0],'paragraph_id'));
for(const invalid of [{...f,paragraph_id:'s2:p1'},{...f,paragraph_id:'missing'},{...f,evidence_text:'Invented quotation'}]){r=api.resolveResearchFacts({},[invalid],[p]);assert.equal(r.facts.length,0);assert.equal(r.issues.length,1);}
const synthesis=new Function(fs.readFileSync('src/shared/synthesis-contract.js','utf8')+';return {synthesisPlan,validateSynthesis};')();
const c={bio:{data:{facts:[]}},research:{data:{facts:[{fact_id:'w1',source_id:'s1',field:'occupation'}],source_assessments:[{source_id:'s1',identity_match:'match',usable:true,independence:'uncertain'}]}}};
assert.equal(synthesis.synthesisPlan(c).length,0);assert.equal(synthesis.validateSynthesis(c,{comparisons:[],profile:'Claim',profile_fact_ids:['w1']},[]).profile,null);assert.equal(c.research.data.facts.length,1);
console.log('PASS: paragraph reconstruction, unknown/cross-source rejection, no injected quotations, uncertain evidence retained but excluded from profile.');
