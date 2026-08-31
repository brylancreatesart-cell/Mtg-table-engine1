
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSoloTest=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='solo-test-npc-runtime-2';
const FORMAT_RULES=Object.freeze({
  commander:{deckSize:100,commanderCount:1,startingLife:40,label:'Commander'},
  brawl:{deckSize:60,commanderCount:1,startingLife:25,label:'Brawl'},
  standard:{deckSize:60,commanderCount:0,startingLife:20,label:'Standard'},
  pioneer:{deckSize:60,commanderCount:0,startingLife:20,label:'Pioneer'},
  modern:{deckSize:60,commanderCount:0,startingLife:20,label:'Modern'},
  legacy:{deckSize:60,commanderCount:0,startingLife:20,label:'Legacy'},
  vintage:{deckSize:60,commanderCount:0,startingLife:20,label:'Vintage'},
  pauper:{deckSize:60,commanderCount:0,startingLife:20,label:'Pauper'}
});
function formatRules(format='commander'){let k=String(format||'commander').toLowerCase();return{format:k,...(FORMAT_RULES[k]||FORMAT_RULES.commander)}}
function clampOpponents(n){n=Number(n);if(!Number.isFinite(n))n=3;return Math.max(1,Math.min(3,Math.trunc(n)))}
function roomCode(seed=Date.now()){return 'solo-'+Number(seed).toString(36).slice(-6)}
function makePlayers(localPlayer={},opponents=3,npcProfiles=[]){
  opponents=clampOpponents(opponents);
  const p=[{id:1,r:1,connected:true,cid:'SOLO_LOCAL',name:localPlayer.name||'Player 1',commander:localPlayer.commander||null,avatarId:localPlayer.avatarId||null,deckName:localPlayer.deckName||'Local Deck',deckSize:Number(localPlayer.deckSize||100),commanderCount:Number(localPlayer.commanderCount||1),deckColorIdentity:Array.isArray(localPlayer.deckColorIdentity)?localPlayer.deckColorIdentity.slice():[],testSeat:false}];
  for(let i=0;i<opponents;i++){let q=npcProfiles[i]||{};p.push({id:i+2,r:1,connected:true,cid:'SOLO_BOT_'+(i+1),name:q.playerName||('NPC '+(i+1)),commander:q.commander||null,avatarId:q.avatarId||null,deckName:q.name||q.deckName||'Simulated Test Deck',deckSize:Number(q.deckSize||100),commanderCount:Number(q.commanderCount??(q.commander?1:0)),deckColorIdentity:Array.isArray(q.colors)?q.colors.slice():[],testSeat:true,npc:true,npcArchetype:q.id||null});}
  return p;
}
function seedState(state,players,{format='commander'}={}){
  const s=JSON.parse(JSON.stringify(state||{})),rules=formatRules(format);
  s.life=s.life||{};s.poison=s.poison||{};s.tax=s.tax||{};s.cmdCasts=s.cmdCasts||{};s.energy=s.energy||{};s.exp=s.exp||{};s.cmd=s.cmd||{};s.fallen=s.fallen||{};
  for(const p of players||[]){s.life[p.id]??=rules.startingLife;s.poison[p.id]??=0;s.tax[p.id]??=0;s.cmdCasts[p.id]??=0;s.energy[p.id]??=0;s.exp[p.id]??=0}
  s.turn=s.turn||1;s.active=s.active||1;s.phase=s.phase||'MAIN 1';s.meta=s.meta||{};s.meta.testMode=true;s.meta.testModeVersion=VERSION;s.meta.testFormat=rules.format;
  return s;
}
function isSoloRoom(room,state){return String(room||'').startsWith('solo-')||state?.meta?.testMode===true}
function seat(players,id){return (players||[]).find(p=>Number(p.id)===Number(id))||null}
function virtualSeats(players){return (players||[]).filter(p=>p.testSeat===true)}
function shouldPersistMatch(room,state){return !isSoloRoom(room,state)}
return{VERSION,FORMAT_RULES,formatRules,clampOpponents,roomCode,makePlayers,seedState,isSoloRoom,seat,virtualSeats,shouldPersistMatch};
});
