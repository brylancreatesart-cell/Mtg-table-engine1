
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGEventInput=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase55-event-input-1';
const TYPES=Object.freeze([
 {id:'combat',label:'Combat Damage',event:'damage'},
 {id:'commander',label:'Commander Damage',event:'damage',commander:true},
 {id:'spell',label:'Spell / Ability',event:'damage'},
 {id:'life-loss',label:'Life Loss',event:'lifeLoss'}
]);
const QUICK_AMOUNTS=Object.freeze([1,2,3,5,10]);
function normalizeAmount(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null}
function type(id){return TYPES.find(x=>x.id===String(id))||TYPES[0]}
function commandFor({typeId='combat',amount,sourcePlayerId,targetPlayerId,sourceCommanderId=null}={}){const t=type(typeId),n=normalizeAmount(amount),src=Number(sourcePlayerId),def=Number(targetPlayerId);if(!n||!src||!def)return null;if(t.event==='lifeLoss')return{command:'lifeLoss',targetId:def,payload:{from:src,amount:n}};return{command:'damage',targetId:def,payload:{from:src,amount:n,isCommander:!!t.commander,sourceCommanderId:t.commander?(sourceCommanderId||('player:'+src)):null,damageType:t.id==='spell'?'spell':'combat'}}}
function resourceSpec(key){const k=String(key||'');const known={life:{label:'Life',min:null},poison:{label:'Poison',min:0},tax:{label:'Commander Tax',min:0},cmdCasts:{label:'Commander Casts',min:0},energy:{label:'Energy',min:0},exp:{label:'Experience',min:0},storm:{label:'Storm',min:0}};return known[k]||{label:k||'Resource',min:0}}
function localQA(){const checks=[];checks.push(['quick amounts stay concise',JSON.stringify(QUICK_AMOUNTS)==='[1,2,3,5,10]']);checks.push(['combat event maps to authoritative damage',commandFor({typeId:'combat',amount:7,sourcePlayerId:1,targetPlayerId:2}).payload.damageType==='combat']);checks.push(['commander event carries commander identity',commandFor({typeId:'commander',amount:12,sourcePlayerId:1,targetPlayerId:2,sourceCommanderId:'giada'}).payload.sourceCommanderId==='giada']);checks.push(['commander event marks commander damage',commandFor({typeId:'commander',amount:12,sourcePlayerId:1,targetPlayerId:2}).payload.isCommander===true]);checks.push(['spell event is not commander damage',commandFor({typeId:'spell',amount:4,sourcePlayerId:1,targetPlayerId:2}).payload.isCommander===false]);checks.push(['life loss uses distinct authoritative command',commandFor({typeId:'life-loss',amount:3,sourcePlayerId:1,targetPlayerId:2}).command==='lifeLoss']);checks.push(['invalid amount is rejected',commandFor({typeId:'combat',amount:0,sourcePlayerId:1,targetPlayerId:2})===null]);checks.push(['poison resource cannot go below zero by policy',resourceSpec('poison').min===0]);return{ok:checks.every(x=>x[1]),checks}}
return{VERSION,TYPES,QUICK_AMOUNTS,normalizeAmount,type,commandFor,resourceSpec,localQA};
});

