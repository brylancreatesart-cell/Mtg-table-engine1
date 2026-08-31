
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGActionScript=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase32-action-script-1';
const clone=x=>JSON.parse(JSON.stringify(x));

const SCRIPTS={
  lifePoison:{
    id:'lifePoison',label:'Life + Poison Flow',
    actions:[
      {type:'life',playerId:1,delta:-5},
      {type:'life',playerId:2,delta:-7},
      {type:'poison',playerId:1,delta:3},
      {type:'poison',playerId:2,delta:2}
    ]
  },
  commander:{
    id:'commander',label:'Commander Damage Flow',
    actions:[
      {type:'commander',targetId:1,sourceId:2,amount:7},
      {type:'commander',targetId:1,sourceId:2,amount:6},
      {type:'commander',targetId:1,sourceId:2,amount:5}
    ]
  },
  turnFlow:{
    id:'turnFlow',label:'Turn / Priority Flow',
    actions:[
      {type:'phase',phase:'COMBAT'},
      {type:'active',playerId:2},
      {type:'priority',playerId:1},
      {type:'phase',phase:'END'}
    ]
  },
  elimination:{
    id:'elimination',label:'Elimination Flow',
    actions:[
      {type:'lifeSet',playerId:2,value:1},
      {type:'life',playerId:2,delta:-1},
      {type:'fallen',playerId:2,value:true}
    ]
  }
};

function list(){return Object.values(SCRIPTS).map(clone)}

function ensure(state){
  const s=clone(state||{});
  s.life=s.life||{};s.poison=s.poison||{};s.cmd=s.cmd||{};s.fallen=s.fallen||{};
  s.events=Array.isArray(s.events)?s.events:[];s.stack=Array.isArray(s.stack)?s.stack:[];
  s.meta=s.meta||{};
  return s;
}

function applyAction(state,a){
  const s=ensure(state),pid=Number(a.playerId||0);
  if(a.type==='life') s.life[pid]=Number(s.life[pid]??40)+Number(a.delta||0);
  else if(a.type==='lifeSet') s.life[pid]=Number(a.value||0);
  else if(a.type==='poison') s.poison[pid]=Number(s.poison[pid]||0)+Number(a.delta||0);
  else if(a.type==='commander'){
    const t=Number(a.targetId),src=Number(a.sourceId);
    s.cmd[t]=s.cmd[t]||{};s.cmd[t][src]=Number(s.cmd[t][src]||0)+Number(a.amount||0);
  }
  else if(a.type==='phase') s.phase=String(a.phase||s.phase||'MAIN 1');
  else if(a.type==='active') s.active=pid;
  else if(a.type==='priority') s.priority=pid;
  else if(a.type==='fallen') s.fallen[pid]=!!a.value;
  else throw new Error('Unknown action type');
  s.meta.scriptVersion=VERSION;
  return s;
}

function run(state,script){
  let s=ensure(state),trace=[];
  for(const a of script.actions||[]){
    s=applyAction(s,a);
    trace.push({action:clone(a),state:clone(s)});
  }
  s.meta.scriptId=script.id||null;
  return{state:s,trace};
}

function expected(scriptId){
  const map={
    lifePoison:s=>s.life?.[1]===35&&s.life?.[2]===33&&s.poison?.[1]===3&&s.poison?.[2]===2,
    commander:s=>Number(s.cmd?.[1]?.[2]||0)===18,
    turnFlow:s=>s.phase==='END'&&s.active===2&&s.priority===1,
    elimination:s=>s.life?.[2]===0&&s.fallen?.[2]===true
  };
  return map[scriptId]||(()=>false);
}

function verify(result,scriptId){
  const ok=!!expected(scriptId)(result?.state||{});
  return{scriptId,ok,steps:result?.trace?.length||0};
}

function runById(state,id){
  const script=SCRIPTS[id];if(!script)throw new Error('Unknown script');
  const result=run(state,script);
  return{...result,verification:verify(result,id)};
}

function runAll(state){
  const runs=[];
  for(const x of list())runs.push({id:x.id,...runById(state,x.id)});
  return{version:VERSION,total:runs.length,passed:runs.filter(x=>x.verification.ok).length,failed:runs.filter(x=>!x.verification.ok).length,ok:runs.every(x=>x.verification.ok),runs};
}

return{VERSION,SCRIPTS,list,ensure,applyAction,run,expected,verify,runById,runAll};
});
