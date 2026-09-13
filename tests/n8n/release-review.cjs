const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const out=process.argv[2];if(!out||!/^artifacts\/release-\d+$/.test(out))throw new Error('Provide release artifact directory');
const b=JSON.parse(fs.readFileSync(out+'/batch-output.json')),intake=JSON.parse(fs.readFileSync(out+'/intake.json'));
assert.equal(b.summary.quote_count,intake.quotes.length);assert.equal(b.summary.author_count,intake.author_inputs.length);
assert.equal(b.summary.completed_count+b.summary.degraded_count+b.summary.failed_count,b.dossiers.length);
const review=[];
for(const d of b.dossiers){
 const input=intake.author_inputs.find(a=>a.author.author_id===d.author.author_id);assert(input);assert.deepEqual(d.author.quote_ids,input.author.quote_ids);
 const facts=[...(d.bio.data?.facts||[]),...(d.research.data?.facts||[])],ids=new Map(facts.map(f=>[f.fact_id,f]));
 const s=d.synthesis.data;
 if(s){assert(s.profile_fact_ids.every(id=>ids.has(id)));for(const x of s.comparisons)assert(x.fact_ids.every(id=>ids.get(id)?.field===x.field));}
 if(d.classification.data?.category==='unverifiable')assert.equal(d.research.status,'skipped');
 const covered=(d.bio.data?.facts||[]).filter(f=>s?.comparisons.some(x=>x.fact_ids.includes(f.fact_id))).length;
 review.push({author:d.author.name,outcome:d.outcome,category:d.classification.data?.category||null,qualifiedSources:d.research.data?.qualified_source_count||0,sourceTargetMet:d.research.data?.target_met||false,bioFacts:d.bio.data?.facts.length||0,coveredBioFacts:covered,profile:s?.profile||null,synthesisIssues:d.synthesis.issues,researchIssues:d.research.issues,limitations:d.limitations});
}
const dest='delivery/'+out.split('/').at(-1);const hashes=JSON.parse(fs.readFileSync(dest+'/checksums.json'));
for(const [name,hash]of Object.entries(hashes)){const s=fs.readFileSync(dest+'/'+name,'utf8');assert.equal(crypto.createHash('sha256').update(s).digest('hex'),hash);assert(!/[?&]token=[A-Za-z0-9]{16,}|AIza[\w-]{30,}/.test(s));const w=JSON.parse(s);assert(w.nodes.every(n=>!n.credentials));}
fs.writeFileSync(out+'/dossier-review.json',JSON.stringify(review,null,2));for(const f of ['batch-output.json','report.json'])fs.copyFileSync(out+'/'+f,dest+'/'+f);
console.log(JSON.stringify({authors:review.length,profiles:review.filter(x=>x.profile).length,fullBioCoverage:review.filter(x=>x.bioFacts>0&&x.coveredBioFacts===x.bioFacts).length,checksumAndSecretChecks:'passed',summary:b.summary}));
