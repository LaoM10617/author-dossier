const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'dist'),{recursive:true});
for(const role of ['parent','child']){const w=JSON.parse(fs.readFileSync(path.join(root,'workflows',role+'.template.json'),'utf8'));for(const n of w.nodes)if(n.type==='n8n-nodes-base.code'){const file=n.parameters.jsCode.replace('__SOURCE__:','');n.parameters.jsCode=fs.readFileSync(path.join(root,'src',role,file),'utf8');}fs.writeFileSync(path.join(root,'dist',role+'-workflow.json'),JSON.stringify(w,null,2));console.log('Built '+role);}
