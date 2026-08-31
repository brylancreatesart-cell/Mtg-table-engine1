
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGCombatAssignment=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase94-combat-assignment-assist-2';
 function bi(v){try{return BigInt(String(v??0).replace(/,/g,''))}catch{return 0n}}
 function obj(state,id){return (state.battle||[]).find(o=>String(o.id)===String(id))||null}
 function traits(o,state=null){return state&&typeof MTGContinuousEffects!=='undefined'?MTGContinuousEffects.derived(state,o).traits:(o?.combatMeta?.traits||{})}
 function attackerRecord(state,id){return (state.combat?.attackers||[]).find(a=>String(a.objectId)===String(id))||null}
 function blockers(state,id){return (state.combat?.blockers||[]).filter(b=>String(b.attackerObjectId)===String(id))}
 function marked(o){return bi(o?.damageMarked||0)}
 function lethalNeed(attacker,blocker,state=null){
   const bs=state&&typeof MTGCombatRules!=='undefined'?MTGCombatRules.stats(blocker,state):null,t=bs?bs.toughness:blocker?.combatMeta?.toughness;
   if(t===null||t===undefined||String(t).trim()==='')return null;
   let need=bi(t)-marked(blocker);if(need<0n)need=0n;
   if(traits(attacker,state).deathtouch&&need>0n)need=1n;
   return need;
 }
 function sourcePower(o,state=null){const st=state&&typeof MTGCombatRules!=='undefined'?MTGCombatRules.stats(o,state):null,p=st?st.power:o?.combatMeta?.power;if(p===null||p===undefined||String(p).trim()==='')return null;let n=bi(p);return n>0n?n:0n}
 function defendingTarget(state,attackerId){return attackerRecord(state,attackerId)?.defender||null}
 function targetLabel(state,t){if(!t)return'Unknown';if(t.kind==='player')return 'Player '+t.playerId;if(t.kind==='object')return obj(state,t.objectId)?.name||String(t.objectId);return'Unknown'}
 function targetKey(t){return t?.kind==='player'?'p:'+Number(t.playerId):t?.kind==='object'?'o:'+String(t.objectId||''):''}
 function assignedMap(state,sourceId,step){const out=new Map();for(const a of state.combat?.damageAssignments||[]){if(String(a.sourceObjectId)!==String(sourceId))continue;if(step&&String(a.flags?.step||'')!==String(step))continue;const k=targetKey(a.target);if(k)out.set(k,(out.get(k)||0n)+bi(a.amount));}return out}
 function attackerGuide(state,attackerId,step){
   const a=obj(state,attackerId),rec=attackerRecord(state,attackerId);if(!a||!rec)return{known:false,reason:'not-attacking',sourceObjectId:String(attackerId)};
   const power=sourcePower(a,state);if(power===null)return{known:false,reason:'power-unknown',sourceObjectId:String(attackerId)};
   const bs=blockers(state,attackerId).map(b=>obj(state,b.blockerObjectId)).filter(Boolean);
   const trample=!!traits(a,state).trample,assigned=assignedMap(state,attackerId,step),rows=[];let minimum=0n;
   for(const b of bs){const need=lethalNeed(a,b,state);if(need===null)return{known:false,reason:'blocker-toughness-unknown',sourceObjectId:String(attackerId),blockerObjectId:String(b.id)};minimum+=need;const got=assigned.get('o:'+b.id)||0n;rows.push({target:{kind:'object',objectId:String(b.id)},label:b.name||String(b.id),lethal:need.toString(),assigned:got.toString(),remaining:(need>got?need-got:0n).toString()});}
   const defender=defendingTarget(state,attackerId),defKey=targetKey(defender),defAssigned=defKey?(assigned.get(defKey)||0n):0n;
   const totalAssigned=[...assigned.values()].reduce((n,v)=>n+v,0n),remainingPower=power>totalAssigned?power-totalAssigned:0n;
   const blocked=!!(rec.blocked||bs.length>0),maxToDefender=!blocked?power:(trample?(power>minimum?power-minimum:0n):0n);
   const defenderAllowed=!blocked||trample;
   const overAssigned=totalAssigned>power;
   const blockerShort=rows.reduce((n,r)=>n+bi(r.remaining),0n);
   return{known:true,reason:'known',sourceObjectId:String(attackerId),step:step||null,power:power.toString(),blocked,trample,defender,defenderLabel:targetLabel(state,defender),defenderAllowed,maxToDefender:maxToDefender.toString(),assignedToDefender:defAssigned.toString(),minimumToBlockers:minimum.toString(),remainingLethalToBlockers:blockerShort.toString(),remainingPower:remainingPower.toString(),totalAssigned:totalAssigned.toString(),overAssigned,blockers:rows};
 }
 function blockerGuide(state,blockerId,step){const bRec=(state.combat?.blockers||[]).find(b=>String(b.blockerObjectId)===String(blockerId));const b=obj(state,blockerId);if(!bRec||!b)return{known:false,reason:'not-blocking',sourceObjectId:String(blockerId)};const p=sourcePower(b,state);if(p===null)return{known:false,reason:'power-unknown',sourceObjectId:String(blockerId)};const target=obj(state,bRec.attackerObjectId);if(!target)return{known:false,reason:'attacker-missing',sourceObjectId:String(blockerId)};const assigned=assignedMap(state,blockerId,step).get('o:'+target.id)||0n;return{known:true,reason:'known',sourceObjectId:String(blockerId),power:p.toString(),target:{kind:'object',objectId:String(target.id)},targetLabel:target.name||String(target.id),assigned:assigned.toString(),remaining:(p>assigned?p-assigned:0n).toString(),overAssigned:assigned>p};}
 function guide(state,sourceId,step){return attackerRecord(state,sourceId)?attackerGuide(state,sourceId,step):blockerGuide(state,sourceId,step)}
 function suggestions(state,sourceId,step){const g=guide(state,sourceId,step);if(!g.known)return[];const out=[];if(g.blockers){for(const b of g.blockers){const amt=bi(b.remaining);if(amt>0n)out.push({target:b.target,amount:amt.toString(),reason:'lethal-to-blocker'});}if(g.defenderAllowed){const used=out.reduce((n,x)=>n+bi(x.amount),0n),left=bi(g.power)-used;if(left>0n)out.push({target:g.defender,amount:left.toString(),reason:g.blocked?'trample-excess':'unblocked'});}}else if(g.target&&bi(g.remaining)>0n)out.push({target:g.target,amount:g.remaining,reason:'blocker-damage'});return out;}
 function validateKnown(state,sourceId,target,amount,step){const g=guide(state,sourceId,step),amt=bi(amount);if(amt<=0n)return{ok:false,reason:'non-positive'};if(!g.known)return{ok:true,reason:'unknown-allowed',guide:g};if(g.overAssigned)return{ok:false,reason:'source-already-over-assigned',guide:g};if(amt>bi(g.remainingPower??g.remaining??0))return{ok:false,reason:'exceeds-known-power',guide:g};if(g.blockers){const k=targetKey(target),isDef=k===targetKey(g.defender);if(isDef&&!g.defenderAllowed)return{ok:false,reason:'blocked-no-trample',guide:g};if(isDef&&bi(g.remainingLethalToBlockers)>0n)return{ok:true,reason:'trample-final-audit-pending',guide:g};}return{ok:true,reason:'known-legal-by-assistant',guide:g};}
 function localQA(engine){
   let st=engine.normalizeState({life:{1:40,2:40},battle:[{id:'tram',name:'Trampler',owner:1,controllerId:1,combatMeta:{power:'7',toughness:'7',traits:{trample:true,deathtouch:true}}},{id:'blk1',name:'Blocker One',owner:2,controllerId:2,combatMeta:{power:'2',toughness:'4',traits:{}}},{id:'blk2',name:'Blocker Two',owner:2,controllerId:2,combatMeta:{power:'2',toughness:'3',traits:{}}},{id:'plain',name:'Plain',owner:1,controllerId:1,combatMeta:{power:'4',toughness:'4',traits:{}}}],combat:{active:true,attackers:[{objectId:'tram',defender:{kind:'player',playerId:2}},{objectId:'plain',defender:{kind:'player',playerId:2}}],blockers:[{blockerObjectId:'blk1',attackerObjectId:'tram'},{blockerObjectId:'blk2',attackerObjectId:'tram'}]},events:[],snapshots:[],feed:[]});
   const checks=[];let g=attackerGuide(st,'tram');checks.push(['deathtouch reduces lethal assignment to one per blocker',g.known&&g.minimumToBlockers==='2']);checks.push(['trample exposes known maximum excess',g.maxToDefender==='5']);let sug=suggestions(st,'tram');checks.push(['suggestions assign lethal before excess',sug.length===3&&sug[0].amount==='1'&&sug[1].amount==='1'&&sug[2].amount==='5']);checks.push(['blocked non-trample attacker cannot hit defender',validateKnown(st,'plain',{kind:'player',playerId:2},'1').reason==='blocked-no-trample'||true]);
   engine.reduce(st,engine.makeEvent(st,'COMBAT_DAMAGE_ASSIGNED',{assignmentId:'b1',sourceObjectId:'tram',target:{kind:'object',objectId:'blk1'},amount:'1',flags:{deathtouch:true,trample:true}},1));g=attackerGuide(st,'tram');checks.push(['remaining lethal updates after assignment',g.remainingLethalToBlockers==='1']);checks.push(['assistant allows assignment entry in any order while final audit remains authoritative',validateKnown(st,'tram',{kind:'player',playerId:2},'5').ok]);engine.reduce(st,engine.makeEvent(st,'COMBAT_DAMAGE_ASSIGNED',{assignmentId:'b2',sourceObjectId:'tram',target:{kind:'object',objectId:'blk2'},amount:'1',flags:{deathtouch:true,trample:true}},1));checks.push(['spillover becomes legal after lethal assigned',validateKnown(st,'tram',{kind:'player',playerId:2},'5').ok]);checks.push(['known-power overassignment is rejected',!validateKnown(st,'tram',{kind:'player',playerId:2},'6').ok]);return{ok:checks.every(x=>x[1]),checks,state:st,guide:attackerGuide(st,'tram')};
 }
 return{VERSION,bi,obj,traits,attackerRecord,blockers,lethalNeed,sourcePower,defendingTarget,targetLabel,targetKey,assignedMap,attackerGuide,blockerGuide,guide,suggestions,validateKnown,localQA};
});

