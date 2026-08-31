
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGQARunner=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase31-qa-runner-1';
const clone=x=>JSON.parse(JSON.stringify(x));

function scenarioIds(qa){return qa.list().map(x=>x.id)}
function runScenario({qa,state,players,id}={}){
  const next=qa.applyScenario(state,players,id);
  const result=qa.result(next,players,id);
  return{scenario:id,state:next,result,ok:!!result.ok};
}
function runAll({qa,state,players}={}){
  let current=clone(state||{}),runs=[];
  for(const id of scenarioIds(qa)){
    const r=runScenario({qa,state:current,players,id});
    current=r.state;runs.push({scenario:id,ok:r.ok,result:r.result});
  }
  return summary(runs);
}
function summary(runs=[]){
  const total=runs.length,passed=runs.filter(x=>x.ok).length,failed=total-passed;
  return{version:VERSION,total,passed,failed,ok:failed===0,runs:clone(runs)};
}
function coreActionChecks(state,players){
  const me=players?.[0]?.id,opp=players?.[1]?.id,checks=[];
  checks.push({name:'local seat exists',ok:!!me});
  checks.push({name:'opponent seat exists',ok:!!opp});
  checks.push({name:'life map present',ok:!!state?.life});
  checks.push({name:'poison map present',ok:!!state?.poison});
  checks.push({name:'stack array present',ok:Array.isArray(state?.stack)});
  checks.push({name:'events array present',ok:Array.isArray(state?.events)});
  return checks;
}
function actionSummary(state,players){
  const checks=coreActionChecks(state,players);
  return{ok:checks.every(x=>x.ok),passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length,checks};
}
function fullReport({qa,state,players}={}){
  const scenarios=runAll({qa,state,players}),actions=actionSummary(state,players);
  return{
    format:'mtgte-qa-report',
    schemaVersion:1,
    version:VERSION,
    generatedAt:new Date().toISOString(),
    ok:scenarios.ok&&actions.ok,
    scenarios,
    actions
  };
}
return{VERSION,scenarioIds,runScenario,runAll,summary,coreActionChecks,actionSummary,fullReport};
});
