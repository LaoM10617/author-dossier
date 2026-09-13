const d=$input.first().json;const run_id='m05-batch-'+$execution.id;
if(!Array.isArray(d.author_inputs)||!Array.isArray(d.quotes)||!Array.isArray(d.pages))throw new Error('INVALID_DATASET');
if(new Set(d.author_inputs.map(x=>x.author.author_id)).size!==d.author_inputs.length)throw new Error('DUPLICATE_AUTHOR_INPUT');
return [{json:{...d,run_id,author_inputs:d.author_inputs.map(x=>({...x,run_id}))}}];