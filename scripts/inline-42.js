
/* Phase 99 — Morph, Megamorph, Disguise, Manifest & Cloak: privacy-safe face-down state machines and turn-face-up special actions. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGFaceDownMechanics=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const VERSION='phase99-facedown-special-actions-1';
const MECHANISMS=new Set(['morph','megamorph','disguise','manifest','cloak']);
const CAST_MECHANISMS=new Set(['morph','megamorph','disguise']);
const WARD_MECHANISMS=new Set(['disguise','cloak']);
const clone=x=>JSON.parse(JSON.stringify(x));
const lc=v=>String(v||'').trim().toLowerCase();
const list=v=>Array.isArray(v)?v:[];
function mechanism(v){let m=lc(v);return MECHANISMS.has(m)?m:null}
function publicProfile(raw='morph'){
 let m=mechanism(raw)||'morph',ward=WARD_MECHANISMS.has(m);
 return{name:'',displayName:'Face-down creature',rulesName:'',type:'Creature',typeLine:'Creature',oracleText:ward?'Ward {2}':'',manaCost:'',colors:[],subtypes:[],power:'2',toughness:'2',traits:{},wardCost:ward?'{2}':null}
}
function castPublicCard(raw='morph'){
 let m=mechanism(raw);if(!CAST_MECHANISMS.has(m))return null;let p=publicProfile(m);
 // {3} is the public alternative casting cost; the spell's rules characteristics still have no mana cost.
 return{n:'Face-down creature spell',rulesName:'',displayName:'Face-down creature spell',typeLine:'Creature',oracleText:p.oracleText,manaCost:'{3}',colors:[],subtypes:[],keywords:WARD_MECHANISMS.has(m)?['Ward']:[],resolved:true,faceDownRulesManaCost:''}
}
function stackPublicCard(raw='morph'){
 let m=mechanism(raw),p=publicProfile(m);if(!CAST_MECHANISMS.has(m))return null;
 return{n:'Face-down creature spell',rulesName:'',displayName:'Face-down creature spell',typeLine:'Creature',oracleText:p.oracleText,manaCost:'',colors:[],subtypes:[],keywords:WARD_MECHANISMS.has(m)?['Ward']:[],resolved:true}
}
function normalizePublicState(o={}){
 let f=o.faceDownState;if(!f||typeof f!=='object')return o;let m=mechanism(f.mechanism);if(!m){delete o.faceDownState;return o}
 o.faceDownState={active:f.active!==false,mechanism:m,origin:String(f.origin||''),castFaceDown:!!f.castFaceDown,enteredFaceDown:!!f.enteredFaceDown,wardCost:WARD_MECHANISMS.has(m)?'{2}':null,publicSequence:Math.max(0,Number(f.publicSequence||0)),revealRequiredOnExit:f.revealRequiredOnExit!==false,privateIdentityRef:f.privateIdentityRef?String(f.privateIdentityRef):null,turnUpRoute:f.turnUpRoute?String(f.turnUpRoute):null,xValue:f.xValue==null?null:Number(f.xValue)};
 return o
}
function faceDownState(raw='morph',opts={}){let m=mechanism(raw);if(!m)return null;return{active:true,mechanism:m,origin:String(opts.origin||(CAST_MECHANISMS.has(m)?'cast-face-down':m)),castFaceDown:!!opts.castFaceDown,enteredFaceDown:opts.enteredFaceDown!==false,wardCost:WARD_MECHANISMS.has(m)?'{2}':null,publicSequence:Math.max(0,Number(opts.publicSequence||0)),revealRequiredOnExit:true,privateIdentityRef:opts.privateIdentityRef?String(opts.privateIdentityRef):null,turnUpRoute:null,xValue:null}}
function applyFaceDown(o,raw,event=null,opts={}){
 if(!o)return{ok:false,reason:'object-missing',review:true};let m=mechanism(raw);if(!m)return{ok:false,reason:'unsupported-face-down-mechanism',review:true};let p=publicProfile(m),fd=faceDownState(m,opts);o.faceDownState=fd;
 let r=root.MTGCardForms?.setFaceDown?root.MTGCardForms.setFaceDown(o,{name:p.name,typeLine:p.typeLine,oracleText:p.oracleText,colors:p.colors,subtypes:p.subtypes,power:p.power,toughness:p.toughness,traits:p.traits},event,{privateIdentityRef:opts.privateIdentityRef}):{ok:false,reason:'card-form-kernel-missing',review:true};
 if(r.ok){o.name='';o.displayName=p.displayName;o.rulesName='';o.manaCost='';if(o.formState?.faceDownPublic)o.formState.faceDownPublic.name='';normalizePublicState(o)}return{...r,mechanism:m,wardCost:p.wardCost,faceDownState:clone(o.faceDownState||fd)}
}
function makePermanent(info={},event=null){
 let m=mechanism(info.mechanism);if(!m)return{ok:false,reason:'unsupported-face-down-mechanism',review:true};let id=String(info.objectId||('facedown_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8))),owner=Number(info.ownerId??info.owner??info.controllerId??0)||0,controller=Number(info.controllerId??owner)||owner;
 let o={id,name:'',displayName:'Face-down creature',rulesName:'',owner,controllerId:controller,type:'Creature',typeLine:'Creature',oracleText:'',colors:[],sub:[],subtypes:[],manaCost:'',q:'1',combatMeta:{power:'2',toughness:'2',traits:{}},c:{},tapped:false};let r=applyFaceDown(o,m,event,{origin:info.origin||m,castFaceDown:!!info.castFaceDown,enteredFaceDown:true,privateIdentityRef:info.privateIdentityRef,publicSequence:info.publicSequence});return{...r,object:o}
}
function parseTurnUpAbilities(reveal={}){
 let text=[String(reveal.oracleText||reveal.oracle_text||''),...list(reveal.faces||reveal.cardFaces||reveal.card_faces).map(f=>String(f.oracleText||f.oracle_text||''))].filter(Boolean).join('\n'),out=[];
 let re=/(?:^|\n)\s*(Morph|Megamorph|Disguise)\s+([^\n]+)/ig,m;while((m=re.exec(text))){let kind=lc(m[1]),cost=String(m[2]||'').trim().replace(/\s*\([^)]*\)\s*$/,'').trim();if(cost)out.push({route:kind,cost})}return out
}
function normalizedReveal(reveal={}){let c=root.MTGDeckEngine?.normalizeCard?root.MTGDeckEngine.normalizeCard(reveal):clone(reveal);return{...c,n:String(c.n||c.name||''),name:String(c.n||c.name||''),typeLine:String(c.typeLine||c.type_line||''),oracleText:String(c.oracleText||c.oracle_text||''),manaCost:String(c.manaCost||c.mana_cost||''),faces:list(c.faces||c.cardFaces||c.card_faces).map(clone)}}
function isCreatureCard(c={}){return /(?:^|\W)Creature(?:$|\W)/i.test(String(c.typeLine||''))}
function turnUpRoutes(reveal={},originMechanism=null){let c=normalizedReveal(reveal),abilities=parseTurnUpAbilities(c),routes=[];for(const a of abilities)routes.push({...a,source:'ability'});let m=mechanism(originMechanism);if((m==='manifest'||m==='cloak')&&isCreatureCard(c)&&String(c.manaCost||'').trim())routes.push({route:m,cost:String(c.manaCost),source:'manifest-cloak-mana-cost'});let seen=new Set();return routes.filter(r=>{let k=r.route+'|'+r.cost;if(seen.has(k))return false;seen.add(k);return true})}
function routeAllowed(o,reveal={},route=''){
 let fd=o?.faceDownState||{},m=mechanism(fd.mechanism),want=lc(route),routes=turnUpRoutes(reveal,m),hit=routes.find(r=>r.route===want);if(!hit)return{ok:false,reason:'turn-face-up-route-not-proven',review:true,routes};
 if(CAST_MECHANISMS.has(m)&&want!==m){ // A face-down spell cast specifically via Morph/Megamorph/Disguise must prove that ability route.
   let exact=routes.find(r=>r.route===m);if(!exact)return{ok:false,reason:'cast-face-down-ability-not-proven',review:true,routes};
 }
 return{ok:true,route:want,cost:hit.cost,source:hit.source,routes}
}
function revealDefinitions(c={}){
 let faces=list(c.faces).length?list(c.faces):[{id:'face-0',name:c.n||c.name||'Revealed card',oracleText:c.oracleText||'',typeLine:c.typeLine||'',manaCost:c.manaCost||'',colors:list(c.colors),power:c.power??null,toughness:c.toughness??null,loyalty:c.loyalty??null,defense:c.defense??null,subtypes:list(c.subtypes),keywords:list(c.keywords)}];return faces.map((f,i)=>root.MTGCardForms?.normalizeFace?root.MTGCardForms.normalizeFace(f,i):clone(f))
}
function installReveal(o,reveal={},event=null){
 let c=normalizedReveal(reveal),defs=revealDefinitions(c);if(!String(c.n||'').trim()||!String(c.typeLine||'').trim())return{ok:false,reason:'revealed-card-data-incomplete',review:true};
 o.faceDefinitions=defs;o.formState=o.formState&&typeof o.formState==='object'?o.formState:{};o.formState.definitions=defs;o.formState.defaultFaceId=String(defs[0]?.id||'face-0');o.formState.currentFaceId=o.formState.defaultFaceId;o.formState.resumeFaceId=o.formState.defaultFaceId;o.formState.faceDown=true;o.formState.visibility='public-facedown';
 let r=root.MTGCardForms?.turnFaceUp?root.MTGCardForms.turnFaceUp(o,o.formState.defaultFaceId,event):{ok:false,reason:'card-form-kernel-missing',review:true};return{...r,reveal:c}
}
function turnFaceUpSpecial(state,o,reveal,event=null,opts={}){
 if(!o?.faceDownState?.active||!o?.formState?.faceDown)return{ok:false,reason:'object-not-tracked-face-down',review:false};let beforeInc=o.incarnationId||null,allowed=routeAllowed(o,reveal,opts.route||o.faceDownState.mechanism);if(!allowed.ok)return allowed;if(opts.paymentConfirmed!==true)return{ok:false,reason:'turn-face-up-cost-not-confirmed',review:false,cost:allowed.cost,route:allowed.route};if(/\{X\}/i.test(allowed.cost)&&!(Number.isFinite(Number(opts.xValue))&&Number(opts.xValue)>=0))return{ok:false,reason:'turn-face-up-x-value-required',review:false,cost:allowed.cost,route:allowed.route};
 let r=installReveal(o,reveal,event);if(!r.ok)return r;let wasMegamorph=allowed.route==='megamorph';if(wasMegamorph){o.c=o.c&&typeof o.c==='object'?o.c:{};let key='+1/+1';try{o.c[key]=(BigInt(String(o.c[key]||0))+1n).toString()}catch{o.c[key]='1'}}
 o.faceDownState={...o.faceDownState,active:false,turnUpRoute:allowed.route,xValue:opts.xValue==null?null:Number(opts.xValue),revealedAtSeq:Number(event?.seq||0)};delete o.faceDownState.privateIdentityRef;delete o.formState.privateIdentityRef;o.displayName=o.name||'Revealed permanent';return{ok:true,changed:true,route:allowed.route,cost:allowed.cost,megamorphCounter:wasMegamorph,incarnationPreserved:(o.incarnationId||null)===beforeInc,incarnationId:o.incarnationId||null,reveal:root.MTGCardForms?.publicSnapshot?root.MTGCardForms.publicSnapshot(o):null}
}
function revealForZoneChange(o,reveal,event=null){
 if(!o?.faceDownState?.active||!o?.formState?.faceDown)return{ok:true,changed:false};let c=normalizedReveal(reveal);if(!String(c.n||'').trim()||!String(c.typeLine||'').trim())return{ok:false,reason:'face-down-zone-exit-reveal-required',review:true};let defs=revealDefinitions(c);o.faceDefinitions=defs;o.formState=o.formState&&typeof o.formState==='object'?o.formState:{};o.formState.definitions=defs;o.formState.defaultFaceId=String(defs[0]?.id||'face-0');o.formState.currentFaceId=o.formState.defaultFaceId;o.formState.resumeFaceId=o.formState.defaultFaceId;delete o.formState.privateIdentityRef;o.faceDownState={...o.faceDownState,active:false,revealedForZoneExit:true,revealedAtSeq:Number(event?.seq||0)};delete o.faceDownState.privateIdentityRef;return{ok:true,changed:true,revealedForZoneExit:true,name:c.n||c.name||'',definitions:defs.length}
}
function statusLabel(o={}){let f=o.faceDownState;if(!f?.active)return'';let m=mechanism(f.mechanism);return m?(m.toUpperCase()+' · FACE DOWN'):'FACE DOWN'}
function localQA(engine){
 let c=[],q=(n,v)=>c.push([n,!!v]);if(!engine)return{ok:false,checks:[['engine supplied',false]]};
 q('Morph public profile is colorless nameless 2/2 creature',(()=>{let p=publicProfile('morph');return p.name===''&&p.typeLine==='Creature'&&p.power==='2'&&p.toughness==='2'&&!p.oracleText})());
 q('Disguise public profile includes Ward 2',publicProfile('disguise').oracleText==='Ward {2}');q('Cloak public profile includes Ward 2',publicProfile('cloak').oracleText==='Ward {2}');
 q('face-down casting helper exposes public {3} payment but no rules mana cost on stack',castPublicCard('morph').manaCost==='{3}'&&stackPublicCard('morph').manaCost==='');
 let st=engine.normalizeState({life:{1:40,2:40},battle:[],events:[],snapshots:[],feed:[]}),en=engine.dispatch(st,'FACE_DOWN_PERMANENT_ENTERED',{objectId:'m1',ownerId:1,controllerId:1,mechanism:'manifest',privateIdentityRef:'opaque-ref'},1,{source:'qa'}),o=st.battle.find(x=>x.id==='m1'),inc=o?.incarnationId;
 q('manifest enters as public face-down 2/2 with opaque identity',en.phase99Result?.ok&&o?.formState?.faceDown&&o?.combatMeta?.power==='2'&&o?.name===''&&o?.faceDownState?.mechanism==='manifest');
 q('private face-down object exposes no card definitions',root.MTGCardForms?.definitions(o).length===0);
 let bad=engine.dispatch(st,'PERMANENT_FACE_UP_SPECIAL_ACTION',{objectId:'m1',reveal:{n:'Mystery Land',typeLine:'Land',manaCost:'',oracleText:''},route:'manifest',paymentConfirmed:true},1,{source:'qa'});q('manifest normal turn-up rejects noncreature/no-mana-cost card',bad.phase99Result?.review===true&&o.formState.faceDown===true);
 let reveal={n:'Hidden Bear',typeLine:'Creature — Bear',manaCost:'{2}{G}',oracleText:'When this creature is turned face up, you gain 1 life.'};let up=engine.dispatch(st,'PERMANENT_FACE_UP_SPECIAL_ACTION',{objectId:'m1',reveal,route:'manifest',paymentConfirmed:true},1,{source:'qa'});o=st.battle.find(x=>x.id==='m1');q('manifest creature turns face up through mana-cost special action',up.phase99Result?.ok&&o.name==='Hidden Bear'&&!o.formState.faceDown);q('turn-face-up special action preserves incarnation',o.incarnationId===inc&&up.phase99Result?.incarnationPreserved===true);
 q('turned-face-up Oracle trigger compiles',o.abilities?.some(a=>a.event==='TURNED_FACE_UP'&&a.when?.self));
 let desc=root.MTGTableObserver?.descriptors(up,{},st)||[];q('observer emits TURNED_FACE_UP but no ETB for special action',desc.some(d=>d.event==='TURNED_FACE_UP')&&!desc.some(d=>d.event==='PERMANENT_ENTERED'));
 let mm=engine.normalizeState({battle:[],events:[],snapshots:[],feed:[]});engine.dispatch(mm,'FACE_DOWN_PERMANENT_ENTERED',{objectId:'mm',ownerId:1,controllerId:1,mechanism:'megamorph',privateIdentityRef:'mm-ref'},1,{source:'qa'});let mmr=engine.dispatch(mm,'PERMANENT_FACE_UP_SPECIAL_ACTION',{objectId:'mm',reveal:{n:'Mega',typeLine:'Creature',manaCost:'{3}',oracleText:'Megamorph {2}{G}'},route:'megamorph',paymentConfirmed:true},1,{source:'qa'});q('Megamorph adds exactly one +1/+1 counter as it turns face up',mmr.phase99Result?.ok&&mm.battle[0].c?.['+1/+1']==='1');
 let dis=engine.normalizeState({battle:[],events:[],snapshots:[],feed:[]});engine.dispatch(dis,'FACE_DOWN_PERMANENT_ENTERED',{objectId:'d',ownerId:1,controllerId:1,mechanism:'disguise',privateIdentityRef:'d-ref'},1,{source:'qa'});q('Disguise face-down object feeds Ward text to targeting engine',dis.battle[0].oracleText==='Ward {2}');let dr=engine.dispatch(dis,'PERMANENT_FACE_UP_SPECIAL_ACTION',{objectId:'d',reveal:{n:'Sneak',typeLine:'Creature',manaCost:'{4}',oracleText:'Disguise {1}{U}'},route:'disguise',paymentConfirmed:true},1,{source:'qa'});q('Disguise route proves its own printed turn-up ability',dr.phase99Result?.ok&&dr.phase99Result.route==='disguise');
 let mz=engine.normalizeState({battle:[],events:[],snapshots:[],feed:[]});engine.dispatch(mz,'FACE_DOWN_PERMANENT_ENTERED',{objectId:'z',ownerId:1,controllerId:1,mechanism:'cloak',privateIdentityRef:'z-ref'},1,{source:'qa'});let zi=mz.battle[0].incarnationId,z=engine.dispatch(mz,'OBJECT_ZONE_CHANGED',{objectId:'z',toZone:'graveyard',reveal:{n:'Exit Bear',typeLine:'Creature — Bear',manaCost:'{1}{G}',oracleText:''}},1,{source:'qa'}),gy=mz.zones.graveyard.find(x=>x.id==='z');q('face-down zone exit can reveal identity without a turned-face-up event',z.phase99ZoneReveal?.ok&&gy?.name==='Exit Bear');q('face-down zone exit still creates a new incarnation',gy?.incarnationId&&gy.incarnationId!==zi);q('zone-exit LKI retains pre-event face-down public characteristics',z.phase95Context?.pre?.battle?.some(x=>x.id==='z'&&x.formState?.faceDown===true));
 let copy=engine.normalizeState(JSON.parse(JSON.stringify(dis)));q('face-down mechanism state survives reconnect serialization',copy.battle[0]?.faceDownState?.mechanism==='disguise'||copy.battle[0]?.name==='Sneak');q('version identifies Phase 99',VERSION.includes('phase99'));return{ok:c.every(x=>x[1]),checks:c}
}
return{VERSION,MECHANISMS,CAST_MECHANISMS,WARD_MECHANISMS,mechanism,publicProfile,castPublicCard,stackPublicCard,normalizePublicState,faceDownState,applyFaceDown,makePermanent,parseTurnUpAbilities,normalizedReveal,isCreatureCard,turnUpRoutes,routeAllowed,revealDefinitions,installReveal,turnFaceUpSpecial,revealForZoneChange,statusLabel,localQA};
});
