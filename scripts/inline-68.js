
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGCommanderReturn=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase52-commander-return-1';
 function clone(x){return JSON.parse(JSON.stringify(x));}
 function isCommanderObject(o){return !!(o&&(o.isCommander||o.commanderId));}
 function identity(o){if(!isCommanderObject(o))return null;const ownerId=Number(o.commanderOwnerId??o.owner);if(!ownerId)return null;return{objectId:String(o.id||''),ownerId,commanderId:String(o.commanderId||('player_'+ownerId+'_commander_1')),name:String(o.commanderName||o.name||'Commander')}}
 function pending(state){return Object.values(state?.commanderZoneChoices?.byObject||{}).map(clone)}
 function pendingFor(state,objectId){const x=state?.commanderZoneChoices?.byObject?.[String(objectId)];return x?clone(x):null}
 function resolveIntent(objectId,moveToCommand){return{type:'COMMANDER_ZONE_CHOICE_RESOLVED',payload:{objectId:String(objectId),moveToCommand:!!moveToCommand}}}
 function handDestinationIntent(objectId,chooseCommand){return{type:'OBJECT_ZONE_CHANGED',payload:{objectId:String(objectId),toZone:chooseCommand?'command':'hand',reset:true,commanderReplacement:!!chooseCommand}}}
 function localQA(engine){
  let st=engine.normalizeState({life:{1:40},battle:[{id:'cmd1',name:'QA Commander',owner:1,controllerId:1,isCommander:true,commanderOwnerId:1,commanderId:'alpha',commanderName:'QA Commander',q:'1',c:{}}],events:[],snapshots:[],feed:[]});
  function emit(intent,actor=1){engine.reduce(st,engine.makeEvent(st,intent.type,intent.payload,actor,{source:'qa'}))}
  emit({type:'OBJECT_ZONE_CHANGED',payload:{objectId:'cmd1',toZone:'graveyard',reset:true}});
  const p1=pendingFor(st,'cmd1'),gy1=st.zones.graveyard.find(x=>x.id==='cmd1');
  emit(resolveIntent('cmd1',false));
  const stayed=st.zones.graveyard.some(x=>x.id==='cmd1')&&!pendingFor(st,'cmd1');
  emit({type:'OBJECT_ZONE_CHANGED',payload:{objectId:'cmd1',toZone:'battlefield',reset:true}});
  emit({type:'OBJECT_ZONE_CHANGED',payload:{objectId:'cmd1',toZone:'exile',reset:true}});
  const p2=pendingFor(st,'cmd1');
  emit(resolveIntent('cmd1',true));
  const inCmd=st.zones.command.some(x=>x.id==='cmd1'),notExile=!st.zones.exile.some(x=>x.id==='cmd1');
  emit({type:'OBJECT_ZONE_CHANGED',payload:{objectId:'cmd1',toZone:'battlefield',reset:true}});
  emit(handDestinationIntent('cmd1',true));
  const handReplacement=st.zones.command.some(x=>x.id==='cmd1')&&!st.zones.hand.some(x=>x.id==='cmd1')&&!pendingFor(st,'cmd1');
  const checks=[
   ['graveyard move creates post-move commander choice',!!p1&&p1.toZone==='graveyard'&&!!gy1],
   ['declining command-zone return leaves commander in graveyard',stayed],
   ['exile move creates post-move commander choice',!!p2&&p2.toZone==='exile'],
   ['accepting choice moves same object to command zone',inCmd&&notExile],
   ['commander identity survives the return',st.zones.command.find(x=>x.id==='cmd1')?.commanderId==='alpha'],
   ['hand replacement can route directly to command zone',handReplacement],
   ['resolved choices do not remain pending',pending(st).length===0]
  ];
  return{ok:checks.every(x=>x[1]),checks,state:st}
 }
 return{VERSION,isCommanderObject,identity,pending,pendingFor,resolveIntent,handDestinationIntent,localQA}
});

