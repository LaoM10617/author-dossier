// One smoke test followed by one full saved-intake batch. No automatic reruns.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
process.chdir(path.resolve(__dirname,'../..'));
const key=process.env.AUTHOR_DOSSIER_GEMINI_KEY,token=process.env.AUTHOR_DOSSIER_BROWSERLESS_TOKEN;
delete process.env.AUTHOR_DOSSIER_GEMINI_KEY;delete process.env.AUTHOR_DOSSIER_BROWSERLESS_TOKEN;
if(!key||!token)throw new Error('Both provider credentials required');
require('../../scripts/build.cjs');
const id=Date.now().toString(),out='artifacts/release-'+id;fs.mkdirSync(out,{recursive:true});console.log('RELEASE '+out);
const read=role=>JSON.parse(fs.readFileSync('dist/'+role+'-workflow.json'));
const child=read('child');child.id='releaseChild'+id;child.settings={...child.settings,callerPolicy:'any'};
function bridge(n,body){n.parameters.authentication='none';delete n.credentials;delete n.parameters.genericAuthType;delete n.parameters.nodeCredentialType;delete n.parameters.bodyParameters;n.parameters.url='http://127.0.0.1:5691/test';n.parameters.sendBody=true;n.parameters.specifyBody='json';n.parameters.jsonBody=body;}
for(const n of child.nodes)if(n.type==='n8n-nodes-base.httpRequest')bridge(n,'={{ JSON.stringify($json) }}');
const smoke=read('parent');smoke.id='releaseSmoke'+id;smoke.name='Release smoke: real intake, sampled author';
smoke.nodes.find(n=>n.name==='Call Live Author').parameters.workflowId={__rl:true,value:child.id,mode:'id'};
for(const n of smoke.nodes)if(n.type==='n8n-nodes-base.httpRequest')bridge(n,JSON.stringify({author:{name:'Intake'},req:{kind:'browserless',label:'intake',timeout:30000,body:{url:n.name==='Fetch Page 1'?'https://quotes.toscrape.com/':'https://quotes.toscrape.com/page/2/'}}}));
smoke.nodes.push({id:'smoke-sample',name:'Sample One Author',type:'n8n-nodes-base.code',typeVersion:2,position:[0,0],parameters:{mode:'runOnceForAllItems',jsCode:"const d=$input.first().json;const a=d.author_inputs.find(a=>a.author.name==='Albert Einstein')||d.author_inputs[0];if(!a)throw new Error('No intake authors');return [{json:{...d,author_inputs:[a],authors:[a.author],quotes:d.quotes.filter(q=>q.author_id===a.author.author_id),author_count:1}}];"}});
smoke.connections['Build Author Dataset']={main:[[{node:'Sample One Author',type:'main',index:0}]]};smoke.connections['Sample One Author']={main:[[{node:'Prepare Batch',type:'main',index:0}]]};
const save=(name,w)=>fs.writeFileSync(out+'/'+name+'.json',JSON.stringify(w));save('child',child);save('smoke',smoke);
const env={...process.env,N8N_USER_FOLDER:path.resolve('.runtime/data'),N8N_DIAGNOSTICS_ENABLED:'false',N8N_VERSION_NOTIFICATIONS_ENABLED:'false'};
const cli=(args,name)=>new Promise((resolve,reject)=>{const fd=fs.openSync(out+'/'+name+'.log','w');const p=spawn(process.execPath,['.runtime/node_modules/n8n/bin/n8n',...args],{env,stdio:['ignore',fd,fd],windowsHide:true});p.on('error',reject);p.on('close',code=>{fs.closeSync(fd);code===0?resolve():reject(new Error('n8n failed: '+name));});});
const parse=name=>{const s=fs.readFileSync(out+'/'+name+'.log','utf8');const x=JSON.parse(s.slice(s.search(/^\{/m)));assert.equal(x.status,'success');assert(!x.data.resultData.error);return x;};
const result=x=>{const r=x.data.resultData.runData;return (r['Finalize Batch']||r['Finalize Stopped Batch']||r['Finalize Empty Batch'])[0].data.main[0][0].json;};
const counts=new Map(),seen=new Set();let phase='smoke';
const server=http.createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',async()=>{try{
 const c=JSON.parse(raw),kind=c.req.kind,name=c.author.name,k=phase+'|'+name+'|'+kind;
 const n=(counts.get(k)||0)+1;counts.set(k,n);if(n>(kind==='gemini'?15:12)){res.writeHead(429);res.end('{}');return;}
 if(!seen.has(phase+'|'+name)){seen.add(phase+'|'+name);console.log(phase.toUpperCase()+' author: '+name);}
 const url=kind==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent':'https://production-sfo.browserless.io/content?token='+encodeURIComponent(token);
 const start=Date.now(),r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...(kind==='gemini'?{'x-goog-api-key':key}:{})},body:JSON.stringify(c.req.body),signal:AbortSignal.timeout(c.req.timeout||60000)});
 const body=await r.text(),headers={'content-type':r.headers.get('content-type')||'application/json'};for(const h of ['x-response-code','x-response-url','retry-after'])if(r.headers.has(h))headers[h]=r.headers.get(h);
 fs.appendFileSync(out+'/calls.jsonl',JSON.stringify({phase,author:name,service:kind,step:c.req.label,status:r.status,targetStatus:r.headers.get('x-response-code'),elapsedMs:Date.now()-start})+'\n');
 res.writeHead(r.status,headers);res.end(body);
 }catch{res.writeHead(502);res.end('{"error":"Provider bridge failed"}');}});});
