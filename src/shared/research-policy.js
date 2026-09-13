function prepareResearchPage(c,round) {
 const enabled=researchEnabled(c)&&c.limits.max_research_rounds>=round&&qualified(c)<c.limits.target_sources&&c.round_pages.length<Math.max(1,c.limits.target_sources-qualified(c))&&c.attempted.length<c.limits.max_pages;
 while(c.queue.length&&c.attempted.includes(c.queue[0]))c.queue.shift();
 const url=enabled?c.queue[0]||'':'';
 request(c,'browserless','research_page',{url},!!url);
 if(c.req.allowed){c.queue.shift();c.attempted.push(url);}
 return output(c);
}
function finalizeResearch(c) {
 if(!researchEnabled(c)){c.research=stage(c,'skipped',null,[],c.classification.status==='success'?'category_unverifiable':'classification_failed');return c;}
 const accepted=new Set(c.assessments.filter(a=>a.usable&&a.identity_match==='match'&&a.independence==='no_obvious_overlap'&&c.webfacts.some(f=>f.source_id===a.source_id)).map(a=>a.source_id));
 const met=accepted.size>=c.limits.target_sources;
 const stop=met?'target_met':c.control.stop_new_authors?'service_blocked':Date.now()+c.limits.gemini_timeout_ms+c.limits.synthesis_reserve_ms+c.limits.packaging_reserve_ms>c.deadline?'time_budget_exhausted':c.attempted.length>=c.limits.max_pages?'page_budget_exhausted':c.round>=c.limits.max_research_rounds?'round_limit_reached':'candidates_exhausted';
 const historical=new Set(['SOURCE_ACCESS_DENIED','SOURCE_UNAVAILABLE','NO_RELEVANT_CANDIDATES','RESEARCH_MODEL_FAILED','RESEARCH_TARGET_UNMET']);
 const active=c.research_issues.filter(i=>!historical.has(i.code)&&(!i.source_id||accepted.has(i.source_id)));
 if(!met&&!c.research_issues.some(i=>i.code==='RESEARCH_TARGET_UNMET'))c.research_issues.push(issue('RESEARCH_TARGET_UNMET','Qualified source target not met: '+accepted.size+'/'+c.limits.target_sources+'.'));
 // Runtime diagnostics are separate from the stable public dossier schema.
 c.source_states=c.source_states||[];
 for(const p of c.webpages){let row=c.source_states.find(x=>x.url===p.source.requested_url);if(!row){row={url:p.source.requested_url,request_status:'unknown',target_status:null,text_status:'usable'};c.source_states.push(row);}const a=c.assessments.find(a=>a.source_id===p.source.source_id);Object.assign(row,{source_id:p.source.source_id,identity:a?.identity_match||'unassessed',independence:a?.independence||'unassessed',accepted_fact_count:c.webfacts.filter(f=>f.source_id===p.source.source_id).length,qualified:accepted.has(p.source.source_id),coverage:p.truncated?'excerpt':'full_extracted_text'});}
 c.research_sufficiency={target_met:met,qualified_sources:accepted.size,active_issues:active,historical_issues:c.research_issues.filter(i=>!active.includes(i)),stop_reason:stop};
 const status=!c.webfacts.length?'failed':met&&!active.length?'success':'partial';
 c.research=stage(c,status,status==='failed'?null:{sources:c.webpages.map(p=>p.source),facts:c.webfacts,evidence_status:'available',source_assessments:c.assessments,qualified_source_count:accepted.size,target_sources:c.limits.target_sources,target_met:met,stop_reason:stop},c.research_issues);
 return c;
}
