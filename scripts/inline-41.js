
/* Phase 98 — card face/form state kernel: public multi-face definitions, same-object face changes, transform, and privacy-safe face-down state. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGCardForms=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const VERSION='phase98-card-form-kernel-1';
const clone=x=>JSON.parse(JSON.stringify(x));
const lc=v=>String(v||'').trim().toLowerCase();
const TRANSFORM_LAYOUTS=new Set(['transform','double_faced_token']);
function list(raw){return Array.isArray(raw)?raw:[]}
function primaryType(typeLine=''){for(const t of ['Creature','Artifact','Enchantment','Planeswalker','Battle','Land'])if(new RegExp('\\b'+t+'\\b','i').test(String(typeLine)))return t;return String(typeLine||'').split(/[—-]/)[0].trim().split(/\s+/).filter(Boolean).at(-1)||'Permanent'}
function normalizeFace(raw={},index=0){
 let name=String(raw.name||raw.n||('Face '+(index+1))),oracleText=String(raw.oracleText||raw.oracle_text||''),typeLine=String(raw.typeLine||raw.type_line||''),behaviors=raw.behaviors&&typeof raw.behaviors==='object'?clone(raw.behaviors):null;
 if(!behaviors&&root.MTGDeckEngine?.compileOracleBehaviors)behaviors=root.MTGDeckEngine.compileOracleBehaviors({n:name,oracleText,typeLine});
 return{id:String(raw.id||raw.faceId||('face-'+index)),name,oracleText,typeLine,manaCost:String(raw.manaCost||raw.mana_cost||''),colors:list(raw.colors).slice(),subtypes:list(raw.subtypes).length?list(raw.subtypes).slice():(root.MTGDeckEngine?.extractSubtypes?root.MTGDeckEngine.extractSubtypes(typeLine):[]),power:raw.power==null?null:String(raw.power),toughness:raw.toughness==null?null:String(raw.toughness),loyalty:raw.loyalty==null?null:String(raw.loyalty),defense:raw.defense==null?null:String(raw.defense),keywords:list(raw.keywords).slice(),behaviors:behaviors||{}}
}
function definitions(o={}){
 let raw=list(o.formState?.definitions);if(!raw.length)raw=list(o.faceDefinitions);if(!raw.length)raw=list(o.faces);if(!raw.length)raw=list(o.cardFaces);if(!raw.length)raw=list(o.card_faces);
 return raw.map(normalizeFace)
}
function faceById(o,id){id=String(id||'');return definitions(o).find(f=>f.id===id)||null}
function currentFace(o={}){let s=o.formState||{},defs=definitions(o);return defs.find(f=>f.id===String(s.currentFaceId||''))||defs[0]||null}
function faceTraits(face={},existing={}){
 let tr={...existing};for(const k of list(face.keywords)){let x=lc(k).replace(/\s+/g,''),map={firststrike:'firstStrike',doublestrike:'doubleStrike'};x=map[x]||x;if(['deathtouch','trample','vigilance','firstStrike','doubleStrike','flying','reach','menace','lifelink','indestructible','haste','phasing','defender'].includes(x))tr[x]=true}return tr
}
function applyFace(o,faceId,event=null,opts={}){
 if(!o)return{ok:false,reason:'object-missing',review:true};let defs=definitions(o),face=defs.find(f=>f.id===String(faceId||''));if(!face)return{ok:false,reason:'face-not-found',review:true};
 o.formState=o.formState&&typeof o.formState==='object'?o.formState:{};let previous=String(o.formState.currentFaceId||'')||null;
 o.formState.definitions=defs;o.formState.defaultFaceId=String(o.formState.defaultFaceId||defs[0]?.id||face.id);o.formState.previousFaceId=previous;o.formState.currentFaceId=face.id;o.formState.appliedFaceId=face.id;o.formState.faceDown=false;o.formState.visibility='public';o.formState.faceOrientation=String(opts.orientation||face.id);o.formState.changedAtSeq=Number(event?.seq||o.formState.changedAtSeq||0);
 o.name=face.name;o.typeLine=face.typeLine;o.type=primaryType(face.typeLine);o.oracleText=face.oracleText;o.colors=face.colors.slice();o.sub=face.subtypes.slice();o.subtypes=face.subtypes.slice();o.manaCost=face.manaCost;
 o.abilities=clone(face.behaviors?.abilities||[]);o.modifiers=clone(face.behaviors?.modifiers||[]);o.continuousEffects=clone(face.behaviors?.continuousEffects||[]);o.replacementEffects=clone(face.behaviors?.replacementEffects||[]);
 o.combatMeta=o.combatMeta&&typeof o.combatMeta==='object'?o.combatMeta:{};o.combatMeta.traits=faceTraits(face,o.combatMeta.traits||{});
 if(face.power!==null)o.combatMeta.power=face.power;else if(opts.clearMissingStats!==false)o.combatMeta.power=null;
 if(face.toughness!==null)o.combatMeta.toughness=face.toughness;else if(opts.clearMissingStats!==false)o.combatMeta.toughness=null;
 if(face.loyalty!==null)o.loyalty=face.loyalty;else delete o.loyalty;if(face.defense!==null)o.defense=face.defense;else delete o.defense;
 delete o.formState.privateIdentityRef;delete o.formState.faceDownPublic;return{ok:true,changed:previous!==face.id,previousFaceId:previous,currentFaceId:face.id,face:clone(face),incarnationId:o.incarnationId||null}
}
function normalizeObject(o={}){
 if(!o||typeof o!=='object')return o;let defs=definitions(o),s=o.formState&&typeof o.formState==='object'?o.formState:{};
 if(defs.length){s.definitions=defs;s.defaultFaceId=String(s.defaultFaceId||defs[0].id);s.currentFaceId=String(s.currentFaceId||s.defaultFaceId);s.layout=String(s.layout||o.layout||'');s.transformable=s.transformable===true||o.transformable===true||TRANSFORM_LAYOUTS.has(lc(s.layout));o.formState=s;if(!s.faceDown&&s.appliedFaceId!==s.currentFaceId)applyFace(o,s.currentFaceId,null,{clearMissingStats:false})}
 else if(Object.keys(s).length){s.visibility=String(s.visibility||'public');s.faceDown=!!s.faceDown;o.formState=s}
 return o
}
function characteristics(o={}){normalizeObject(o);return o}
function canTransform(o={}){normalizeObject(o);return !!o.formState?.transformable&&definitions(o).length>=2&&!o.formState?.faceDown}
function transform(o,event=null){
 if(!canTransform(o))return{ok:false,reason:o?.formState?.faceDown?'face-down-object-cannot-transform':'object-not-transformable',review:false};
 let defs=definitions(o),cur=String(o.formState.currentFaceId||defs[0].id),i=Math.max(0,defs.findIndex(f=>f.id===cur)),next=defs[(i+1)%defs.length];
 return applyFace(o,next.id,event,{orientation:next.id})
}
function setFaceDown(o,publicCharacteristics={},event=null,opts={}){
 if(!o)return{ok:false,reason:'object-missing',review:true};normalizeObject(o);let s=o.formState&&typeof o.formState==='object'?o.formState:{};s.resumeFaceId=s.faceDown?String(s.resumeFaceId||''):(s.currentFaceId?String(s.currentFaceId):null);s.faceDown=true;s.visibility='public-facedown';s.privateIdentityRef=opts.privateIdentityRef?String(opts.privateIdentityRef):null;s.changedAtSeq=Number(event?.seq||s.changedAtSeq||0);
 let p={name:String(publicCharacteristics.name||'Face-down permanent'),typeLine:String(publicCharacteristics.typeLine||publicCharacteristics.type||'Permanent'),oracleText:String(publicCharacteristics.oracleText||''),colors:list(publicCharacteristics.colors).slice(),subtypes:list(publicCharacteristics.subtypes||publicCharacteristics.sub).slice(),power:publicCharacteristics.power==null?null:String(publicCharacteristics.power),toughness:publicCharacteristics.toughness==null?null:String(publicCharacteristics.toughness),traits:publicCharacteristics.traits&&typeof publicCharacteristics.traits==='object'?clone(publicCharacteristics.traits):{}};
 s.faceDownPublic=clone(p);if(s.privateIdentityRef){s.definitions=[];delete o.faceDefinitions;delete o.faces;delete o.cardFaces;delete o.card_faces;s.currentFaceId=null;s.appliedFaceId=null;s.resumeFaceId=null;}o.formState=s;o.name=p.name;o.typeLine=p.typeLine;o.type=primaryType(p.typeLine);o.oracleText=p.oracleText;o.colors=p.colors;o.sub=p.subtypes;o.subtypes=p.subtypes;o.abilities=[];o.modifiers=[];o.continuousEffects=[];o.replacementEffects=[];o.combatMeta=o.combatMeta&&typeof o.combatMeta==='object'?o.combatMeta:{};o.combatMeta.power=p.power;o.combatMeta.toughness=p.toughness;o.combatMeta.traits=p.traits;return{ok:true,changed:true,faceDown:true,privateIdentityOpaque:!!s.privateIdentityRef,incarnationId:o.incarnationId||null}
}
function turnFaceUp(o,faceId=null,event=null){
 if(!o?.formState?.faceDown)return{ok:false,reason:'object-not-face-down',review:false};let defs=definitions(o),id=String(faceId||o.formState.resumeFaceId||o.formState.defaultFaceId||'');
 if(!defs.length||!defs.some(f=>f.id===id))return{ok:false,reason:'private-identity-reveal-required',review:true};
 return applyFace(o,id,event,{orientation:id})
}
function publicSnapshot(o={}){
 normalizeObject(o);let s=o.formState||{};return{id:o.id,incarnationId:o.incarnationId||null,name:o.name,type:o.type||primaryType(o.typeLine),typeLine:o.typeLine||'',oracleText:o.oracleText||'',colors:list(o.colors).slice(),subtypes:list(o.subtypes||o.sub).slice(),power:o.combatMeta?.power??null,toughness:o.combatMeta?.toughness??null,faceDown:!!s.faceDown,currentFaceId:s.faceDown?null:(s.currentFaceId||null),layout:s.layout||null,transformable:!!s.transformable}
}
function onZoneChange(o,toZone,payload={},event=null){
 if(!o)return{ok:false,reason:'object-missing',review:true};normalizeObject(o);let s=o.formState||{},defs=definitions(o);if(!Object.keys(s).length&&!defs.length)return{ok:true,changed:false};
 if(s.faceDown&&defs.length===0){s.faceDown=false;s.visibility='public';delete s.privateIdentityRef;delete s.faceDownPublic;o.formState=s;return{ok:false,reason:'private-identity-reveal-required',review:true}}
 if(defs.length){s.faceDown=false;s.visibility='public';let requested=payload.faceId||payload.enterFaceId||s.defaultFaceId||defs[0].id,r=applyFace(o,requested,event,{orientation:requested});r.zone=String(toZone||'');return r}
 return{ok:true,changed:false}
}
function statusLabel(o={}){normalizeObject(o);let s=o.formState||{};if(s.faceDown)return'FACE DOWN';let defs=definitions(o);if(defs.length>1){let f=currentFace(o),idx=Math.max(0,defs.findIndex(x=>x.id===f?.id));return (idx===0?'FRONT FACE':'FACE '+(idx+1))+(f?.name?' · '+f.name:'')}return''}
function localQA(engine){
 let c=[],q=(n,v)=>c.push([n,!!v]);if(!engine)return{ok:false,checks:[['engine supplied',false]]};
 let faces=[{id:'sun',name:'Dawn Form',typeLine:'Creature — Human',oracleText:'Vigilance',power:'2',toughness:'2',keywords:['Vigilance']},{id:'moon',name:'Night Form',typeLine:'Creature — Werewolf',oracleText:'Trample',power:'4',toughness:'4',keywords:['Trample']}];
 let st=engine.normalizeState({life:{1:40,2:40},battle:[{id:'dfc',name:'Dawn Form',owner:1,controllerId:1,typeLine:'Creature — Human',layout:'transform',faceDefinitions:faces,c:{'+1/+1':'2'},tapped:true}],events:[],snapshots:[],feed:[]}),o=st.battle[0],inc=o.incarnationId;
 q('multi-face object normalizes to declared front face',o.formState?.currentFaceId==='sun'&&o.name==='Dawn Form'&&o.combatMeta.power==='2');
 let e=engine.dispatch(st,'PERMANENT_TRANSFORMED',{objectId:'dfc'},1,{source:'qa'});o=st.battle[0];q('transform changes current characteristics',o.formState.currentFaceId==='moon'&&o.name==='Night Form'&&o.combatMeta.power==='4');
 q('transform preserves exact object/incarnation identity',o.id==='dfc'&&o.incarnationId===inc);
 q('transform preserves counters and tapped status',o.c['+1/+1']==='2'&&o.tapped===true);
 q('transform event is not a zone-change event',e.type==='PERMANENT_TRANSFORMED'&&e.phase98Result?.changed===true&&e.phase95Context?.pre?.battle?.[0]?.incarnationId===e.phase95Context?.post?.battle?.[0]?.incarnationId);
 if(root.MTGLayerEngine){let d=root.MTGLayerEngine.derived(st,o);q('layer engine reads current face as its base characteristics',d.name==='Night Form'&&d.typeLine.includes('Werewolf')&&d.power==='6')}else q('layer engine reads current face as its base characteristics',true);
 let gid=null;if(root.MTGLinkedAbilities){gid=engine.dispatch(st,'LINK_GROUP_CREATED',{sourceObjectId:'dfc',linkKey:'face-link'},1,{source:'qa'}).phase97Result?.record?.id;engine.dispatch(st,'PERMANENT_TRANSFORMED',{objectId:'dfc'},1,{source:'qa'});q('same-object face changes preserve linked-ability source identity',!!gid&&root.MTGLinkedAbilities.record(st,gid)?.sourceIncarnationId===inc)}else q('same-object face changes preserve linked-ability source identity',true);
 let down=engine.dispatch(st,'PERMANENT_FACE_DOWN_SET',{objectId:'dfc',publicCharacteristics:{name:'Public Face-down Form',typeLine:'Creature',power:'2',toughness:'2'}},1,{source:'qa'});o=st.battle[0];let pub=publicSnapshot(o);q('face-down state exposes only supplied public characteristics',down.phase98Result?.ok&&pub.faceDown&&pub.name==='Public Face-down Form'&&pub.power==='2'&&!('privateIdentityRef' in pub));
 let up=engine.dispatch(st,'PERMANENT_FACE_UP_SET',{objectId:'dfc',faceId:'sun'},1,{source:'qa'});o=st.battle[0];q('turning a public-known face up restores its face without a new incarnation',up.phase98Result?.ok&&o.name==='Dawn Form'&&o.incarnationId===inc);
 let secret=engine.normalizeState({battle:[{id:'secret',owner:1,controllerId:1,layout:'transform',faceDefinitions:faces}],events:[],snapshots:[],feed:[]});engine.dispatch(secret,'PERMANENT_FACE_DOWN_SET',{objectId:'secret',publicCharacteristics:{name:'Hidden Object',typeLine:'Creature',power:'2',toughness:'2'},privateIdentityRef:'owner-local-ref'},1,{source:'qa'});q('private face-down mode removes public face definitions instead of leaking identity',definitions(secret.battle[0]).length===0&&publicSnapshot(secret.battle[0]).name==='Hidden Object');
 engine.dispatch(st,'PERMANENT_FACE_SET',{objectId:'dfc',faceId:'moon'},1,{source:'qa'});let beforeZone=st.battle[0].incarnationId;engine.dispatch(st,'OBJECT_ZONE_CHANGED',{objectId:'dfc',toZone:'graveyard'},1,{source:'qa'});let gy=st.zones.graveyard.find(x=>x.id==='dfc');q('zone change resets known multi-face object to default face',gy?.formState?.currentFaceId==='sun'&&gy?.name==='Dawn Form');
 q('zone change still creates a new incarnation through Phase 95',gy?.incarnationId&&gy.incarnationId!==beforeZone);
 let copy=engine.normalizeState(JSON.parse(JSON.stringify(st))),gy2=copy.zones.graveyard.find(x=>x.id==='dfc');q('face/form state survives reconnect serialization',gy2?.formState?.currentFaceId==='sun'&&gy2?.formState?.definitions?.length===2);
 let hidden=engine.normalizeState({battle:[{id:'hidden',name:'Unknown Morph',owner:1,controllerId:1,formState:{faceDown:true,visibility:'public-facedown',privateIdentityRef:'opaque'},combatMeta:{power:'2',toughness:'2',traits:{}}}],events:[],snapshots:[],feed:[]});let hz=engine.dispatch(hidden,'OBJECT_ZONE_CHANGED',{objectId:'hidden',toZone:'graveyard'},1,{source:'qa'});q('unknown private identity routes reveal-on-zone-change to review instead of guessing',hz.phase98Result?.review===true);
 let ph=engine.normalizeState({battle:[{id:'phaseface',owner:1,controllerId:1,layout:'transform',faceDefinitions:faces}],events:[],snapshots:[],feed:[]}),pi=ph.battle[0].incarnationId;engine.dispatch(ph,'PERMANENT_TRANSFORMED',{objectId:'phaseface'},1,{source:'qa'});engine.dispatch(ph,'PERMANENT_PHASE_STATUS_SET',{objectId:'phaseface',status:'out'},1,{source:'qa'});engine.dispatch(ph,'PERMANENT_PHASE_STATUS_SET',{objectId:'phaseface',status:'in'},1,{source:'qa'});q('phasing preserves current face and incarnation',ph.battle[0].formState.currentFaceId==='moon'&&ph.battle[0].incarnationId===pi);
 q('version identifies Phase 98',VERSION.includes('phase98'));return{ok:c.every(x=>x[1]),checks:c}
}
return{VERSION,TRANSFORM_LAYOUTS,normalizeFace,definitions,faceById,currentFace,normalizeObject,characteristics,applyFace,canTransform,transform,setFaceDown,turnFaceUp,publicSnapshot,onZoneChange,statusLabel,localQA};
});