server.listen(5691,'127.0.0.1',async()=>{try{
 await cli(['import:workflow','--input='+out+'/child.json'],'import-child');await cli(['publish:workflow','--id='+child.id],'publish-child');
 await cli(['import:workflow','--input='+out+'/smoke.json'],'import-smoke');await cli(['execute','--id='+smoke.id,'--rawOutput'],'smoke-execution');
 const sx=parse('smoke-execution'),sd=result(sx),dataset=sx.data.resultData.runData['Build Author Dataset'][0].data.main[0][0].json;
 assert(dataset.input_complete);assert.equal(dataset.pages.length,2);assert(dataset.author_inputs.length>0);assert.equal(sd.dossiers.length,1);assert.equal(sd.summary.stop_reason,null);assert(!sd.dossiers[0].limitations.some(s=>/CHILD_|MISSING_CHILD|GLOBAL_SERVICE/.test(s)));
 save('intake',dataset);save('smoke-output',sd);console.log('SMOKE PASS: '+dataset.quotes.length+' quotes, '+dataset.author_inputs.length+' unique authors; one author returned.');
 const batch=read('parent');batch.id='releaseBatch'+id;batch.name='Release full saved-intake batch';batch.nodes.find(n=>n.name==='Call Live Author').parameters.workflowId={__rl:true,value:child.id,mode:'id'};
 const keep=new Set();function visit(k){if(keep.has(k))return;keep.add(k);for(const es of batch.connections[k]?.main||[])for(const e of es)visit(e.node);}visit('Prepare Batch');batch.nodes=batch.nodes.filter(n=>keep.has(n.name));batch.connections=Object.fromEntries(Object.entries(batch.connections).filter(([k])=>keep.has(k)));
 batch.nodes.push({id:'batch-start',name:'Start Saved Intake',type:'n8n-nodes-base.manualTrigger',typeVersion:1,position:[0,0],parameters:{}},{id:'batch-load',name:'Load Saved Intake',type:'n8n-nodes-base.code',typeVersion:2,position:[200,0],parameters:{mode:'runOnceForAllItems',jsCode:'return [{json:'+JSON.stringify(dataset)+'}];'}});batch.connections['Start Saved Intake']={main:[[{node:'Load Saved Intake',type:'main',index:0}]]};batch.connections['Load Saved Intake']={main:[[{node:'Prepare Batch',type:'main',index:0}]]};save('batch',batch);
 phase='batch';await cli(['import:workflow','--input='+out+'/batch.json'],'import-batch');await cli(['execute','--id='+batch.id,'--rawOutput'],'batch-execution');
 const bx=parse('batch-execution'),b=result(bx);save('batch-output',b);
 assert.equal(b.dossiers.length,dataset.author_inputs.length);assert.equal(new Set(b.dossiers.map(d=>d.author.author_id)).size,dataset.author_inputs.length);assert.deepEqual(b.dossiers.map(d=>d.author.author_id).sort(),dataset.author_inputs.map(a=>a.author.author_id).sort());
 const report={artifactDirectory:out,scope:'Fresh two-page intake, one sampled smoke author, then one full batch reusing that intake',quoteCount:dataset.quotes.length,authorCount:b.dossiers.length,smoke:sd.summary,batch:b.summary,stages:Object.fromEntries(['classification','bio','research','synthesis'].map(k=>[k,b.dossiers.reduce((a,d)=>(a[d[k].status]=(a[d[k].status]||0)+1,a),{})])),fallbackAuthors:b.dossiers.filter(d=>d.limitations.some(s=>/CHILD_|MISSING_CHILD/.test(s))).map(d=>d.author.name),durationMs:Date.parse(bx.stoppedAt)-Date.parse(bx.startedAt)};
 save('report',report);fs.writeFileSync('docs/final-validation-results.json',JSON.stringify(report,null,2));console.log('BATCH FINISHED '+JSON.stringify(report));
 }catch(e){console.error(e.message);process.exitCode=1;}finally{server.close();}});
