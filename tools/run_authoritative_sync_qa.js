const fs=require('fs');
const vm=require('vm');
const path=require('path');

const scripts=fs.readdirSync('scripts').filter(f=>/^inline-\d+\.js$/.test(f)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
const wanted=['MTGStateVerify','MTGProtocolPolicy','MTGProtocol','MTGRoomSession','MTGTransportGateway','MTGAuthoritativeSync'];
const owner={};
for(const file of scripts){
  const src=fs.readFileSync(path.join('scripts',file),'utf8');
  for(const name of wanted){
    if(owner[name])continue;
    const signatures=[`root.${name}=api`,`root.${name} = api`,`root.${name}=factory`,`root.${name} = factory`,`globalThis.${name}=`,`window.${name}=`];
    if(signatures.some(s=>src.includes(s))||new RegExp(`\\b${name}\\s*=\\s*api\\b`).test(src)) owner[name]=file;
  }
}
for(const name of wanted){if(!owner[name])throw new Error(`Could not locate module owner for ${name}`)}
const selected=[...new Set(Object.values(owner))].sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
const storage=()=>{const m=new Map();return{getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear()}};
const sandbox={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone:global.structuredClone,crypto:require('crypto').webcrypto,TextEncoder,TextDecoder,URL,URLSearchParams,Date,Math,JSON,Map,Set,WeakMap,WeakSet,Array,Object,String,Number,Boolean,RegExp,Error,TypeError,Promise,localStorage:storage(),sessionStorage:storage()};
sandbox.globalThis=sandbox;sandbox.window=sandbox;
vm.createContext(sandbox);
const loaded=[];
for(const file of selected){
  const src=fs.readFileSync(path.join('scripts',file),'utf8');
  try{vm.runInContext(src,sandbox,{filename:file,timeout:5000});loaded.push(file)}catch(e){throw new Error(`Failed loading ${file}: ${e.stack||e.message}`)}
}
for(const name of wanted){if(!sandbox[name])throw new Error(`${name} was not exported after loading ${owner[name]}`)}
const result=sandbox.MTGAuthoritativeSync.localQA();
const report={owners:owner,loaded,result};
fs.writeFileSync('authoritative-sync-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!result.ok){
  const failed=result.checks.filter(x=>!x[1]).map(x=>x[0]);
  throw new Error(`Authoritative sync QA failed: ${failed.join('; ')}`);
}
