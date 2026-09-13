const r=$input.first().json;const page_url=$('Initialize Intake').first().json.page_urls[1];
const ok=r.statusCode===200&&Number(r.headers?.['x-response-code'])===200&&typeof r.html==='string'&&r.html.trim().length>0;
return [{json:{page_url,ok,html:ok?r.html:'<html></html>',issues:ok?[]:[{code:'PAGE_FETCH_FAILED',message:'Page fetch failed or returned no HTML',source_id:null}]}}];