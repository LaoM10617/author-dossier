// Real Gemini through a loopback bridge; page responses remain synthetic.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),{spawn}=require('node:child_process');
const {reply}=require('./responses.cjs');
process.chdir(path.resolve(__dirname,'../..'));
const key=process.env.AUTHOR_DOSSIER_GEMINI_KEY;delete process.env.AUTHOR_DOSSIER_GEMINI_KEY;
const browserKey=process.env.AUTHOR_DOSSIER_BROWSERLESS_TOKEN;delete process.env.AUTHOR_DOSSIER_BROWSERLESS_TOKEN;
const synthesisOnly=process.argv.includes('--synthesis-only');
const supplementSynthesis=synthesisOnly&&process.env.AUTHOR_DOSSIER_SYNTHESIS_SUPPLEMENT==='1';
const contractCheck=synthesisOnly&&process.env.AUTHOR_DOSSIER_CONTRACT_CHECK==='1';
const checkpoint=process.env.AUTHOR_DOSSIER_FULL_CHECK==='1';
const out=checkpoint?'artifacts/live-acceptance-'+Date.now():contractCheck?'artifacts/structured-synthesis':supplementSynthesis?'artifacts/supplement-synthesis':synthesisOnly?'artifacts/synthesis-replay':browserKey?'artifacts/live-web':'artifacts/live';
if(checkpoint&&!browserKey)throw new Error('Full checkpoint requires real Browserless');
if(checkpoint)console.log('CHECKPOINT '+out);
if(!key)throw new Error('Launch through scripts/local/test-gemini.ps1');
require('../../scripts/build.cjs');
const w=JSON.parse(fs.readFileSync('dist/child-workflow.json'));
const parent=JSON.parse(fs.readFileSync('dist/parent-workflow.json'));
const config=JSON.parse(parent.nodes.find(n=>n.name==='Run Config1').parameters.jsonOutput);
const input={run_id:'local-live-gemini',author:{author_id:'https://quotes.toscrape.com/author/Albert-Einstein/',bio_url:'https://quotes.toscrape.com/author/Albert-Einstein/',name:'Albert Einstein',quote_ids:[]},limits:config.limits,identity_quotes:[]};
const trigger=w.nodes.find(n=>n.type==='n8n-nodes-base.executeWorkflowTrigger');
trigger.type='n8n-nodes-base.code';trigger.typeVersion=2;trigger.parameters={mode:'runOnceForAllItems',jsCode:'return [{json:'+JSON.stringify(input)+'}];'};
w.nodes.push({id:'live-start',name:'Start Live Test',type:'n8n-nodes-base.manualTrigger',typeVersion:1,position:[-300,0],parameters:{}});
w.connections['Start Live Test']={main:[[{node:trigger.name,type:'main',index:0}]]};
if(synthesisOnly){
 const raw=fs.readFileSync('artifacts/live-web/execution.log','utf8');const saved=supplementSynthesis?JSON.parse(fs.readFileSync('artifacts/research-supplement/state.json')):JSON.parse(raw.slice(raw.search(/^\{/m))).data.resultData.runData['Assemble Author Evidence'].at(-1).data.main[0][0].json;
 // The replay has a fresh synthesis-only time budget; evidence is unchanged.
 saved.deadline=Date.now()+saved.limits.gemini_timeout_ms+saved.limits.packaging_reserve_ms+60000;
 saved.calls=[];
 trigger.parameters.jsCode='return [{json:'+JSON.stringify(saved)+'}];';
 w.connections[trigger.name]={main:[[{node:'Prepare Synthesis Request',type:'main',index:0}]]};
 const seen=new Set();function visit(k){if(seen.has(k))return;seen.add(k);for(const a of w.connections[k]?.main||[])for(const e of a)visit(e.node);}visit('Start Live Test');
 w.nodes=w.nodes.filter(n=>seen.has(n.name));w.connections=Object.fromEntries(Object.entries(w.connections).filter(([k])=>seen.has(k)));
}
w.id='localLiveGemini';w.name='LOCAL - Real Gemini with synthetic pages';w.active=false;
for(const n of w.nodes)if(n.type==='n8n-nodes-base.httpRequest'){
 n.parameters.authentication='none';delete n.credentials;delete n.parameters.genericAuthType;delete n.parameters.nodeCredentialType;delete n.parameters.bodyParameters;
 n.parameters.url='http://127.0.0.1:5690/test';n.parameters.sendBody=true;n.parameters.specifyBody='json';n.parameters.jsonBody='={{ JSON.stringify($json) }}';
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/workflow.json',JSON.stringify(w));
const calls=[];let count=0,webCount=0;
const server=http.createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',async()=>{
 try{const c=JSON.parse(raw);if(c.req.kind!=='gemini'){
 if(!browserKey){const r=reply(c);res.writeHead(r.status,r.headers);res.end(r.body);return;}
 if(++webCount>12){res.writeHead(429);res.end('{}');return;}
 const r=await fetch('https://production-sfo.browserless.io/content?token='+encodeURIComponent(browserKey),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c.req.body),signal:AbortSignal.timeout(c.req.timeout||30000)});
 const html=await r.text();calls.push({step:c.req.label,status:r.status,bytes:Buffer.byteLength(html)});console.log('Browserless '+c.req.label+': '+r.status);
 const h={'content-type':r.headers.get('content-type')||'text/html'};for(const k of ['x-response-code','x-response-url'])if(r.headers.has(k))h[k]=r.headers.get(k);
 res.writeHead(r.status,h);res.end(html);return;}
 if(synthesisOnly&&c.req.label!=='synthesis')throw new Error('Unexpected non-synthesis request');
 if(++count>(contractCheck?2:synthesisOnly?1:10)){res.writeHead(429);res.end('{}');return;}
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(c.req.body),signal:AbortSignal.timeout(60000)});
 calls.push({step:c.req.label,status:r.status});console.log('Gemini '+c.req.label+': '+r.status);res.writeHead(r.status,{'content-type':'application/json'});res.end(await r.text());
 }catch{res.writeHead(502);res.end('{"error":"Local bridge request failed"}');}
});});
const env={...process.env,N8N_USER_FOLDER:path.resolve('.runtime/data'),N8N_DIAGNOSTICS_ENABLED:'false',N8N_VERSION_NOTIFICATIONS_ENABLED:'false'};
function cli(args,name){return new Promise((resolve,reject)=>{const fd=fs.openSync(out+'/'+name+'.log','w');const p=spawn(process.execPath,['.runtime/node_modules/n8n/bin/n8n',...args],{env,stdio:['ignore',fd,fd],windowsHide:true});p.on('error',reject);p.on('close',code=>{fs.closeSync(fd);code===0?resolve():reject(new Error('n8n failed: '+name));});});}
server.listen(5690,'127.0.0.1',async()=>{try{
 await cli(['import:workflow','--input='+out+'/workflow.json'],'import');
 await cli(['execute','--id=localLiveGemini','--rawOutput'],'execution');
 const raw=fs.readFileSync(out+'/execution.log','utf8');const x=JSON.parse(raw.slice(raw.search(/^\{/m)));
 if(x.data.resultData.error)throw new Error('Workflow execution failed');
 const runs=x.data.resultData.runData;const last=x.data.resultData.lastNodeExecuted;const output=runs[last].at(-1).data.main[0][0].json;
 fs.writeFileSync(out+'/output.json',JSON.stringify(output,null,2));
 const d=output.dossier;
 if(!d||output.author_id!==input.author.author_id||!d.synthesis.data)throw new Error('Missing or mismatched author envelope/synthesis');
 if(synthesisOnly){const prior=supplementSynthesis?JSON.parse(fs.readFileSync('artifacts/research-supplement/state.json')):JSON.parse(fs.readFileSync('artifacts/live-web/output.json')).dossier;for(const k of ['classification','bio','research'])if(JSON.stringify(d[k])!==JSON.stringify(prior[k]))throw new Error('Replay changed '+k);}
 const report={scope:synthesisOnly?'Synthesis-only real n8n replay of saved real webpage evidence':browserKey?'Real local n8n, Browserless and Gemini; one author':'Real local n8n and Gemini; synthetic Browserless pages, not real research validation',modelAlias:'gemini-flash-lite-latest',lastNode:last,calls,outcome:d.outcome,stages:Object.fromEntries(['classification','bio','research','synthesis'].map(k=>[k,d[k]?.status]))};
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }catch(e){console.error(e.message);process.exitCode=1;}finally{server.close();}});
