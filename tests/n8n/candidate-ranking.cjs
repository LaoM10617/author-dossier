const fs=require('fs'),assert=require('assert/strict');
const code=fs.readFileSync('src/child/select-candidates-1.js','utf8');
const execute=c=>new Function('$input',code)({first:()=>({json:c})})[0].json;
const input=()=>({author:{name:'Albert Einstein'},queue:[],attempted:[],limits:{candidates_per_search:2,max_pages:3},req:{allowed:true},research_issues:[],extracted:{links:['https://blog.example/einstein/','https://www.nobelprize.org/prizes/einstein/','https://fake.edu/other/','https://www.nobelprize.org/other/einstein/'],titles:['Albert Einstein biography','Albert Einstein biography','Jane Austen biography','Albert Einstein biography']}});
const c=input(),r=execute(c);assert.equal(r.queue.length,2);assert(r.queue[0].includes('nobelprize.org'));assert(!r.queue.some(u=>u.includes('fake.edu')));assert.equal(r.limits.max_pages,3);
const denied=input();denied.attempted=['https://www.nobelprize.org/prior'];assert(!execute(denied).queue.some(u=>u.includes('nobelprize.org')));
const late=input();late.extracted={links:['https://a.example/einstein/','https://b.example/einstein/','https://c.example/einstein/','https://www.nobelprize.org/einstein/'],titles:Array(4).fill('Albert Einstein biography')};assert(execute(late).queue[0].includes('nobelprize.org'));
const fallback=input();fallback.queue=['https://existing.example/einstein/'];fallback.extracted={links:[],titles:[]};assert.deepEqual(execute(fallback).queue,['https://existing.example/einstein/']);
assert.equal(fs.readFileSync('src/child/select-candidates-2.js','utf8'),code);
const log='artifacts/live-web/execution.log';if(fs.existsSync(log)){const s=fs.readFileSync(log,'utf8'),runs=JSON.parse(s.slice(s.search(/^\{/m))).data.resultData.runData;for(const name of ['Search 1 Parsed','Search 2 Parsed']){const c=structuredClone(runs[name][0].data.main[0][0].json);console.log(name,JSON.stringify(execute(c).queue));}}
console.log('Ranking checks passed: identity gate, domain diversity, attempted hosts and budgets retained.');
