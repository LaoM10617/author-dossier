// Pure helpers embedded into generated Code nodes. No filesystem, secrets or network.
const clone = x => JSON.parse(JSON.stringify(x));
const clean = x => typeof x==='string'?x.replace(/\s+/g,' ').trim():'';
const issue = (code,message,source_id=null) => ({code,message,source_id});
const stage = (c,status,data=null,issues=[],skip_reason=null) => ({author_id:c.author.author_id,status,data,issues,skip_reason});
const emptyControl = () => ({stop_new_authors:false,service:null,scope:null,code:null,reason:null});
const output = c => [{json:c,pairedItem:{item:0}}];
function request(c,kind,label,body,enabled=true) {
 const timeout=kind==='gemini'?c.limits.gemini_timeout_ms:c.limits.request_timeout_ms;
 const reserve=c.limits.packaging_reserve_ms+(label==='synthesis'?0:c.limits.synthesis_reserve_ms);
 c.req={kind,label,body,timeout,reserve,attempt:1,allowed:enabled&&!c.control.stop_new_authors&&Date.now()+timeout+reserve<=c.deadline,started_at:Date.now()};
 if(enabled&&!c.req.allowed)c.limitations.push(c.control.stop_new_authors?'Shared service blocked further requests.':'Time budget prevented '+label+'.');
 c.response=null;return c;
}
function capture(c,r) {
 c.response=r;
 const code=r.statusCode??null;
 c.calls.push({step:c.req.label,service:c.req.kind,attempt:c.req.attempt,started_at:new Date(c.req.started_at).toISOString(),elapsed_ms:Date.now()-c.req.started_at,http_status:code,usage:r.body?.usageMetadata??null});
 // Target 403 is not Browserless authentication failure: only outer auth status qualifies.
 if([401,403].includes(code)){
  c.control={stop_new_authors:true,service:c.req.kind==='gemini'?'gemini':'browserless',scope:'batch',code:'SHARED_AUTH_DENIED',reason:'Provider returned HTTP '+code+' at '+c.req.label};
 }
 return c;
}
function retryPlan(c) {
 const code=c.response?.statusCode;const temp=c.response?.error||[408,429,500,502,503,504].includes(code);
 const retryAfter=c.response?.headers?.['retry-after'];
 let wait=c.limits.retry_wait_ms;
 if(retryAfter!==undefined){const secs=Number(retryAfter);const parsed=Number.isFinite(secs)?secs*1000:Date.parse(retryAfter)-Date.now();if(Number.isFinite(parsed))wait=Math.max(wait,parsed);}
 const retries=c.req.kind==='gemini'?c.limits.gemini_transport_retries:c.limits.request_retries;
 c.retry=!!(c.req.allowed&&temp&&retries>0&&!c.control.stop_new_authors&&Date.now()+wait+c.req.timeout+c.req.reserve<=c.deadline&&(c.req.kind!=='gemini'||c.limits.max_gemini_requests_per_step>=2));
 c.wait_seconds=wait/1000;if(c.retry){c.req.attempt=2;c.req.started_at=Date.now()+wait;}return c;
}
function parsedModel(c) {
 const r=c.response;if(r?.statusCode!==200||r.error)return null;
 const a=r.body?.candidates;if(a?.length!==1||a[0].finishReason!=='STOP')return null;
 try{return JSON.parse(a[0].content.parts.filter(p=>p.thought!==true&&typeof p.text==='string').map(p=>p.text).join(''));}catch{return null;}
}
function modelBody(instruction,payload,schema,tokens=4096) {
 return {systemInstruction:{parts:[{text:instruction}]},contents:[{role:'user',parts:[{text:JSON.stringify(payload)}]}],generationConfig:{temperature:0,maxOutputTokens:tokens,responseMimeType:'application/json',responseJsonSchema:schema}};
}
function modelRequest(c,label,instruction,payload,schema,enabled=true,tokens=4096) {
 const body=modelBody(instruction,payload,schema,tokens);
 if(instruction.length+body.contents[0].parts[0].text.length>c.limits.max_model_input_chars){c.limitations.push(label+' input exceeded character budget.');enabled=false;}
 return request(c,'gemini',label,body,enabled);
}
function validPage(c) {
 const r=c.response;
 return r?.statusCode===200&&Number(r.headers?.['x-response-code'])===200&&typeof r.html==='string'&&r.html.trim().length>0;
}
function pageSource(c,id,title) {
 return {source_id:id,url:c.response.headers['x-response-url']||c.req.body.url,requested_url:c.req.body.url,title:clean(title)||c.author.name,retrieved_at:new Date().toISOString()};
}
function acceptedFacts(c,raw,pages) {
 const facts=[],issues=[],seen=new Set();
 for(const [i,f] of (Array.isArray(raw)?raw:[]).entries()){
  const p=pages.find(p=>p.source.source_id===f?.source_id);let bad='';
  if(!f||typeof f!=='object'||Array.isArray(f)||Object.keys(f).sort().join(',')!=='evidence_text,field,source_id,subject,value')bad='invalid fields';
  else if(!['birth_date','birth_place','occupation','work','affiliation'].includes(f.field)||!clean(f.value)||!clean(f.evidence_text))bad='invalid value';
  else if(['work','affiliation'].includes(f.field)?!clean(f.subject):f.subject!==null)bad='invalid subject';
  else if(!p||!p.submitted_text.includes(f.evidence_text))bad='evidence not in submitted source';
  else if(f.field==='work'&&['paper','theory','work',c.author.name.toLowerCase()].includes(f.subject.toLowerCase().trim()))bad='generic work subject';
  else if(f.field==='birth_date'&&(!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(f.value)||f.value.length>=7&&(+f.value.slice(5,7)<1||+f.value.slice(5,7)>12)||f.value.length===10&&(isNaN(Date.parse(f.value))||new Date(f.value).toISOString().slice(0,10)!==f.value)))bad='invalid date';
  const key=JSON.stringify([f?.field,f?.subject,f?.value,f?.source_id]);
  if(seen.has(key))bad='duplicate';
  if(bad){issues.push(issue('FACT_REJECTED','Fact '+(i+1)+': '+bad,f?.source_id||null));continue;}
  seen.add(key);facts.push({...f,fact_id:f.source_id+':f'+(facts.filter(x=>x.source_id===f.source_id).length+1)});
 }
 return {facts,issues};
}
function classify(c) {
 const d=parsedModel(c);c.classification=d&&Object.keys(d).sort().join(',')==='category,reason'&&['verifiable','unverifiable'].includes(d.category)&&clean(d.reason)?stage(c,'success',d):stage(c,'failed',null,[issue('CLASSIFICATION_FAILED','No valid classification was returned.')]);return c;
}
function bioResult(c) {
 if(!c.bio_page){c.bio=stage(c,'failed',null,[issue('BIO_PAGE_UNAVAILABLE','No usable author biography page.')]);return c;}
 const d=parsedModel(c);const valid=d&&Object.keys(d).join(',')==='facts'&&Array.isArray(d.facts);
 if(!valid){c.bio=stage(c,'failed',null,[issue('BIO_MODEL_FAILED','No valid Bio facts array.')]);return c;}
 const a=acceptedFacts(c,d.facts,[c.bio_page]);if(c.bio_page.truncated)a.issues.push(issue('TEXT_TRUNCATED','Bio text truncated.','bio:1'));
 const failed=d.facts.length>0&&!a.facts.length;
 c.bio=stage(c,failed?'failed':a.issues.length?'partial':'success',failed?null:{sources:[c.bio_page.source],facts:a.facts,evidence_status:a.facts.length?'available':'none'},a.issues);return c;
}
function researchEnabled(c){return c.classification.status==='success'&&c.classification.data.category==='verifiable';}
function qualified(c){return c.assessments.filter(a=>a.usable&&a.identity_match==='match'&&a.independence==='no_obvious_overlap'&&c.webfacts.some(f=>f.source_id===a.source_id)).length;}
function researchResult(c) { return finalizeResearch(c); }

const c=clone($('Prepare Research Round 2').first().json);return output(capture(c,$input.first().json));