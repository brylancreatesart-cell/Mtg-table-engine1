
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGCombatKeywords=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase85-combat-keyword-derived-2';
 function traits(o,state=null){return state&&typeof MTGContinuousEffects!=='undefined'?MTGContinuousEffects.derived(state,o).traits:(o?.combatMeta?.traits||{})}
 function has(o,k,state=null){return !!traits(o,state)[k]}
 function attackerShouldTap(o,state=null){return !has(o,'vigilance',state)}
 function canBlock(attacker,blocker,state=null){
   if(!attacker||!blocker)return{ok:false,reason:'missing-object'};
   if(!/\bCreature\b/i.test(String(blocker.typeLine||blocker.type||'')))return{ok:false,reason:'only-creatures-can-block'};
   if(blocker.tapped)return{ok:false,reason:'tapped-creature-cannot-block'};
   if(has(attacker,'flying',state)&&!has(blocker,'flying',state)&&!has(blocker,'reach',state))return{ok:false,reason:'flying-requires-flying-or-reach'};
   if(state&&globalThis.MTGProtectionRules){let p=globalThis.MTGProtectionRules.blockLegality(state,attacker,blocker);if(!p.legal)return{ok:false,reason:p.reason,review:!!p.review,quality:p.quality||null}}
   return{ok:true,reason:'legal-by-known-keywords'};
 }
 function minimumBlockers(attacker,state=null){return has(attacker,'menace',state)?2:1}
 function blockerRequirement(state,attackerId){
   const a=(state.battle||[]).find(o=>String(o.id)===String(attackerId));
   if(!a)return{known:false,required:0,assigned:0,satisfied:false,reason:'missing-attacker'};
   const assigned=(state.combat?.blockers||[]).filter(b=>String(b.attackerObjectId)===String(attackerId)).length,required=minimumBlockers(a,state);
   return{known:true,required,assigned,satisfied:assigned===0||assigned>=required,reason:required>1?'menace':'normal'};
 }
 function damageStepEligibility(o,step='normal',state=null){
   const first=has(o,'firstStrike',state),dbl=has(o,'doubleStrike',state);
   if(step==='first')return dbl||first;
   if(step==='normal')return dbl||!first;
   return false;
 }
 function lifelinkController(o,state=null){if(!o||!has(o,'lifelink',state))return null;const id=Number(o.controllerId??o.owner);return id>0?id:null}
 function norm(v){try{return BigInt(String(v??0).replace(/,/g,''))}catch{return 0n}}
 function trampleEstimate(state,attackerId){
   const a=(state.battle||[]).find(o=>String(o.id)===String(attackerId));
   if(!a)return{known:false,reason:'missing-attacker',minimumToBlockers:null,maximumExcess:null};
   if(!has(a,'trample',state))return{known:false,reason:'no-trample',minimumToBlockers:null,maximumExcess:null};
   const ast=typeof MTGCombatRules!=='undefined'?MTGCombatRules.stats(a,state):{power:a.combatMeta?.power},power=ast.power;if(power===null||power===undefined||String(power).trim()==='')return{known:false,reason:'power-unknown',minimumToBlockers:null,maximumExcess:null};
   const blocks=(state.combat?.blockers||[]).filter(b=>String(b.attackerObjectId)===String(attackerId));
   let need=0n;
   for(const b of blocks){const o=(state.battle||[]).find(x=>String(x.id)===String(b.blockerObjectId));if(!o)return{known:false,reason:'missing-blocker',minimumToBlockers:null,maximumExcess:null};const bst=typeof MTGCombatRules!=='undefined'?MTGCombatRules.stats(o,state):{toughness:o.combatMeta?.toughness},t=bst.toughness;if(t===null||t===undefined||String(t).trim()==='')return{known:false,reason:'blocker-toughness-unknown',minimumToBlockers:null,maximumExcess:null};let lethal=norm(t)-norm(o.damageMarked||0);if(lethal<0n)lethal=0n;if(has(a,'deathtouch',state)&&lethal>0n)lethal=1n;need+=lethal;}
   const p=norm(power),excess=p>need?p-need:0n;return{known:true,reason:'known',minimumToBlockers:need.toString(),maximumExcess:excess.toString(),power:p.toString(),blockerCount:blocks.length};
 }
 function localQA(engine){
   let st=engine.normalizeState({life:{1:40,2:40},phase:'DECLARE ATTACKERS',active:1,turn:2,battle:[{id:'vig',name:'Vigilant',owner:1,controllerId:1,typeLine:'Creature',controlledSinceTurn:1,combatMeta:{power:'3',toughness:'3',traits:{vigilance:true,lifelink:true}}},{id:'fly',name:'Flier',owner:1,controllerId:1,typeLine:'Creature',controlledSinceTurn:1,combatMeta:{power:'4',toughness:'4',traits:{flying:true,trample:true}}},{id:'ground',name:'Ground',owner:2,controllerId:2,typeLine:'Creature',controlledSinceTurn:1,combatMeta:{power:'2',toughness:'2',traits:{}}},{id:'reach',name:'Reach',owner:2,controllerId:2,typeLine:'Creature',controlledSinceTurn:1,combatMeta:{power:'2',toughness:'3',traits:{reach:true}}},{id:'menace',name:'Menace',owner:1,controllerId:1,typeLine:'Creature',controlledSinceTurn:1,combatMeta:{power:'3',toughness:'3',traits:{menace:true}}}],events:[],snapshots:[],feed:[]});
   const emit=(type,payload,actor=1)=>engine.reduce(st,engine.makeEvent(st,type,payload,actor,{source:'qa'}));
   emit('ATTACKER_DECLARED',{objectId:'vig',defender:{kind:'player',playerId:2}});emit('ATTACKER_DECLARED',{objectId:'fly',defender:{kind:'player',playerId:2}});emit('ATTACKER_DECLARED',{objectId:'menace',defender:{kind:'player',playerId:2}});
   let checks=[['vigilance attacker stays untapped',st.battle.find(o=>o.id==='vig').tapped===false],['normal attacker taps',st.battle.find(o=>o.id==='fly').tapped===true],['ground creature cannot block flying',canBlock(st.battle.find(o=>o.id==='fly'),st.battle.find(o=>o.id==='ground')).ok===false],['reach creature can block flying',canBlock(st.battle.find(o=>o.id==='fly'),st.battle.find(o=>o.id==='reach')).ok===true],['tapped creature cannot block',canBlock(st.battle.find(o=>o.id==='ground'),{...st.battle.find(o=>o.id==='reach'),tapped:true}).ok===false],['menace requires two blockers',minimumBlockers(st.battle.find(o=>o.id==='menace'))===2],['first strike step excludes ordinary creature',damageStepEligibility(st.battle.find(o=>o.id==='fly'),'first')===false]];
   st.phase='DECLARE BLOCKERS';emit('BLOCKER_DECLARED',{blockerObjectId:'ground',attackerObjectId:'fly'},2);checks.push(['engine rejects known illegal flying block',!st.combat.blockers.some(b=>b.blockerObjectId==='ground'&&b.attackerObjectId==='fly')]);
   emit('BLOCKER_DECLARED',{blockerObjectId:'reach',attackerObjectId:'fly'},2);checks.push(['engine accepts reach block',st.combat.blockers.some(b=>b.blockerObjectId==='reach'&&b.attackerObjectId==='fly')]);
   const tr=trampleEstimate(st,'fly');checks.push(['trample excess estimate uses blocker toughness',tr.known&&tr.minimumToBlockers==='3'&&tr.maximumExcess==='1']);
   emit('COMBAT_DAMAGE_ASSIGNED',{assignmentId:'ll',sourceObjectId:'vig',target:{kind:'player',playerId:2},amount:'3',flags:{lifelink:true}});emit('COMBAT_DAMAGE_RESOLVED',{});checks.push(['lifelink combat damage gains controller life',String(st.life[1])==='43'&&String(st.life[2])==='37']);let ds=engine.normalizeState({battle:[{id:'grant',owner:1,controllerId:1,typeLine:'Enchantment',continuousEffects:[{id:'flyall',kind:'keyword-grant',layer:'6',scope:{controller:'you',type:'Creature'},traits:['flying'],automation:'exact'}]},{id:'c',owner:1,controllerId:1,typeLine:'Creature',combatMeta:{power:'2',toughness:'2',traits:{}}},{id:'b',owner:2,controllerId:2,typeLine:'Creature',combatMeta:{power:'2',toughness:'2',traits:{}}}],events:[],snapshots:[],feed:[]});checks.push(['continuous flying grant affects block legality',canBlock(ds.battle[1],ds.battle[2],ds).ok===false]);
   return{ok:checks.every(x=>x[1]),checks,state:st,trample:tr};
 }
 return{VERSION,traits,has,attackerShouldTap,canBlock,minimumBlockers,blockerRequirement,damageStepEligibility,lifelinkController,trampleEstimate,localQA}
});

