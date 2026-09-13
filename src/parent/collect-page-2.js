const f=$('Normalize Fetch 2').first().json;
const blocks=$('Extract Blocks 2').first().json.blocks||[];const rows=$input.all();const quotes=[];const issues=[...f.issues];
const clean=s=>typeof s==='string'?s.replace(/\s+/g,' ').trim():'';
if(blocks.length&&rows.length!==blocks.length)throw new Error('QUOTE_ITEM_COUNT_MISMATCH');
for(let i=0;i<blocks.length;i++){const r=rows[i].json;
 if(r.texts?.length!==1||r.names?.length!==1||r.links?.length!==1||!clean(r.texts[0])||!clean(r.names[0])||!/^\/author\/[^/?#]+\/?$/.test(r.links[0])){issues.push({code:'QUOTE_INVALID',message:'Invalid quote at position '+(i+1),source_id:null});continue;}
 const bio_url='https://quotes.toscrape.com'+r.links[0].replace(/\/?$/,'/');
 quotes.push({quote_id:f.page_url+'#quote-'+(i+1),page_url:f.page_url,position:i+1,text:clean(r.texts[0]),author_name:clean(r.names[0]),tags:[...new Set((r.tags||[]).map(clean).filter(Boolean))],bio_url,author_id:bio_url});
}
if(f.ok&&!blocks.length)issues.push({code:'NO_QUOTES_FOUND',message:'Successful HTTP response contained no quote blocks; coverage is incomplete',source_id:null});
return [{json:{coverage:{page_url:f.page_url,fetch_status:f.ok?'success':'failed',discovered_count:blocks.length,parsed_count:quotes.length,invalid_count:blocks.length-quotes.length,complete:f.ok&&blocks.length>0&&quotes.length===blocks.length,issues},quotes}}];