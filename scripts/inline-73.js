
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGPlayerPages=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase61-mobile-hud-pages-1';
const PAGES=Object.freeze(['home','battlefield','log']);
function normalizePage(v){v=String(v||'home').toLowerCase();return PAGES.includes(v)?v:'home'}
function controllerId(o={}){return Number(o.controllerId??o.owner??0)}
function battlefieldFor(state={},playerId=null){const all=Array.isArray(state.battle)?state.battle:[];if(playerId==null||playerId==='all')return all.slice();const id=Number(playerId);return all.filter(o=>controllerId(o)===id)}
function playerTabs(players=[],viewerId){return players.filter(p=>p&&p.connected!==false).map(p=>({id:Number(p.id),name:String(p.name||('Player '+p.id)),self:Number(p.id)===Number(viewerId)}))}
function publicCardSnapshot(o={}){return{id:String(o.id||''),name:String(o.name||'Unknown Card'),owner:Number(o.owner||0),controllerId:controllerId(o),tapped:!!o.tapped,quantity:String(o.q||'1'),counters:{...(o.c||{})},token:!!o.token,type:String(o.type||'Permanent'),sub:Array.isArray(o.sub)?o.sub.slice():[]}}
function scryfallNamedUrl(name){return'https://api.scryfall.com/cards/named?exact='+encodeURIComponent(String(name||''))}
function localQA(){
 const st={battle:[{id:'a',name:'A',owner:1},{id:'b',name:'B',owner:2,controllerId:3},{id:'c',name:'C',owner:3}]};
 const players=[{id:1,name:'One'},{id:2,name:'Two'},{id:3,name:'Three'}];
 const checks=[];
 checks.push(['home page accepted',normalizePage('home')==='home']);
 checks.push(['battlefield page accepted',normalizePage('battlefield')==='battlefield']);
 checks.push(['log page accepted',normalizePage('log')==='log']);
 checks.push(['invalid page falls back home',normalizePage('bad')==='home']);
 checks.push(['battlefield filters by controller',battlefieldFor(st,3).map(x=>x.id).join(',')==='b,c']);
 checks.push(['owner does not override changed controller',!battlefieldFor(st,2).some(x=>x.id==='b')]);
 checks.push(['all battlefield preserves objects',battlefieldFor(st,'all').length===3]);
 checks.push(['player tabs include viewer',playerTabs(players,1).find(x=>x.id===1).self===true]);
 checks.push(['public card snapshot excludes abilities/private deck fields',!Object.prototype.hasOwnProperty.call(publicCardSnapshot(st.battle[0]),'abilities')]);
 checks.push(['public card snapshot keeps public card name',publicCardSnapshot(st.battle[0]).name==='A']);
 checks.push(['Scryfall lookup uses exact public name',scryfallNamedUrl('Sol Ring').includes('exact=Sol%20Ring')]);
 checks.push(['module version identifies Phase 61',VERSION.includes('phase61')]);
 return{ok:checks.every(x=>x[1]),checks};
}

return{VERSION,PAGES,normalizePage,controllerId,battlefieldFor,playerTabs,publicCardSnapshot,scryfallNamedUrl,localQA};
});

