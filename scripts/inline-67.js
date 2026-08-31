
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGCommanderZone=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase51-commander-zone-tax-1';
 function key(playerId,commanderId){return String(commanderId||('player_'+Number(playerId)+'_commander_1'))}
 function ensure(state){state.commanderCasting??={byPlayer:{}};state.commanderCasting.byPlayer??={};return state.commanderCasting}
 function entry(state,playerId,commanderId,name){ensure(state);const pid=String(Number(playerId)||playerId),cid=key(playerId,commanderId);state.commanderCasting.byPlayer[pid]??={};let e=state.commanderCasting.byPlayer[pid][cid];if(!e)e=state.commanderCasting.byPlayer[pid][cid]={commanderId:cid,playerId:Number(playerId),name:String(name||'Commander'),castsFromCommand:0,lastCastTax:0,nextTax:0,lastFromZone:null};if(name)e.name=String(name);return e}
 function read(state,playerId,commanderId){const pid=String(Number(playerId)||playerId),cid=key(playerId,commanderId),e=state?.commanderCasting?.byPlayer?.[pid]?.[cid];return e?JSON.parse(JSON.stringify(e)):{commanderId:cid,playerId:Number(playerId),name:'Commander',castsFromCommand:0,lastCastTax:0,nextTax:0,lastFromZone:null}}
 function castTax(state,playerId,commanderId){return Math.max(0,Number(read(state,playerId,commanderId).castsFromCommand||0)*2)}
 function castIntent(playerId,commanderId,name,fromZone='command'){return{type:'COMMANDER_CAST_RECORDED',payload:{playerId:Number(playerId),commanderId:key(playerId,commanderId),name:String(name||'Commander'),fromZone:String(fromZone||'command').toLowerCase()}}}
 function allForPlayer(state,playerId){const p=state?.commanderCasting?.byPlayer?.[String(Number(playerId)||playerId)]||{};return Object.values(p).map(x=>JSON.parse(JSON.stringify(x)))}
 function primary(state,playerId,commanderId){return read(state,playerId,commanderId)}
 function localQA(engine){let st=engine.normalizeState({life:{1:40},events:[],snapshots:[],feed:[]});function emit(intent){engine.reduce(st,engine.makeEvent(st,intent.type,intent.payload,1,{source:'qa'}))}
  emit(castIntent(1,'alpha','Alpha','command'));let a1=read(st,1,'alpha');
  emit(castIntent(1,'alpha','Alpha','command'));let a2=read(st,1,'alpha');
  emit(castIntent(1,'beta','Beta','command'));let b1=read(st,1,'beta');
  emit(castIntent(1,'alpha','Alpha','hand'));let a3=read(st,1,'alpha');
  const checks=[
   ['first command-zone cast pays zero tax',a1.lastCastTax===0],
   ['next tax after first cast is two',a1.nextTax===2],
   ['second command-zone cast pays two',a2.lastCastTax===2],
   ['next tax after second cast is four',a2.nextTax===4],
   ['second commander tracks independently',b1.castsFromCommand===1&&b1.nextTax===2],
   ['cast outside command zone does not increase tax',a3.castsFromCommand===2&&a3.nextTax===4],
   ['legacy total cast counter remains available',Number(st.cmdCasts?.[1])===4]
  ];return{ok:checks.every(x=>x[1]),checks,state:st}
 }
 return{VERSION,key,ensure,entry,read,castTax,castIntent,allForPlayer,primary,localQA}
});

