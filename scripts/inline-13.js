
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGReleaseGate=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase26-release-gate-1';
function summarize(checks=[]){
  const list=checks.map(c=>({name:String(c.name||'check'),ok:!!c.ok,detail:c.detail||null}));
  return{ok:list.every(c=>c.ok),passed:list.filter(c=>c.ok).length,failed:list.filter(c=>!c.ok).length,checks:list};
}
function requireAll(named={}){return summarize(Object.entries(named).map(([name,ok])=>({name,ok})))}
return{VERSION,summarize,requireAll};
});
