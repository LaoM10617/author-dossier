const c=$('Initialize Intake').first().json;const pages=[$('Collect Page 1').first().json,$('Collect Page 2').first().json];
const quotes=pages.flatMap(p=>p.quotes);const byId=new Map();
for(const q of quotes){if(!byId.has(q.author_id))byId.set(q.author_id,{author_id:q.author_id,name:q.author_name,bio_url:q.bio_url,quote_ids:[]});byId.get(q.author_id).quote_ids.push(q.quote_id);}
const authors=[...byId.values()];
return [{json:{run_id:c.run_id,pages:pages.map(p=>p.coverage),input_complete:pages.every(p=>p.coverage.complete),quotes,authors,author_inputs:authors.map(author=>({run_id:c.run_id,author,limits:c.limits,identity_quotes:quotes.filter(q=>q.author_id===author.author_id).map(q=>q.text)})),quote_count:quotes.length,author_count:authors.length}}];