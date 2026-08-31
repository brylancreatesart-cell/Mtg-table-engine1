
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSoloNPC=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='solo-npc-simulation-2';
const clone=x=>JSON.parse(JSON.stringify(x));
const BASIC={W:['Plains','Ivory Field'],U:['Island','Mistwater Isle'],B:['Swamp','Gravefen'],R:['Mountain','Cinder Ridge'],G:['Forest','Briarwood']};
const ARCHETYPES=Object.freeze([
 {id:'dawnguard',name:'Dawnguard Bastion',commander:'Seraph of Highcrest',colors:['W'],creatures:['Dawnshield Knight','Ivory Sentinel','Sunspire Captain','Lionguard Veteran'],spells:['Radiant Muster','Bastion Oath','Silver Judgment']},
 {id:'tideglass',name:'Tideglass Conclave',commander:'Maris of Deepwater',colors:['U'],creatures:['Mistwing Adept','Tideglass Seer','Mooncurrent Drake','Harbor Savant'],spells:['Veil of Tides','Stormglass Insight','Deepwater Denial']},
 {id:'gravecourt',name:'Gravecourt Covenant',commander:'Veyra of Hollow Crown',colors:['B'],creatures:['Gravefen Stalker','Nightcourt Adept','Obsidian Reaver','Raven Cryptkeeper'],spells:['Hollow Bargain','Dread March','Gravecourt Edict']},
 {id:'emberline',name:'Emberline Raiders',commander:'Kael of Ashen Ridge',colors:['R'],creatures:['Cinderblade Raider','Emberline Duelist','Crimson Ravager','Thunderpass Berserker'],spells:['Ashfall Volley','Cinder Rush','Crimson Reckoning']},
 {id:'thornwild',name:'Thornwild Stampede',commander:'Orun of Briar Vale',colors:['G'],creatures:['Briarhide Beast','Thornwild Hunter','Oakheart Ancient','Wolfpine Stalker'],spells:['Verdant Surge','Wildroot Growth','Briarwood Charge']},
 {id:'skybound',name:'Skybound Accord',commander:'Aestra of Silverwatch',colors:['W','U'],creatures:['Skywatch Griffin','Silvermist Warden','Cloudcourt Arbiter','Aetherwing Scout'],spells:['Moonlit Decree','Highcrest Forecast','Tidebound Verdict']},
 {id:'nightwater',name:'Nightwater Intrigue',commander:'Sorinax of Blackwater',colors:['U','B'],creatures:['Nightwater Spy','Duskfin Adept','Hollowmist Shade','Mooncrypt Agent'],spells:['Blackwater Scheme','Veiled Ambition','Drown in Silence']},
 {id:'cindercrypt',name:'Cindercrypt Raiders',commander:'Raska of Ember Hollow',colors:['B','R'],creatures:['Cindercrypt Marauder','Ashgrave Hound','Bloodridge Cutthroat','Embercrypt Witch'],spells:['Grim Detonation','Bloodfire Pact','Cindercrypt Raid']},
 {id:'wildfire',name:'Wildfire Stampede',commander:'Ruun of Stormroot',colors:['R','G'],creatures:['Stormroot Charger','Wildfire Tusker','Emberhide Wolf','Thundervine Brute'],spells:['Rootfire Surge','Stormfall Charge','Cinderbloom']},
 {id:'sunroot',name:'Sunroot Conclave',commander:'Elyra of Dawnwood',colors:['G','W'],creatures:['Sunroot Guardian','Dawnwood Stag','Briarcrest Paladin','Verdant Lion'],spells:['Sacred Growth','Silverwood Muster','Dawnroot Blessing']},
 {id:'ashenbasilica',name:'Ashen Basilica',commander:'Mara of Ivory Crypt',colors:['W','B'],creatures:['Basilica Warden','Ashen Cleric','Ivory Revenant','Gravecrown Templar'],spells:['Solemn Verdict','Ashen Rite','Crown of Dust']},
 {id:'stormforge',name:'Stormforge Arsenal',commander:'Talin of Thunder Reach',colors:['U','R'],creatures:['Stormforge Savant','Thundercoil Drake','Cinderwave Adept','Mistflare Mage'],spells:['Stormglass Burst','Arc of Cinders','Thunder Reach']},
 {id:'rotbloom',name:'Rotbloom Brood',commander:'Morr of Thornfen',colors:['B','G'],creatures:['Rotbloom Horror','Thornfen Shambler','Gravevine Beast','Mirewood Stalker'],spells:['Mireborn Growth','Gravebloom Pact','Rotwood Hunger']},
 {id:'bannerfire',name:'Bannerfire Legion',commander:'Auren of Crimson Gate',colors:['R','W'],creatures:['Bannerfire Captain','Crimson Lancer','Sunscar Veteran','Emberguard Knight'],spells:['Legion Charge','Sunfire Volley','Crimson Standard']},
 {id:'mistwood',name:'Mistwood Evolution',commander:'Nym of Starfall Grove',colors:['G','U'],creatures:['Mistwood Sage','Starfall Serpent','Grovewing Adept','Tidebark Ancient'],spells:['Evolve Beyond','Mistwood Insight','Starfall Growth']},
 {id:'prismatic',name:'Prismatic Dominion',commander:'Axiom of Five Roads',colors:['W','U','B','R','G'],creatures:['Prismatic Warden','Five-Roads Envoy','Chromatic Behemoth','Nexus Sentinel'],spells:['Convergence','Prismatic Accord','Dominion Surge']}
]);
function hash(v){let h=2166136261>>>0;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hash(seed)||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function rules(format){return globalThis.MTGSoloTest?.formatRules?.(format)||{format:'commander',deckSize:100,commanderCount:1,startingLife:40,label:'Commander'}}
function profileFor(a,format,index){let x=clone(a),r=rules(format);x.deckSize=r.deckSize;x.commanderCount=r.commanderCount;x.commander=r.commanderCount?x.commander:null;x.playerName='NPC '+(index+1);return x}
function pickProfiles(format,count,seed=Date.now()){let r=rng(String(seed)+':profiles:'+format),pool=shuffle(ARCHETYPES,r),out=[];for(let i=0;i<count;i++)out.push(profileFor(pool[i%pool.length],format,i));return out}
function landName(colors,i){let c=colors[i%Math.max(1,colors.length)]||'W',a=BASIC[c]||BASIC.W;return a[i%a.length]}
function landType(colors,i){let c=colors[i%Math.max(1,colors.length)]||'W',m={W:'Plains',U:'Island',B:'Swamp',R:'Mountain',G:'Forest'};return 'Basic Land — '+(m[c]||'Plains')}
function cardId(owner,seed,i){return 'npc_'+owner+'_'+hash(seed+':'+i).toString(36)+'_'+i}
function makeCard(profile,owner,seed,i,kind){let r=rng(seed+':card:'+i),colors=profile.colors.slice(),id=cardId(owner,seed,i),mv=kind==='land'?0:Math.max(1,Math.min(7,1+Math.floor(r()*6))),name,typeLine,oracleText='',combatMeta=null;if(kind==='land'){name=landName(colors,i);typeLine=landType(colors,i)}else if(kind==='creature'){let base=profile.creatures[i%profile.creatures.length];name=base+(i>=profile.creatures.length?' '+(Math.floor(i/profile.creatures.length)+1):'');typeLine='Creature — Warrior';let p=Math.max(1,Math.min(7,Math.ceil(mv*.72+r()*2))),t=Math.max(1,Math.min(8,Math.ceil(mv*.78+r()*2)));combatMeta={power:String(p),toughness:String(t),traits:{}};if(r()>.84)combatMeta.traits.flying=true;if(r()>.9)combatMeta.traits.trample=true;if(r()>.93)combatMeta.traits.vigilance=true}else if(kind==='permanent'){name=(profile.name.split(' ')[0]||'Ancient')+' Relic '+((i%7)+1);typeLine=r()>.5?'Artifact':'Enchantment'}else{let base=profile.spells[i%profile.spells.length];name=base+(i>=profile.spells.length?' '+(Math.floor(i/profile.spells.length)+1):'');typeLine=r()>.45?'Instant':'Sorcery';let fx=i%4;oracleText=fx===0?'Draw a card.':fx===1?'You gain 3 life.':fx===2?'Create two 1/1 creature tokens.':'You gain 2 life.'}
 return{id,name:norm(name),n:norm(name),owner,controllerId:owner,type:typeLine.split(/\s|—/)[0],typeLine,colors,manaValue:mv,manaCost:manaCost(colors,mv),oracleText,q:'1',c:{},tapped:false,...(combatMeta?{combatMeta}:{}),soloNpcCard:true};}
function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
function manaCost(colors,mv){if(!mv)return'';let c=colors[0]||'C';if(c==='C')return'{'+mv+'}';return mv<=1?'{'+c+'}':'{'+(mv-1)+'}{'+c+'}'}
function buildDeck(format,profile,owner,seed){let r=rules(format),librarySize=r.deckSize-r.commanderCount,lands=Math.round(librarySize*(r.deckSize>=100?.37:.40)),creatures=Math.round(librarySize*.34),permanents=Math.round(librarySize*.10),cards=[];for(let i=0;i<librarySize;i++){let kind=i<lands?'land':i<lands+creatures?'creature':i<lands+creatures+permanents?'permanent':'spell';cards.push(makeCard(profile,owner,seed,i,kind))}let rr=rng(seed+':shuffle:'+owner),library=shuffle(cards,rr),commander=null;if(r.commanderCount){commander={id:'npc_cmd_'+owner+'_'+hash(seed).toString(36),name:profile.commander,n:profile.commander,owner,controllerId:owner,type:'Creature',typeLine:'Legendary Creature — Avatar',colors:profile.colors.slice(),manaValue:4,manaCost:manaCost(profile.colors,4),oracleText:'',q:'1',c:{},tapped:false,combatMeta:{power:'4',toughness:'4',traits:{}},isCommander:true,commanderOwnerId:owner,commanderId:'player_'+owner+'_commander_1',commanderName:profile.commander,soloNpcCard:true};}return{library,commander}}
function ensureZones(state){state.zones??={};for(const z of ['hand','graveyard','exile','command'])state.zones[z]??=[];state.libraryCounts??={};state.soloNPC??={};return state}
function zoneFor(state,z,id){ensureZones(state);return state.zones[z].filter(x=>Number(x.owner)===Number(id))}
function removeZoneCard(state,z,id){let a=state.zones[z]||[],i=a.findIndex(x=>String(x.id)===String(id));return i>=0?a.splice(i,1)[0]:null}
function draw(state,id,n=1,{updateCount=true}={}){ensureZones(state);let d=state.soloNPC?.decks?.[String(id)];if(!d)return[];let out=[];for(let i=0;i<n&&d.library.length;i++){let c=d.library.shift();state.zones.hand.push(c);out.push(c)}if(updateCount){let rec=state.libraryCounts[id]||{};state.libraryCounts[id]={...rec,value:d.library.length,exact:true,confirmed:true,source:'solo-npc',deckSize:d.deckSize,commanderCount:d.commanderCount,openingHand:7,draws:Number(rec.draws||0)+out.length}}return out}
function initialize(state,players,format='commander',seed=Date.now(),profiles=null){ensureZones(state);let seats=(players||[]).filter(p=>p.testSeat===true),r=rules(format),ps=profiles||pickProfiles(format,seats.length,seed);state.soloNPC={version:VERSION,format:r.format,seed:String(seed),paused:false,decks:{},turnState:{}};for(const p of players||[]){state.life[p.id]=r.startingLife;state.libraryCounts[p.id]??={value:Math.max(0,Number(p.deckSize||r.deckSize)-Number(p.commanderCount??r.commanderCount)-7),exact:p.testSeat===true,confirmed:p.testSeat===true,source:p.testSeat?'solo-npc':'opening-estimate',deckSize:Number(p.deckSize||r.deckSize),commanderCount:Number(p.commanderCount??r.commanderCount),openingHand:7,draws:0,manualAdjustments:0}}
 seats.forEach((p,i)=>{let profile=ps[i],built=buildDeck(format,profile,p.id,String(seed)+':'+p.id);p.name=profile.playerName;p.deckName=profile.name;p.commander=profile.commander;p.deckSize=r.deckSize;p.commanderCount=r.commanderCount;p.deckColorIdentity=profile.colors.slice();p.npc=true;p.npcArchetype=profile.id;state.soloNPC.decks[String(p.id)]={profile:clone(profile),library:built.library,deckSize:r.deckSize,commanderCount:r.commanderCount,landPlayedTurn:0,castTurn:0,attackTurn:0,lastAction:null};if(built.commander)state.zones.command.push(built.commander);draw(state,p.id,7)});return{state,players,profiles:ps}}
function hand(state,id){return zoneFor(state,'hand',id)}
function lands(state,id){return(state.battle||[]).filter(o=>Number(o.controllerId??o.owner)===Number(id)&&/\bLand\b/i.test(String(o.typeLine||o.type||'')))}
function creatures(state,id){return(state.battle||[]).filter(o=>Number(o.controllerId??o.owner)===Number(id)&&/\bCreature\b/i.test(String(o.typeLine||o.type||'')))}
function playLandCandidate(state,id){return hand(state,id).find(c=>/\bLand\b/i.test(String(c.typeLine||'')))||null}
function castCandidate(state,id){let mana=lands(state,id).length,h=hand(state,id).filter(c=>!/\bLand\b/i.test(String(c.typeLine||'')));return h.filter(c=>Number(c.manaValue||0)<=Math.max(1,mana)).sort((a,b)=>Number(b.manaValue||0)-Number(a.manaValue||0))[0]||null}
function commanderCandidate(state,id){let d=state.soloNPC?.decks?.[String(id)],mana=lands(state,id).length;if(!d?.commanderCount||mana<4)return null;return zoneFor(state,'command',id)[0]||null}
function attackCandidates(state,id){let turn=Number(state.turn||1);return creatures(state,id).filter(o=>!o.tapped&&Number(o.soloNpcBornTurn||0)<turn).slice(0,3)}
function targetPlayer(state,players,id){let alive=(players||[]).filter(p=>Number(p.id)!==Number(id)&&!state.fallen?.[p.id]);if(!alive.length)return null;alive.sort((a,b)=>Number(state.life[a.id]??40)-Number(state.life[b.id]??40)||Number(a.id)-Number(b.id));return alive[0]}
function togglePause(state,value=null){ensureZones(state);state.soloNPC??={};state.soloNPC.paused=value==null?!state.soloNPC.paused:!!value;return state.soloNPC.paused}
function localQA(){let ps=[{id:1,testSeat:false,deckSize:100,commanderCount:1},{id:2,testSeat:true}],st={life:{},zones:{hand:[],graveyard:[],exile:[],command:[]},battle:[],libraryCounts:{},fallen:{},soloNPC:null},profiles=pickProfiles('commander',1,123),x=initialize(st,ps,'commander',123,profiles),d=x.state.soloNPC.decks['2'],checks=[];let q=(n,v)=>checks.push([n,!!v]);q('commander NPC gets 100-card format profile',ps[1].deckSize===100&&ps[1].commanderCount===1);q('NPC gets randomized archetype identity',!!ps[1].deckName&&ps[1].deckColorIdentity.length>0);q('opening hand has seven simulated cards',hand(st,2).length===7);q('commander starts in command zone',zoneFor(st,'command',2).length===1);q('library count matches deck minus commander and hand',Number(st.libraryCounts[2].value)===92&&d.library.length===92);let before=d.library.length;draw(st,2,1);q('draw moves one card into NPC hand',d.library.length===before-1&&hand(st,2).length===8);q('format rules change starting life',rules('standard').startingLife===20&&rules('brawl').startingLife===25);q('pause state is authoritative inside solo runtime',togglePause(st,true)===true);q('format engine exposes a real draw step before main 1',globalThis.MTGTurnStructure?.next?.({phase:'UPKEEP',active:1,turn:2},ps)?.phase==='DRAW');return{ok:checks.every(x=>x[1]),checks,version:VERSION,sample:ps[1].deckName}}
return{VERSION,ARCHETYPES,rules,pickProfiles,buildDeck,initialize,draw,hand,lands,creatures,removeZoneCard,playLandCandidate,castCandidate,commanderCandidate,attackCandidates,targetPlayer,togglePause,localQA};
});(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSoloQA=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase30-solo-qa-scenarios-1';
const clone=x=>JSON.parse(JSON.stringify(x));
const SCENARIOS={
  fresh:{id:'fresh',label:'Fresh 4-Player Table'},
  lowLife:{id:'lowLife',label:'Low-Life Danger'},
  poison:{id:'poison',label:'Poison Danger'},
  commander:{id:'commander',label:'Commander-Damage Danger'},
  priority:{id:'priority',label:'Priority / Stack Test'},
  elimination:{id:'elimination',label:'Near Elimination'},
  finalTwo:{id:'finalTwo',label:'Final Two'},
  endgame:{id:'endgame',label:'One Action From Victory'}
};
function list(){return Object.values(SCENARIOS).map(clone)}
function ensurePlayers(players=[]){if(players.length<2)throw new Error('At least two players required');return players}
function base(state,players){
  const s=clone(state||{});
  s.life=s.life||{};s.poison=s.poison||{};s.tax=s.tax||{};s.cmd=s.cmd||{};s.fallen=s.fallen||{};s.stack=Array.isArray(s.stack)?s.stack:[];s.events=Array.isArray(s.events)?s.events:[];s.meta=s.meta||{};
  for(const p of players){s.life[p.id]??=40;s.poison[p.id]??=0;s.tax[p.id]??=0}
  s.meta.testMode=true;s.meta.qaScenario=null;
  return s;
}
function applyScenario(state,players,id){
  ensurePlayers(players);const s=base(state,players),me=players[0].id,opp=players[1].id;
  s.fallen={};s.stack=[];s.priority=null;s.active=me;s.phase='MAIN 1';
  for(const p of players){s.life[p.id]=40;s.poison[p.id]=0}
  if(id==='fresh'){}
  else if(id==='lowLife'){s.life[me]=9;s.life[opp]=12}
  else if(id==='poison'){s.poison[me]=8;s.poison[opp]=9}
  else if(id==='commander'){s.cmd=s.cmd||{};s.cmd[me]=s.cmd[me]||{};s.cmd[me][opp]=18}
  else if(id==='priority'){s.stack=[{id:'qa-stack-1',name:'Test Spell',controller:opp,type:'spell'},{id:'qa-stack-2',name:'Test Trigger',controller:me,type:'trigger'}];s.priority=me;s.active=opp;s.phase='COMBAT'}
  else if(id==='elimination'){s.life[opp]=1;s.poison[opp]=9}
  else if(id==='finalTwo'){for(const p of players.slice(2)){s.fallen[p.id]=true;s.life[p.id]=0}s.life[me]=14;s.life[opp]=11}
  else if(id==='endgame'){for(const p of players.slice(2)){s.fallen[p.id]=true;s.life[p.id]=0}s.life[opp]=1;s.life[me]=7;s.active=me;s.phase='COMBAT'}
  else throw new Error('Unknown scenario');
  s.meta.qaScenario=id;s.meta.qaVersion=VERSION;
  return s;
}
function describe(id){
  const map={
    fresh:'Baseline table with all seats at normal starting values.',
    lowLife:'Local player and one opponent are inside low-life danger territory.',
    poison:'Players are close to poison elimination.',
    commander:'Local player has 18 commander damage from one opponent.',
    priority:'Two stack objects are present with active/priority players split.',
    elimination:'One opponent is one life and one poison counter from elimination.',
    finalTwo:'Only the local player and one opponent remain.',
    endgame:'Only two players remain and the opponent is one damage from losing.'
  };return map[id]||'';
}
function checks(state,players,id){
  const me=players[0].id,opp=players[1].id,r=[];
  if(id==='lowLife')r.push({name:'local low life',ok:Number(state.life[me])<=10});
  if(id==='poison')r.push({name:'poison danger',ok:Number(state.poison[me])>=8});
  if(id==='commander')r.push({name:'commander damage danger',ok:Number(state.cmd?.[me]?.[opp]||0)>=18});
  if(id==='priority')r.push({name:'stack populated',ok:(state.stack||[]).length>=2},{name:'priority assigned',ok:!!state.priority});
  if(id==='elimination')r.push({name:'opponent near life loss',ok:Number(state.life[opp])===1},{name:'opponent near poison loss',ok:Number(state.poison[opp])===9});
  if(id==='finalTwo'||id==='endgame')r.push({name:'two survivors',ok:players.filter(p=>!state.fallen?.[p.id]).length===2});
  if(id==='endgame')r.push({name:'opponent one life',ok:Number(state.life[opp])===1});
  return r;
}
function result(state,players,id){const c=checks(state,players,id);return{scenario:id,passed:c.filter(x=>x.ok).length,failed:c.filter(x=>!x.ok).length,ok:c.every(x=>x.ok),checks:c}}
return{VERSION,SCENARIOS,list,applyScenario,describe,checks,result};
});
