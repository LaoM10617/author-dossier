// Pure synthetic responses; no real people, company data or upstream requests.
const modeOf=c=>c.author.name.split(' ').at(-1);
const text=c=>`${c.author.name} worked as a writer. This is an explicitly synthetic biography created for local integration testing. The page has sufficient text to exercise the real HTML extraction and validation nodes without any network source.`;
function reply(c){const mode=modeOf(c),label=c.req.label;const fact=id=>({field:'occupation',subject:null,value:'writer',source_id:id,evidence_text:'worked as a writer'});
 if(c.req.kind==='browserless'){
  if(mode==='refill'&&label==='research_page'&&c.attempted.length<=2)return {status:200,headers:{'content-type':'text/html','x-response-code':'403','x-response-url':c.req.body.url},body:'<title>Access denied</title>'};
  if(label==='intake') {const modes=c.req.body.url.includes('/page/2/')?['normal','after']:['normal','unverifiable'];const html=modes.map((m,i)=>'<div class="quote"><span class="text">Synthetic quote '+i+' '+m+'</span><small class="author">Fixture '+m+'</small><a href="/author/Fixture-'+m+'/">about</a><div class="tags"><a class="tag">test</a></div></div>').join('');return {status:200,headers:{'content-type':'text/html','x-response-code':'200','x-response-url':c.req.body.url},body:html};}

  let html;if(label==='bio_page')html=`<div class="author-details"><h3 class="author-title">${c.author.name}</h3><p>${text(c)}</p></div>`;
  else if(label.startsWith('search'))html='<ol id="b_results">'+(mode==='refill'?[1,2,3,4]:[1,2]).map(i=>`<li class="b_algo"><h2><a href="https://source${i}.example/${mode}">${c.author.name} biography</a></h2></li>`).join('')+'</ol>';
  else html=`<html><title>${c.author.name}</title><article><p>${text(c)}</p></article></html>`;
  return {status:200,headers:{'content-type':'text/html','x-response-code':'200','x-response-url':c.req.body.url},body:html};
 }
 if(mode==='blocked'&&label==='classification')return {status:401,body:{error:'synthetic authentication failure'}};
 if(mode==='synthesisfail'&&label==='synthesis')return {status:500,body:{error:'synthetic transient failure'}};
 let data;
 if(label==='classification')data=mode==='classfail'?{invalid:true}:{category:mode==='unverifiable'?'unverifiable':'verifiable',reason:'Synthetic classification for routing test.'};
 else if(label==='bio')data={facts:mode==='empty'?[]:[fact('bio:1')]};
 else if(label.startsWith('research'))data={source_assessments:c.round_pages.map(p=>({source_id:p.source.source_id,identity_match:'match',usable:true,reason:'Synthetic source fixture.',independence:'no_obvious_overlap',related_source_ids:[]})),facts:mode==='empty'?[]:c.round_pages.map(p=>{const f=fact(p.source.source_id);if(p.paragraphs){delete f.evidence_text;f.paragraph_id=p.paragraphs[0].paragraph_id;}return f;})};
 else {const bio=c.bio.data?.facts||[],web=c.research.data?.facts||[];data={comparisons:[{scope:'site_vs_web',field:'occupation',subject:null,conclusion:web.length?'agreement':'site_only',fact_ids:[...bio,...web].map(f=>f.fact_id),explanation:'Synthetic fixture comparison.'}],profile:`${c.author.name} worked as a writer. This is a synthetic test profile${web.length?'.':', not independently verified.'}`,profile_fact_ids:[...bio,...web].map(f=>f.fact_id),limitations:['Synthetic test data.']};}
 if(label==='synthesis'&&c.synthesis_plan){const payload=JSON.parse(c.req.body.contents[0].parts[0].text);data={comparisons:payload.tasks.map(t=>({task_id:t.id,conclusion:t.allowed.length>1?'agreement':t.side==='site'?'site_only':'web_only',fact_ids:t.allowed.map(f=>f.fact_id),explanation:'Synthetic comparison judgment.'})),profile:payload.profile_needed?data.profile:null,profile_fact_ids:payload.profile_needed?data.profile_fact_ids:[]};}
 return {status:200,body:{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]}};
}
module.exports={reply};
