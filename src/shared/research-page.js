// Offsets refer to normalized extracted text, never to the raw HTML document.
function researchExcerpt(extracted,bioFacts,limit) {
 const normalize=s=>String(s).replace(/\s*\[https?:\/\/[^\]\s]+\]/g,'').replace(/\[(?:\d+(?:[,–-]\d+)*|note \d+)\]/gi,'').replace(/\s+/g,' ').trim();
 const words=s=>(s||'').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[];
 const cues={birth_date:/\b(born|birth)\b/i,birth_place:/\b(born|birth|hometown)\b/i,occupation:/\b(writer|author|physicist|poet|novelist|scientist|professor)\b/i};
 let paragraphs=[],selector=null;
 for(const key of ['article','main','body']){const seen=new Set();const rows=(extracted[key]||[]).map((raw,index)=>({text:normalize(raw),index,raw_length:String(raw).length})).filter(p=>p.text&&!seen.has(p.text)&&seen.add(p.text));if(rows.map(p=>p.text).join('\n\n').length>150){paragraphs=rows;selector=key;break;}}
 let offset=0;for(const p of paragraphs){p.start=offset;p.end=offset+p.text.length;offset=p.end+2;p.matches=bioFacts.filter(f=>cues[f.field]?.test(p.text)||words(f.subject).some(t=>words(p.text).includes(t))).map(f=>f.fact_id);}
 const full=paragraphs.map(p=>p.text).join('\n\n'),selected=[];let size=0;
 const add=(p,reason)=>{if(!p||selected.includes(p)||size+p.text.length+(selected.length?2:0)>limit)return false;p.reason=reason;selected.push(p);size+=p.text.length+(selected.length>1?2:0);return true;};
 if(full.length<=limit)paragraphs.forEach(p=>add(p,'within_budget'));
 else {
  add(paragraphs[0],'lead_context');
  // Give each pending fact a chance before spending the budget on extra context.
  for(const f of bioFacts)if(!selected.some(p=>p.matches.includes(f.fact_id)))for(const p of paragraphs.filter(p=>p.matches.includes(f.fact_id)))if(add(p,'question_candidate'))break;
  for(const p of [...paragraphs].sort((a,b)=>b.matches.length-a.matches.length||a.index-b.index))add(p,p.matches.length?'question_candidate':'context');
 }
 selected.sort((a,b)=>a.index-b.index);let submitted=0;
 const spans=selected.map(p=>{const row={paragraph_index:p.index,normalized_start:p.start,normalized_end:p.end,submitted_start:submitted,submitted_end:submitted+p.text.length,raw_paragraph_length:p.raw_length,reason:p.reason,candidate_fact_ids:p.matches};submitted=row.submitted_end+2;return row;});
 return {text:selected.map(p=>p.text).join('\n\n'),truncated:selected.length<paragraphs.length,trace:{selector,coordinate_system:'normalized_extracted_text; zero-based paragraph indices in selected extraction array',normalized_chars:full.length,selected_chars:size,paragraphs:spans,questions:bioFacts.map(f=>({fact_id:f.fact_id,field:f.field,candidate_paragraphs:spans.filter(p=>p.candidate_fact_ids.includes(f.fact_id)).map(p=>p.paragraph_index),status:spans.some(p=>p.candidate_fact_ids.includes(f.fact_id))?'candidate_found':'not_found_in_excerpt'})),qualification:'Retrieval hints only; no identity, entailment or verification claim.'}};
}
function collectResearchPage(c) {
  if(c.req.allowed){
    const status=Number(c.response?.headers?.['x-response-code']);
    const title=clean(c.extracted?.titles?.[0]);
    c.source_states=c.source_states||[];
    const row={url:c.req.body.url,request_status:c.response?.statusCode===200?'success':'failed',target_status:Number.isFinite(status)?status:null,text_status:'unavailable',identity:'unassessed',independence:'unassessed',accepted_fact_count:0,qualified:false};c.source_states.push(row);
    const blocked=[401,403,429].includes(status)||/^(just a moment|access denied|attention required)/i.test(title);
    if(blocked)c.research_issues.push(issue('SOURCE_ACCESS_DENIED','Candidate '+c.req.body.url+' returned access restriction (target HTTP '+status+'); try another source.'));
    else {
      const excerpt=researchExcerpt(c.extracted||{},c.bio.data?.facts||[],c.limits.max_page_text_chars);
      row.excerpt_trace=excerpt.trace;
      if(validPage(c)&&excerpt.text.length>150){row.text_status='usable';row.coverage=excerpt.truncated?'excerpt':'full_extracted_text';c.round_pages.push({source:pageSource(c,'research:'+(c.webpages.length+c.round_pages.length+1),title),submitted_text:excerpt.text,truncated:excerpt.truncated});}
      else c.research_issues.push(issue('SOURCE_UNAVAILABLE','Candidate '+c.req.body.url+' did not provide usable text (target HTTP '+status+').'));
    }
  }
  delete c.extracted;return output(c);
}
