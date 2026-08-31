
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGRuntimeCheck=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase28-runtime-check-2';
const clone=x=>JSON.parse(JSON.stringify(x));
function check(name,ok,{critical=false,detail=null}={}){return{name:String(name),ok:!!ok,critical:!!critical,detail:detail==null?null:String(detail)}}
function storageCheck(storage){
  try{
    if(!storage||typeof storage.setItem!=='function'||typeof storage.getItem!=='function')return check('localStorage',false,{critical:true,detail:'unavailable'});
    const k='__mtgte_runtime_probe__';storage.setItem(k,'1');const ok=storage.getItem(k)==='1';storage.removeItem?.(k);
    return check('localStorage',ok,{critical:true,detail:ok?'read/write':'readback failed'});
  }catch(e){return check('localStorage',false,{critical:true,detail:e?.message||'blocked'})}
}
function moduleChecks(env={}){
  const names=['MTGEngine','MTGProfileStore','MTGDeckEngine','MTGMatchRecords','MTGStateVerify','MTGProtocol','MTGTransportGateway','MTGRecovery','MTGIntegrity'];
  return names.map(n=>check(n,!!env[n],{critical:['MTGEngine','MTGProfileStore','MTGProtocol','MTGTransportGateway'].includes(n)}));
}
function capabilityChecks(env={}){
  const nav=env.navigator||{},loc=env.location||{},crypto=env.crypto||{};
  return[
    check('secureContext',loc.protocol==='https:'||loc.hostname==='localhost',{detail:loc.protocol||'unknown'}),
    check('serviceWorker',!!nav.serviceWorker),
    check('onlineAPI',typeof nav.onLine==='boolean'),
    check('cryptoRandom',typeof crypto.randomUUID==='function'||typeof crypto.getRandomValues==='function'),
    check('PeerJS',typeof env.Peer==='function',{detail:typeof env.Peer==='function'?'available':'multiplayer transport unavailable'})
  ];
}
function evaluate(checks=[]){
  const list=(checks||[]).map(clone),criticalFailures=list.filter(x=>x.critical&&!x.ok),warnings=list.filter(x=>!x.critical&&!x.ok);
  return{ok:criticalFailures.length===0,status:criticalFailures.length?'blocked':warnings.length?'limited':'ready',criticalFailures,warnings,checks:list};
}
function multiplayerReady(report){const map=Object.fromEntries((report?.checks||[]).map(c=>[c.name,c]));return !!(report?.ok&&map.PeerJS?.ok&&map.MTGProtocol?.ok&&map.MTGTransportGateway?.ok)}
function run(env={}){const checks=[storageCheck(env.localStorage),...moduleChecks(env),...capabilityChecks(env)];const report=evaluate(checks);return{...report,multiplayerReady:multiplayerReady(report)}}
function safeMode(report){return{enabled:!report?.ok,reason:report?.criticalFailures?.map(x=>x.name).join(', ')||null,multiplayerEnabled:!!report?.multiplayerReady}}
return{VERSION,check,storageCheck,moduleChecks,capabilityChecks,evaluate,multiplayerReady,run,safeMode};
});
