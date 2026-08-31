
(()=>{const $=x=>document.getElementById(x),toast=t=>{let e=$('to');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1300)},word=n=>['zero','one','two','three','four','five','six','seven','eight'][n]||n;
let playerProfile=null,presencePeer=null,presenceReady=false,presenceChecks=new Map(),pendingInvite=null,activeDeckId=null,pendingAvatarId=MTGAvatars.DEFAULT_ID,profileHubTab='overview';
let profileStorage=MTGProfileStore.adapter();
let hudFlags=typeof MTGPlayerHUD!=='undefined'?MTGPlayerHUD.loadFlags(localStorage):{newPlayerHud:true,contextualActions:true,lowAttention:true,universalNumeric:true,spatialOpponents:true,quickCommanderDamage:true,eventBasedInput:true,quickActionIntelligence:true,criticalStateAwareness:true,opponentDetailDrawer:true,battlefieldQuickActions:true,smartResourceRail:true,deckAdaptiveHud:true},forcedHudAwakeUntil=0,playerHudPage='home',battlefieldViewPlayer='all';
let lastPlayerAlertStatus=null,lastPlayerAlertMatchId=null;
let assistHistory={seen:{},dismissed:{}};
function loadAssistHistory(){try{let x=JSON.parse(localStorage.getItem('mtgte_assist_history_v1')||'{}');assistHistory={seen:x&&typeof x.seen==='object'?x.seen:{},dismissed:x&&typeof x.dismissed==='object'?x.dismissed:{}}}catch{assistHistory={seen:{},dismissed:{}}}return assistHistory}
function saveAssistHistory(){let trim=o=>Object.fromEntries(Object.entries(o||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0)).slice(0,80));assistHistory={seen:trim(assistHistory.seen),dismissed:trim(assistHistory.dismissed)};localStorage.setItem('mtgte_assist_history_v1',JSON.stringify(assistHistory));return assistHistory}
function markAssistSeen(key){if(key){assistHistory.seen[String(key)]=Date.now();saveAssistHistory()}}
function dismissAssistKey(key){if(key){assistHistory.dismissed[String(key)]=Date.now();saveAssistHistory()}}
loadAssistHistory();
let spatialSeatMap=typeof MTGSpatialOpponents!=='undefined'?MTGSpatialOpponents.loadMap(localStorage,[],1):{};
function avatarMarkup(id,opts){return MTGAvatars.renderMarkup(id,opts)}
function avatarRoleLabel(theme){return({divine:'Divine Vanguard',arcane:'Arcane Savant',mist:'Mistbound Adept',shadow:'Grave-Touched Mystic',blood:'Crimson Aristocrat',embers:'Warforged Flame',wild:'Wilds Keeper',chaos:'Riftforged Duelist',construct:'Relic Architect'})[String(theme||'')]||'Fantasy Champion'}
function avatarLoreBlurb(id){return({
  'celestial-guardian':'Born beneath a sun that never sets, the Celestial Guardian swore an oath to stand between the innocent and the darkness beyond the veil. His roar has ended sieges, rallied broken armies, and warned countless foes that some gates were never meant to fall.',
  'angelic-warrior':'The Dawnblade descended when the first light pierced a century of war. She carries no crown, yet kingdoms have followed her into battle, trusting the burning edge of her blade to separate hope from ruin.',
  'arcane-scholar':'The Arcane Scholar has spent lifetimes charting spells that exist only for a heartbeat before vanishing from reality. Every secret learned is another move prepared, another possibility seen before anyone else knows the game has begun.',
  'illusionist':'Veil Illusionist walks the narrow space between what is seen and what is true. Enemies swear they have cornered him only to discover they were chasing a reflection while the real spell was already taking shape behind them.',
  'necromancer':'Gravebinder listens where others fear to linger. The dead do not command him and he does not worship them; he bargains with memory, bone, and unfinished purpose, calling forgotten strength back across the veil when the living have run out of answers.',
  'vampire-warlord':'Crimson Noble was raised in a court where a smile could begin a war and a whisper could end one. Centuries of patience have sharpened his hunger into something far more dangerous than rage: absolute control.',
  'pyromancer':'Embercaller carries the heartfire of an ancient drake beneath his scales. He does not summon flame so much as unleash it, turning fury into a weapon precise enough to burn through an army without wasting a spark.',
  'barbarian':'Ashland Reaver survived the red wastes by becoming harder than the land itself. Every scar marks a battle that should have killed him, and every broken horn in his trophy chain belonged to someone who believed strength alone would be enough.',
  'beastmaster':'Wilds Hunter was chosen by the oldest spirits of the forest, not to rule the wild but to defend its balance. Where she walks, roots awaken, predators grow silent, and the ancient green remembers how powerful it once was.',
  'ancient-druid':'Elder Druid remembers forests that vanished before modern kingdoms had names. He speaks slowly because mountains, rivers, and roots answer in their own time—and when they finally answer, even armies learn patience.',
  'battle-mage':'Runebound Mage etched his first spell into steel after magic alone failed to save his home. Now every rune is both lesson and weapon, allowing him to meet sorcery with sorcery and violence with something far older.',
  'chaos-warrior':'Rift Duelist stepped through a fracture in reality and returned changed by worlds that should never have touched. Space bends around his strikes, certainty breaks in his presence, and no opponent can be sure where the next attack will come from.',
  'death-shaman':'Duskwalker Shaman keeps the rites of the hour between death and rebirth. Spirits gather at his call not from chains, but from ancient pacts, lending their strength until the balance between endings and beginnings is restored.',
  'artificer':'Aether Artificer sees machinery where others see impossibility. With crystal logic, living metal, and impossible geometry, the inventor builds devices that seem to predict their own purpose before the final piece is even placed.',
  'wandering-archmage':'The Wandering Archmage has crossed ruined empires, floating citadels, and roads that exist only beneath certain stars. He collects no treasure beyond knowledge, yet the spells hidden in his memory are worth more than kingdoms.',
  'ancient-construct':'Relic Warden awakened beneath a civilization whose name has been erased from history. Its makers are gone, its orders incomplete, but one command remains untouched by time: guard the last light until the worthy arrive.'
}[String(id||'')])||'No chronicle agrees on where this champion first appeared, only that every battlefield remembers the moment they arrived.'}
function avatarStageMarkup(selectedId,mode='profile'){
  const selected=MTGAvatars.get(selectedId);
  const isAccount=mode==='account';
  return '<div class="avatarStudio '+(isAccount?'avatarStudioAccount':'avatarStudioProfile')+'">'
    +'<div class="avatarHero" style="--hero-accent:'+selected.accent+'">'
      +'<div class="avatarHeroArt">'+avatarMarkup(selected.id)+'</div>'
      +'<div class="avatarHeroMeta">'
        +'<div class="avatarHeroKicker">'+(isAccount?'Choose Your Avatar':'Selected Avatar')+'</div>'
        +'<div class="avatarHeroName">'+esc(selected.name)+'</div>'
        +'<div class="avatarHeroRole">'+esc(avatarRoleLabel(selected.theme))+'</div>'
        +'<div class="avatarHeroDesc">'+esc(avatarLoreBlurb(selected.id))+'</div>'
        +'<div class="avatarHeroStats"><span>'+esc(selected.theme)+'</span><span>Original Fantasy Portrait</span><span>'+ (isAccount?'Ready for profile':'Active selection') +'</span></div>'
      +'</div>'
    +'</div>'
    +'<div class="avatarStudioHint">Portrait-first presentation with clean dedicated slots and subtle accents. No bulky generic rings — just premium character art that fits the UI cleanly.</div>'
    +'<div class="avatarSelectionGrid">'
      +MTGAvatars.AVATARS.map(a=>'<button type="button" class="avatarChoice avatarChoicePremium '+(a.id===selected.id?'selected':'')+'" data-'+(isAccount?'account':'profile')+'-avatar="'+a.id+'" style="--sel-accent:'+a.accent+'">'
        +'<div class="avatarChoicePortrait">'+avatarMarkup(a.id,{compact:true})+'</div>'
        +'<div class="avatarChoiceMeta"><strong class="avatarChoiceName">'+esc(a.name)+'</strong><small class="avatarChoiceRole">'+esc(avatarRoleLabel(a.theme))+'</small></div>'
      +'</button>').join('')
    +'</div>'
  +'</div>';
}
function renderAccountAvatars(){let root=$('accountAvatarGrid');if(!root)return;root.className='avatarStudioMount';root.innerHTML=avatarStageMarkup(pendingAvatarId,'account');root.querySelectorAll('[data-account-avatar]').forEach(b=>b.onclick=()=>{pendingAvatarId=b.dataset.accountAvatar;renderAccountAvatars()})}
function bindAccountStorage(id,mode='authenticated'){
 const guest=mode==='guest'||!id;
 profileStorage=MTGProfileStore.adapter(guest?sessionStorage:localStorage,guest?'mtgte_guest_profile_session_v2':MTGAccounts.accountKey(id));
}
let authEntryMode='signin',pendingIdentityMode=null,cloudOnboardingComplete=false,authBusy=false;
function authStatus(msg='',kind=''){let e=$('authStatus');if(!e)return;if(!msg){e.textContent='';e.className='authStatus';return}e.textContent=msg;e.className='authStatus '+(kind||'')}
function profileSetupStatus(msg='',kind=''){let e=$('profileSetupStatus');if(!e)return;e.textContent=msg;e.className='authStatus '+(kind||'')}
function showAuthMode(mode='signin'){
 authEntryMode=mode==='create'?'create':'signin';$('authSignInTab')?.classList.toggle('active',authEntryMode==='signin');$('authCreateTab')?.classList.toggle('active',authEntryMode==='create');$('authSignInPanel')?.classList.toggle('h',authEntryMode!=='signin');$('authCreatePanel')?.classList.toggle('h',authEntryMode!=='create');authStatus();
}
function showFrontDoor(){
 pendingIdentityMode=null;cloudOnboardingComplete=false;playerProfile=null;activeDeckId=null;bindAccountStorage(null,'guest');
 $('setup')?.classList.remove('h');$('lobby')?.classList.add('h');$('game')?.classList.add('h');$('hostControl')?.classList.add('h');
 $('accountOverlay')?.classList.remove('h');$('authGate')?.classList.remove('h');$('profileSetupPanel')?.classList.add('h');showAuthMode('signin');renderAccountAvatars();
}
function showIdentitySetup(mode,user=null){
 pendingIdentityMode=mode;pendingAvatarId=MTGAvatars.DEFAULT_ID;$('authGate')?.classList.add('h');$('profileSetupPanel')?.classList.remove('h');
 let hint=$('profileSetupHint'),mail=$('authSignedEmail');if(mode==='authenticated'){if(hint)hint.textContent='Your profile, decks and future progression will be saved to this account.';if(mail){mail.textContent=user?.email||'';mail.classList.toggle('h',!user?.email)}}else{if(hint)hint.textContent='Guest identity lasts for this visit only. Every Guest entry starts fresh, including deck verification.';mail?.classList.add('h')}
 $('displayNameInput').value='';$('usernameInput').value='';profileSetupStatus();renderAccountAvatars();
}
function clearLegacyGuestPersistence(){
 try{localStorage.removeItem(MTGProfileStore.KEY);localStorage.removeItem('mtgte_profile');localStorage.removeItem('mtgte_active_deck')}catch{}
}
async function enterAuthenticatedAccount(){
 let row=await MTGCloudAccount.loadProfileRow();let user=MTGCloudAccount.currentUser();
 if(!row||!row.profile_data||typeof row.profile_data!=='object'||!row.profile_data.id){showIdentitySetup('authenticated',user);return}
 bindAccountStorage(row.profile_data.id,'authenticated');playerProfile=MTGProfileStore.migrate(row.profile_data);playerProfile.auth={mode:'authenticated',provider:'supabase',subject:user.id,email:user.email||null};playerProfile.onboardingComplete=!!row.onboarding_complete;cloudOnboardingComplete=!!row.onboarding_complete;
 profileStorage.save(playerProfile);MTGAccounts.setActive(playerProfile.id,localStorage);MTGAccounts.saveAccount(playerProfile,localStorage);
 activeDeckId=localStorage.getItem('mtgte_active_deck_'+playerProfile.id)||null;startPresence();renderProfile();renderDeckLibrary();$('accountOverlay').classList.add('h');
 if(cloudOnboardingComplete){$('setup').classList.add('h');showLobbyPage();setTimeout(offerLiveRecovery,350)}else{$('lobby').classList.add('h');$('setup').classList.remove('h');startVerifyAmbience();toast('Finish your first deck verification to complete setup.')}
}
async function accountSignIn(){
 if(authBusy)return;let email=$('authSignInEmail').value.trim(),pass=$('authSignInPassword').value;if(!email||!pass)return authStatus('Enter your email and password.','error');authBusy=true;authStatus('Signing in…');
 try{await MTGCloudAccount.signIn(email,pass);authStatus('Account verified.','good');await enterAuthenticatedAccount()}catch(e){authStatus(e.message||'Could not sign in.','error')}finally{authBusy=false}
}
async function accountSignUp(){
 if(authBusy)return;let email=$('authCreateEmail').value.trim(),p1=$('authCreatePassword').value,p2=$('authCreatePassword2').value;if(!/^\S+@\S+\.\S+$/.test(email))return authStatus('Enter a valid email address.','error');if(p1.length<8)return authStatus('Use at least 8 characters for your password.','error');if(p1!==p2)return authStatus('Those passwords do not match.','error');authBusy=true;authStatus('Creating your account…');
 try{let data=await MTGCloudAccount.signUp(email,p1);if(data?.access_token){authStatus('Account created.','good');showIdentitySetup('authenticated',MTGCloudAccount.currentUser())}else{showAuthMode('signin');$('authSignInEmail').value=email;$('authSignInPassword').value='';authStatus('Account created. Check your email to confirm it, then sign in.','good')}}catch(e){authStatus(e.message||'Could not create account.','error')}finally{authBusy=false}
}
function startGuestIdentity(){
 MTGCloudAccount.clearMemory();
 // Guest is intentionally non-persistent: every fresh Guest entry starts onboarding again.
 // Actual multiplayer recovery remains a separate match-recovery concern, not a saved guest account.
 try{sessionStorage.removeItem('mtgte_guest_profile_session_v2');sessionStorage.removeItem('mtgte_guest_active_deck')}catch{}
 bindAccountStorage(null,'guest');playerProfile=null;activeDeckId=null;showIdentitySetup('guest',null)
}
function loadProfile(){
 if(sharedDisplayMode){MTGCloudAccount.clearMemory();startSharedDisplayMode();return}
 clearLegacyGuestPersistence();MTGCloudAccount.clearMemory();showFrontDoor();
}
if($('authSignInTab'))$('authSignInTab').onclick=()=>showAuthMode('signin');
if($('authCreateTab'))$('authCreateTab').onclick=()=>showAuthMode('create');
if($('authSignInBtn'))$('authSignInBtn').onclick=accountSignIn;
if($('authCreateBtn'))$('authCreateBtn').onclick=accountSignUp;
if($('authGuestBtn'))$('authGuestBtn').onclick=startGuestIdentity;
if($('authSignInPassword'))$('authSignInPassword').addEventListener('keydown',e=>{if(e.key==='Enter')accountSignIn()});
if($('authCreatePassword2'))$('authCreatePassword2').addEventListener('keydown',e=>{if(e.key==='Enter')accountSignUp()});

const RECOVERY_DECISION_PREFIX='mtgte_recovery_decision_v2_';
function recoverySessionId(c){
 try{const x=MTGRecovery.validate(c),meta=x.state?.meta||{},room=String(x.room||'room').toLowerCase(),started=Number(meta.startedAt||0),match=String(x.matchId||meta.matchId||'').trim();return match||room+'_'+String(started||x.savedAt||0)}catch{return null}
}
function recoveryDecisionKey(c){const sid=recoverySessionId(c);if(!sid)return null;return RECOVERY_DECISION_PREFIX+String(playerProfile?.id||'guest')+'_'+encodeURIComponent(sid).slice(0,220)}
function recoveryDecision(c){const k=recoveryDecisionKey(c);return k?localStorage.getItem(k):null}
function markRecoveryDecision(c,decision){const k=recoveryDecisionKey(c);if(k)localStorage.setItem(k,String(decision||'dismissed'));return decision}
function isActualMultiplayerCheckpoint(c){
 try{const x=MTGRecovery.validate(c);if(typeof MTGSoloTest!=='undefined'&&MTGSoloTest.isSoloRoom(x.room,x.state))return false;const humans=(x.players||[]).filter(p=>p&&p.testSeat!==true);return !!String(x.room||'').trim()&&humans.length>=2}catch{return false}
}
function isActualMultiplayerRuntime(){if(!battleStarted||soloTestMode)return false;if(typeof MTGSoloTest!=='undefined'&&MTGSoloTest.isSoloRoom(activeRoom,st))return false;return !!String(activeRoom||'').trim()&&(players||[]).filter(p=>p&&p.testSeat!==true).length>=2}
function discardLiveRecovery(){if(typeof MTGRecovery!=='undefined')MTGRecovery.clear(localStorage,MTGSessionBoundary.recoveryKey(playerProfile?.id))}
function discardNonMultiplayerRecovery(){if(typeof MTGRecovery==='undefined')return;const key=MTGSessionBoundary.recoveryKey(playerProfile?.id),c=MTGRecovery.load(localStorage,key);if(c&&!isActualMultiplayerCheckpoint(c))MTGRecovery.clear(localStorage,key)}
function persistRecoveryCheckpoint(){
 if(typeof MTGRecovery==='undefined'||!battleStarted||!isActualMultiplayerRuntime())return;
 try{MTGRecovery.saveSession({state:st,players,room:activeRoom,localPlayerId:me,isHost:!!HST,battleStarted},localStorage,MTGSessionBoundary.recoveryKey(playerProfile?.id))}catch(e){console.warn('Recovery checkpoint failed',e)}
}
function restoreLiveRecovery(c,{silent=false}={}){
 try{const r=MTGRecovery.restore(c);st=MTGEngine.normalizeState(r.state);players=r.players;activeRoom=r.room||'';me=r.localPlayerId;HST=r.isHost?1:0;authoritySyncRevision=Math.max(authoritySyncRevision,typeof MTGAuthoritativeSync!=='undefined'?MTGAuthoritativeSync.stateRevision(st):0);soloTestMode=false;battleStarted=true;showBattlePage();hud();sync();stopLobbyAmbience();toast(silent?'Match session resumed.':'Unfinished match restored.');return true}catch(e){toast('Recovery failed: '+e.message);return false}
}
window.addEventListener('pagehide',()=>{try{if(isActualMultiplayerRuntime())persistRecoveryCheckpoint()}catch{}});

function offerLiveRecovery(){
 if(typeof MTGRecovery==='undefined')return;
 const key=MTGSessionBoundary.recoveryKey(playerProfile?.id),c=MTGRecovery.load(localStorage,key);if(!c||!MTGRecovery.recoverable(c))return;
 if(!isActualMultiplayerCheckpoint(c)){MTGRecovery.clear(localStorage,key);return}
 const prior=recoveryDecision(c);if(prior==='leave'||prior==='dismissed')return;if(prior==='restore'){restoreLiveRecovery(c,{silent:true});return}
 const sum=MTGRecovery.summary(c),ok=confirm('Rejoin unfinished match'+(sum.room?' in room '+String(sum.room).toUpperCase():'')+' from turn '+sum.turn+'?\n\nCancel means you left this match. This question will only be shown once for this match session.');
 markRecoveryDecision(c,ok?'restore':'leave');if(!ok)return;restoreLiveRecovery(c)
}

function syncDeviceId(){let id=localStorage.getItem('mtgte_sync_device_id');if(!id){id='dev_'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem('mtgte_sync_device_id',id)}return id}
function saveProfile(){
 if(typeof MTGSync!=='undefined'&&playerProfile)playerProfile=MTGSync.touch(playerProfile,syncDeviceId());
 if(typeof MTGSyncJournal!=='undefined'&&playerProfile){
   playerProfile.syncJournal=MTGSyncJournal.append(playerProfile.syncJournal||{}, {
     id:'profile_'+playerProfile.id+'_'+(playerProfile.sync?.localRevision||0),revision:playerProfile.sync?.localRevision||0,kind:'profile',operation:'upsert',recordId:playerProfile.id,payload:{profileId:playerProfile.id,updatedAt:new Date().toISOString()}
   });
 }
 playerProfile=profileStorage.save(playerProfile);
 if(playerProfile?.auth?.mode==='authenticated'){
   if(typeof MTGAccounts!=='undefined')MTGAccounts.saveAccount(playerProfile,localStorage);
   if(typeof MTGCloudAccount!=='undefined'&&MTGCloudAccount.signedIn())MTGCloudAccount.upsertProfile(playerProfile,{onboardingComplete:!!playerProfile.onboardingComplete}).catch(e=>console.warn('Cloud profile save failed',e));
 }
 renderProfile();return playerProfile
}
function renderProfile(){
 if(!playerProfile)return;
 playerProfile.displayName=playerProfile.displayName||playerProfile.name||'Player';playerProfile.name=playerProfile.displayName;playerProfile.code=String(playerProfile.friendCode||playerProfile.code||'').replace(/^TME-/,'');
 $('myName').textContent=playerProfile.displayName;$('myFriendCode').textContent=playerProfile.friendCode||('TME-'+playerProfile.code);$('myAvatar').innerHTML=avatarMarkup(playerProfile.avatarId,{compact:true});let ha=$('hudAvatar');if(ha)ha.innerHTML=avatarMarkup(playerProfile.avatarId);let hud=document.querySelector('.playerHud'),av=MTGAvatars.get(playerProfile.avatarId);if(hud)hud.dataset.avatarTheme=av.theme;
}
if($('myAvatar'))$('myAvatar').onclick=()=>showAvatarPicker();
$('createProfileBtn').onclick=async()=>{
 let n=$('displayNameInput').value.trim();if(!n)return profileSetupStatus('Enter a player name.','error');let username=$('usernameInput')?.value.trim()||undefined;profileSetupStatus('Saving your identity…');
 try{
   if(pendingIdentityMode==='authenticated'){
     let user=MTGCloudAccount.currentUser();if(!user?.id)throw new Error('Your account session expired. Sign in again.');
     playerProfile=MTGProfileStore.createProfile({displayName:n,username,avatarId:pendingAvatarId,mode:'authenticated'});playerProfile.auth={mode:'authenticated',provider:'supabase',subject:user.id,email:user.email||null};playerProfile.onboardingComplete=false;cloudOnboardingComplete=false;bindAccountStorage(playerProfile.id,'authenticated');profileStorage.save(playerProfile);MTGAccounts.setActive(playerProfile.id,localStorage);MTGAccounts.saveAccount(playerProfile,localStorage);await MTGCloudAccount.upsertProfile(playerProfile,{onboardingComplete:false});
     activeDeckId=null;$('accountOverlay').classList.add('h');startPresence();renderProfile();renderDeckLibrary();$('lobby').classList.add('h');$('setup').classList.remove('h');startVerifyAmbience();toast('Account ready — verify your first deck.')
   }else{
     bindAccountStorage(null,'guest');playerProfile=MTGProfileStore.createProfile({displayName:n,username,avatarId:pendingAvatarId,mode:'guest'});playerProfile.onboardingComplete=false;activeDeckId=null;saveProfile();$('accountOverlay').classList.add('h');startPresence();renderProfile();renderDeckLibrary();$('lobby').classList.add('h');$('setup').classList.remove('h');startVerifyAmbience();toast('Guest ready — verify a deck to enter the lobby.')
   }
 }catch(e){profileSetupStatus(e.message||'Could not save your profile.','error')}
}
function socialFriendCode(v){return typeof MTGSocialInvites!=='undefined'?MTGSocialInvites.normalizeFriendCode(v):(String(v||'').trim().toUpperCase().replace(/^TME-/,'')||null)}
function socialRoomCode(v){return typeof MTGSocialInvites!=='undefined'?MTGSocialInvites.normalizeRoomCode(v):(String(v||'').trim().toUpperCase()||null)}
function presenceId(code){let c=socialFriendCode(code);return c?'mtgte-user-'+c.toLowerCase():''}
function startPresence(){
 if(peerTransportState==='unavailable')return false;if(!window.Peer)return setTimeout(startPresence,350);if(!playerProfile||presencePeer)return;
 let pid=presenceId(playerProfile.code||playerProfile.friendCode);if(!pid)return false;
 presencePeer=new Peer(pid);
 presencePeer.on('open',()=>{presenceReady=true;renderFriends();});
 presencePeer.on('connection',x=>{
   x.on('data',m=>{
     if(m?.t==='presence_probe'){x.send({t:'presence_ack',name:playerProfile.name,code:socialFriendCode(playerProfile.code||playerProfile.friendCode)});return}
     if(m?.t==='battle_invite'){
       let room=socialRoomCode(m.room),fromCode=socialFriendCode(m.fromCode);if(!room)return;
       pendingInvite={...m,room,fromCode,fromName:MTGSocialInvites?.safeName?.(m.fromName)||String(m.fromName||'A friend').slice(0,64)};showIncomingInvite(pendingInvite);return
     }
   })
 });
 presencePeer.on('disconnected',()=>{presenceReady=false;try{presencePeer.reconnect()}catch{}});
 presencePeer.on('error',()=>{});
}
function probeFriendDetails(code){
 return new Promise(res=>{
   code=socialFriendCode(code);if(!code||!presencePeer||!presencePeer.open)return res({online:false,code,name:null});
   let settled=false,c;
   try{c=presencePeer.connect(presenceId(code),{reliable:true});}catch{return res({online:false,code,name:null})}
   let done=v=>{if(settled)return;settled=true;try{c.close()}catch{};res(v)};
   c.on('open',()=>{try{c.send({t:'presence_probe',from:socialFriendCode(playerProfile.code||playerProfile.friendCode)})}catch{}});
   c.on('data',m=>{let ack=socialFriendCode(m?.code);if(m?.t==='presence_ack'&&ack===code)done({online:true,code,name:MTGSocialInvites?.safeName?.(m.name,'Friend')||String(m.name||'Friend').slice(0,64)})});
   c.on('error',()=>done({online:false,code,name:null}));setTimeout(()=>done({online:false,code,name:null}),1400)
 })
}
async function probeFriend(friend){return (await probeFriendDetails(friend?.code||friend?.friendCode)).online}
async function refreshPresence(){
 if(!playerProfile)return;
 for(const f of (playerProfile.friends||[])){let d=await probeFriendDetails(f.code||f.friendCode);f.online=!!d.online;if(d.online&&d.name)f.name=d.name}
 saveProfile();renderFriends()
}
function renderFriends(){
 if(!playerProfile)return;let a=playerProfile.friends||[];
 $('friendsList').innerHTML=a.length?a.map(f=>{let code=socialFriendCode(f.code||f.friendCode)||'------';return '<div class="friendRow"><div><div class="friendName">'+(f.online?'<span class="onlineDot"></span>':'')+esc(f.name)+'</div><div class="friendMeta">TME-'+esc(code)+' · '+(f.online?'ONLINE':'OFFLINE')+'</div></div><button class="inviteBtn '+(f.online?'online':'')+'" data-invite="'+esc(code)+'" '+(f.online?'':'disabled')+'>INVITE</button></div>'}).join(''):'<div class="small" style="padding:9px 0">No friends yet. Add someone using their TME friend code.</div>';
 document.querySelectorAll('[data-invite]').forEach(b=>b.onclick=()=>inviteFriend(b.dataset.invite))
}
function inviteFriend(code){
 code=socialFriendCode(code);if(!code)return toast('That friend code is invalid.');
 if(!activeRoom){toast('Host or join a game first to create a current room.');return}
 if(!presencePeer?.open)return toast('Friend presence is reconnecting.');
 let f=(playerProfile.friends||[]).find(x=>socialFriendCode(x.code||x.friendCode)===code);let c;
 try{c=presencePeer.connect(presenceId(code),{reliable:true})}catch{return toast('Could not open invite channel.')}
 c.on('open',()=>{c.send({t:'battle_invite',room:socialRoomCode(activeRoom),fromName:MTGSocialInvites?.safeName?.(playerProfile?.displayName||playerProfile?.name||'A friend')||(playerProfile?.displayName||playerProfile?.name||'A friend'),fromCode:socialFriendCode(playerProfile?.code||playerProfile?.friendCode)});toast('Invite sent to '+(f?.name||('TME-'+code)));setTimeout(()=>c.close(),500)})
 c.on('error',()=>toast('Friend is not reachable right now.'))
}
function joinRoomInvite(m){let room=socialRoomCode(m?.room);if(!room)return toast('That room invite is invalid.');$('modal').classList.add('h');openJoinRoomPanel();$('jc').value=room;connectToRoomCode(room)}
function showIncomingInvite(m){
 let room=socialRoomCode(m?.room);if(!room)return toast('Invalid room invite ignored.');let fromName=MTGSocialInvites?.safeName?.(m?.fromName)||String(m?.fromName||'A friend').slice(0,64),fromCode=socialFriendCode(m?.fromCode);
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="inviteNotice"><b>'+esc(fromName)+' invited you to battle</b><div class="small" style="margin-top:4px">Room '+esc(room)+(fromCode?' · TME-'+esc(fromCode):'')+'</div></div><button id="acceptInvite" class="choice">JOIN CURRENT SESSION</button><button id="declineInvite" class="choice">DECLINE</button>';
 $('acceptInvite').onclick=()=>joinRoomInvite({room});
 $('declineInvite').onclick=()=>{$('modal').classList.add('h');pendingInvite=null}
}
async function addFriendByCode(raw,{profileHub=false}={}){
 let code=socialFriendCode(raw);if(!code)return toast('Enter a valid TME-XXXXXX friend code.');let mine=socialFriendCode(playerProfile.code||playerProfile.friendCode);if(code===mine)return toast('That is your own friend code.');
 playerProfile.friends=playerProfile.friends||[];if(playerProfile.friends.some(f=>socialFriendCode(f.code||f.friendCode)===code))return toast('That player is already in your friends list.');
 let found=await probeFriendDetails(code),name=found.online&&found.name?found.name:(prompt('Friend display name','Friend')||'Friend').trim();playerProfile.friends.push({name:MTGSocialInvites?.safeName?.(name,'Friend')||name,code,online:!!found.online});saveProfile();renderFriends();if(profileHub)renderProfileHub('friends');toast(found.online?'Friend added · online now.':'Friend saved · invite them when they are online.');if(!found.online)refreshPresence()
}
$('invitePlayersBtn').onclick=()=>{$('friendsPanel').classList.toggle('h');if(!$('friendsPanel').classList.contains('h'))refreshPresence()}
$('addFriendBtn').onclick=()=>addFriendByCode(prompt('Friend code · TME-XXXXXX')||'')
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function fmtDuration(ms){ms=Math.max(0,Number(ms)||0);let min=Math.floor(ms/60000),hr=Math.floor(min/60);return hr?(hr+'h '+(min%60)+'m'):(min+'m')}
function showMatchHistory(){if(!playerProfile)return;let h=MTGHistoryAnalytics.records(playerProfile);$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet"><div class="sectionHead"><div><div class="small">PHASE 11</div><div class="whyTitle">Match History</div></div><button id="openAnalytics" class="hostMini">ANALYTICS</button></div><div class="historyList">'+(h.length?h.map(m=>'<button class="historyMatch" data-match-id="'+esc(m.id)+'"><span><b>'+(m.result==='win'?'VICTORY':'MATCH')+'</b><small>'+esc(new Date(m.date).toLocaleString())+' · '+esc(m.commander||'Commander')+'</small></span><strong>#'+esc(m.placement||'—')+'</strong></button>').join(''):'<div class="hostMuted">No completed matches recorded yet.</div>')+'</div></div>';document.querySelectorAll('[data-match-id]').forEach(b=>b.onclick=()=>showMatchDetail(b.dataset.matchId));$('openAnalytics').onclick=showAnalytics}
function showMatchDetail(id){let m=MTGHistoryAnalytics.findMatch(playerProfile,id);if(!m)return toast('Match record not found.');let ev=MTGHistoryAnalytics.replayTimeline(m);$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet"><div class="small">COMPLETED MATCH</div><div class="whyTitle">'+esc(m.result==='win'?'Victory':'Match Summary')+'</div><div class="profileStatGrid"><div class="profileStat"><b>#'+esc(m.placement||'—')+'</b><span class="small">PLACEMENT</span></div><div class="profileStat"><b>'+esc(m.turnCount||0)+'</b><span class="small">TURNS</span></div><div class="profileStat"><b>'+esc(fmtDuration(m.durationMs))+'</b><span class="small">DURATION</span></div></div><div class="matchMeta">Deck version: <b>'+esc(m.deckVersionId||'unsaved')+'</b><br>Winner: <b>P'+esc(m.winnerId||'—')+'</b><br>Events retained: <b>'+ev.length+'</b></div><button id="replayMatch" class="choice">OPEN IMMUTABLE REPLAY</button><button id="backHistory" class="choice">BACK TO HISTORY</button></div>';$('replayMatch').onclick=()=>showReplay(id,0);$('backHistory').onclick=showMatchHistory}
function showReplay(id,index=0){let m=MTGHistoryAnalytics.findMatch(playerProfile,id);if(!m)return;let tl=MTGHistoryAnalytics.replayTimeline(m);index=Math.max(0,Math.min(Math.max(0,tl.length-1),Number(index)||0));let e=tl[index],pct=tl.length?Math.round(((index+1)/tl.length)*100):0;$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet replaySheet"><div class="small">IMMUTABLE REPLAY · '+(tl.length?(index+1)+' / '+tl.length:'NO EVENTS')+'</div><div class="whyTitle">'+(e?esc(e.type.replaceAll('_',' ')):'No retained events')+'</div><div class="replayProgress"><i style="width:'+pct+'%"></i></div>'+(e?'<div class="replayEvent"><b>Event #'+esc(e.seq)+'</b><span>Actor '+(e.actorId==null?'system':'P'+esc(e.actorId))+'</span><small>'+esc(new Date(e.at).toLocaleTimeString())+'</small></div><pre class="replayPayload">'+esc(JSON.stringify(e.payload||{},null,2))+'</pre>':'')+'<div class="grid"><button id="replayPrev" class="choice" '+(index<=0?'disabled':'')+'>PREVIOUS</button><button id="replayNext" class="choice" '+(index>=tl.length-1?'disabled':'')+'>NEXT</button></div><button id="replayDone" class="choice">MATCH SUMMARY</button></div>';$('replayPrev').onclick=()=>showReplay(id,index-1);$('replayNext').onclick=()=>showReplay(id,index+1);$('replayDone').onclick=()=>showMatchDetail(id)}
function showAnalytics(){if(!playerProfile)return;let a=MTGHistoryAnalytics.summary(playerProfile),decks=MTGHistoryAnalytics.deckPerformance(playerProfile);$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 11</div><div class="whyTitle">Match Analytics</div><div class="profileStatGrid"><div class="profileStat"><b>'+a.games+'</b><span class="small">GAMES</span></div><div class="profileStat"><b>'+Math.round(a.winRate*100)+'%</b><span class="small">WIN RATE</span></div><div class="profileStat"><b>'+(a.averagePlacement?a.averagePlacement.toFixed(2):'—')+'</b><span class="small">AVG PLACE</span></div></div><div class="analyticsDecks">'+(decks.length?decks.map(d=>'<div class="analyticsRow"><span><b>'+esc((playerProfile.decks||[]).find(x=>x.id===d.deckId)?.name||d.commander||'Saved deck')+'</b><small>'+d.games+' games · '+d.versionCount+' version'+(d.versionCount===1?'':'s')+'</small></span><strong>'+Math.round(d.winRate*100)+'%</strong></div>').join(''):'<div class="hostMuted">Complete matches to build performance analytics.</div>')+'</div><button id="analyticsHistory" class="choice">MATCH HISTORY</button></div>';$('analyticsHistory').onclick=showMatchHistory}
function persistFinalMatch(){if(!playerProfile||!st?.matchFinalization)return;if(typeof MTGSoloTest!=='undefined'&&!MTGSoloTest.shouldPersistMatch(activeRoom,st))return;let deck=currentSavedDeck(),record=MTGMatchRecords.localRecord(st,players,me,deck);if(!record)return;let before=(playerProfile.history||[]).length;playerProfile=MTGProfileStore.recordMatch(playerProfile,record);if((playerProfile.history||[]).length!==before)profileStorage.save(playerProfile)}
function finalizeMatchIfReady(){if(!HST||st.matchFinalization)return;let e=MTGMatchRecords.finalize(st,players,activeRoom,me,MTGEngine);if(e){send({t:'state',st});persistFinalMatch();MTGAnnouncerEngine.event('victory',{winnerId:Number(st.matchFinalization?.winnerId||e?.payload?.winnerId||me),force:true})}}




function switchAccount(){
 if(typeof MTGAccounts==='undefined')return;
 const list=MTGAccounts.list(localStorage);
 if(!list.length)return toast('No saved local accounts.');
 const labels=list.map(a=>a.displayName+(a.username?' · @'+a.username:''));
 choice(labels,l=>{
   const i=labels.indexOf(l),a=list[i];if(!a)return;
   const recovery=playerProfile?MTGRecovery.load(localStorage,MTGSessionBoundary.recoveryKey(playerProfile.id)):null;
   const risk=MTGSessionBoundary.switchRisk({battleStarted:!!battleStarted,recoveryExists:!!(recovery&&MTGRecovery.recoverable(recovery))});
   if(risk==='active-match')return toast('Finish or leave the active match before switching accounts.');
   if(risk==='unfinished-match'&&!confirm('This account has an unfinished match checkpoint. Switch accounts anyway?'))return;
   if(playerProfile)MTGAccounts.saveAccount(playerProfile,localStorage);
   MTGAccounts.setActive(a.id,localStorage);bindAccountStorage(a.id);playerProfile=profileStorage.load()||MTGAccounts.loadAccount(a.id,localStorage);
   activeDeckId=localStorage.getItem('mtgte_active_deck_'+a.id)||null;renderProfile();renderDeckLibrary();setTimeout(offerLiveRecovery,150);toast('Switched to '+a.displayName);
 })
}
function showAccounts(){
 const list=MTGAccounts.list(localStorage),active=MTGAccounts.activeId(localStorage);
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 16</div><div class="whyTitle">Local Accounts</div><div class="historyList">'+(list.length?list.map(a=>'<button class="historyMatch" data-account="'+esc(a.id)+'"><span><b>'+esc(a.displayName)+'</b><small>'+(a.id===active?'ACTIVE · ':'')+(a.username?'@'+esc(a.username):'Local profile')+'</small></span><strong>›</strong></button>').join(''):'<div class="hostMuted">No local accounts saved.</div>')+'</div><button id="addLocalAccount" class="btn">ADD LOCAL ACCOUNT</button></div>';
 document.querySelectorAll('[data-account]').forEach(b=>b.onclick=()=>{
 const currentRecovery=playerProfile?MTGRecovery.load(localStorage,MTGSessionBoundary.recoveryKey(playerProfile.id)):null;
 if(battleStarted)return toast('Finish or leave the active match before switching accounts.');
 if(currentRecovery&&MTGRecovery.recoverable(currentRecovery)&&!confirm('This account has an unfinished match checkpoint. Switch anyway?'))return;
 MTGAccounts.setActive(b.dataset.account,localStorage);bindAccountStorage(b.dataset.account);playerProfile=profileStorage.load()||MTGAccounts.loadAccount(b.dataset.account,localStorage);renderProfile();renderDeckLibrary();$('modal').classList.add('h');toast('Account switched.')});
 $('addLocalAccount').onclick=()=>{$('modal').classList.add('h');$('accountOverlay').classList.remove('h');playerProfile=null;renderAccountAvatars()};
}





let mtgteInstallPrompt=null,mtgtePwaRegistration=null;
function initPWA(){
 if(typeof MTGPWA==='undefined')return;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();mtgteInstallPrompt=e;renderProfile()});
 window.addEventListener('appinstalled',()=>{mtgteInstallPrompt=null;toast('MTG Table Engine installed.')});
 window.addEventListener('online',()=>toast('Connection restored.'));
 window.addEventListener('offline',()=>toast('Offline mode active.'));
 MTGPWA.register(window).then(r=>{mtgtePwaRegistration=r.registration||null}).catch(()=>{});
}
async function installPWA(){
 if(!mtgteInstallPrompt)return toast('Install is not available in this browser yet.');
 try{await mtgteInstallPrompt.prompt();await mtgteInstallPrompt.userChoice;mtgteInstallPrompt=null}catch(e){toast('Install prompt unavailable.')}
}







let mtgteRuntimeReport=null;
function runRuntimeChecks(){
 if(typeof MTGRuntimeCheck==='undefined')return null;
 mtgteRuntimeReport=MTGRuntimeCheck.run(window);
 if(typeof MTGObservability!=='undefined'&&mtgteRuntimeReport.status!=='ready')diagnosticLog=MTGObservability.append(diagnosticLog,{
   category:'runtime',level:mtgteRuntimeReport.ok?'warning':'error',
   code:'RUNTIME_'+mtgteRuntimeReport.status.toUpperCase(),
   message:'Runtime capability check: '+mtgteRuntimeReport.status,
   meta:{warnings:mtgteRuntimeReport.warnings.map(x=>x.name),critical:mtgteRuntimeReport.criticalFailures.map(x=>x.name)}
 });
 return mtgteRuntimeReport;
}

function showRoomSessionStatus(){
 if(typeof MTGRoomSession==='undefined')return toast('Room-session module unavailable.');
 const descriptor=roomDescriptor||null;
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 35</div><div class="whyTitle">Room Session Integrity</div>'+(descriptor?'<div class="profileStatGrid"><div class="profileStat"><b>'+descriptor.epoch+'</b><span class="small">EPOCH</span></div><div class="profileStat"><b>'+esc(descriptor.hostPlayerId)+'</b><span class="small">HOST</span></div><div class="profileStat"><b>'+descriptor.participants.length+'</b><span class="small">SEATS</span></div></div><div class="hostMuted" style="margin-top:12px">Authority is bound to room + session + epoch. Old host packets become invalid after failover.</div>':'<div class="hostMuted">No active room. Solo QA and automated tests still validate the epoch/seat-reclaim logic.</div>')+'</div>';
}

function showRuntimeStatus(){
 const r=runRuntimeChecks();if(!r)return;
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 28</div><div class="whyTitle">Runtime Status</div><div class="profileStatGrid"><div class="profileStat"><b>'+esc(r.status.toUpperCase())+'</b><span class="small">APP</span></div><div class="profileStat"><b>'+(r.multiplayerReady?'READY':'LIMITED')+'</b><span class="small">MULTIPLAYER</span></div><div class="profileStat"><b>'+r.warnings.length+'</b><span class="small">WARNINGS</span></div></div><div class="historyList" style="margin-top:12px">'+r.checks.map(c=>'<div class="historyMatch"><span><b>'+esc(c.name)+'</b><small>'+esc(c.detail||(c.ok?'Available':'Unavailable'))+'</small></span><strong>'+(c.ok?'✓':(c.critical?'!':'~'))+'</strong></div>').join('')+'</div><div class="hostMuted" style="margin-top:12px">Critical failures block unsafe startup paths. Noncritical capability gaps keep local match tracking available while disabling only the affected feature.</div></div>';
}

function showDiagnostics(){
 const fp=typeof MTGStateVerify!=='undefined'?MTGStateVerify.fingerprint(st):null;
 const ph=(typeof MTGIntegrity!=='undefined'&&playerProfile)?MTGIntegrity.health(playerProfile):null;
 const peers=(players||[]).map((p,i)=>({playerId:p.id||i+1,seat:i+1,connected:p.connected!==false,lastSeen:p.lastSeen||Date.now()}));
 const rh=typeof MTGRoomResilience!=='undefined'?MTGRoomResilience.roomHealth(peers):null;
 const sum=MTGObservability.summarize(diagnosticLog),h=MTGObservability.health({transportStats,integrity:ph,online:navigator.onLine!==false});
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 27</div><div class="whyTitle">Diagnostics</div><div class="profileStatGrid"><div class="profileStat"><b>'+esc(h.status.toUpperCase())+'</b><span class="small">HEALTH</span></div><div class="profileStat"><b>'+sum.total+'</b><span class="small">EVENTS</span></div><div class="profileStat"><b>'+Number(transportStats.rejected||0)+'</b><span class="small">REJECTED</span></div></div><div class="hostMuted" style="margin-top:12px">Diagnostics capture protocol/state failures locally so multiplayer issues can be explained without exposing private deck contents or credentials.</div><button id="exportDiag" class="btn">EXPORT DIAGNOSTICS</button><button id="clearDiag" class="btn ghost">CLEAR LOG</button></div>';
 $('exportDiag').onclick=()=>{const d=MTGObservability.exportDiagnostics({log:diagnosticLog,transportStats,stateFingerprint:fp,profileHealth:ph,roomHealth:rh,appVersion:'phase27'}),b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='mtgte-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('Diagnostics exported.')};
 $('clearDiag').onclick=()=>{diagnosticLog=[];showDiagnostics();toast('Diagnostics cleared.')};
}

function showReleaseGate(){
 const checks={
   transport:typeof MTGTransportGateway!=='undefined',
   protocol:typeof MTGProtocol!=='undefined',
   verifier:typeof MTGStateVerify!=='undefined',
   resilience:typeof MTGRoomResilience!=='undefined',
   recovery:typeof MTGRecovery!=='undefined',
   integrity:typeof MTGIntegrity!=='undefined',
   pwa:typeof MTGPWA!=='undefined'
 };
 const g=MTGReleaseGate.requireAll(checks);
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 26</div><div class="whyTitle">Release Gate</div><div class="profileStatGrid"><div class="profileStat"><b>'+(g.ok?'PASS':'FAIL')+'</b><span class="small">GATE</span></div><div class="profileStat"><b>'+g.passed+'</b><span class="small">PASSED</span></div><div class="profileStat"><b>'+g.failed+'</b><span class="small">FAILED</span></div></div><div class="historyList" style="margin-top:12px">'+g.checks.map(c=>'<div class="historyMatch"><span><b>'+esc(c.name.toUpperCase())+'</b><small>'+ (c.ok?'Available':'Missing') +'</small></span><strong>'+(c.ok?'✓':'!')+'</strong></div>').join('')+'</div><div class="hostMuted" style="margin-top:12px">The build is only considered phase-ready after regression tests, transport chaos tests, syntax checks, and static asset checks pass.</div></div>';
}

function runLiveReconnectQA(){
 let checks=[];try{let d=MTGRoomSession.createDescriptor({room:'soloqa',sessionId:'room:soloqa',hostPlayerId:'qa-host',hostPeerId:'qa-host-peer',participants:[{playerId:'qa-host',peerId:'qa-host-peer',seat:1,seatToken:'h'},{playerId:'qa-two',peerId:'old-peer',seat:2,seatToken:'tok2'},{playerId:'qa-three',peerId:'peer3',seat:3,seatToken:'tok3'}],epoch:1}),h=MTGLiveReconnect.resumeHello({room:'soloqa',identity:{room:'soloqa',playerId:'qa-two',seat:2,seatToken:'tok2'}}),r=MTGLiveReconnect.reclaim({roomSession:MTGRoomSession,descriptor:d,hello:h,peerId:'new-peer'}),f=MTGLiveReconnect.promote({roomSession:MTGRoomSession,descriptor:r.descriptor,newHostPlayerId:'qa-two',newHostPeerId:'qa-host-peer'});checks=[['Seat reclaimed',r.ok&&r.reclaimed&&r.participant.seat===2],['Peer ID replaced',r.participant?.peerId==='new-peer'],['Host epoch advanced',f.epoch===2],['New host bound',f.hostPlayerId==='qa-two'],['Old epoch rejected',!MTGRoomSession.validatePacket(MTGProtocol.envelope({type:'STATE_SNAPSHOT',room:'soloqa',sessionId:'room:soloqa',senderId:'host:soloqa:epoch:1',authority:'host',epoch:1}),f).ok]]}catch(e){checks=[['Reconnect harness',false]]}let ok=checks.every(x=>x[1]);if(typeof MTGObservability!=='undefined')diagnosticLog=MTGObservability.append(diagnosticLog,{category:'qa',level:ok?'info':'error',code:ok?'RECONNECT_QA_PASS':'RECONNECT_QA_FAIL',message:'Phase 35 local reconnect QA '+(ok?'passed':'failed')});$('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 35 · LOCAL QA</div><div class="whyTitle">Reconnect / Failover '+(ok?'PASS':'FAIL')+'</div><div class="historyList" style="margin-top:12px">'+checks.map(c=>'<div class="historyMatch"><span><b>'+esc(c[0])+'</b><small>Deterministic local network-state check</small></span><strong>'+(c[1]?'✓':'!')+'</strong></div>').join('')+'</div></div>';
}
function showLiveReconnect(){
 const id=roomIdentity(),d=roomDescriptor,host=d?MTGRoomSession.participantByPlayer(d,d.hostPlayerId):null;
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 35</div><div class="whyTitle">Live Reconnect & Failover</div><div class="profileStatGrid"><div class="profileStat"><b>'+(id?.seat||'—')+'</b><span class="small">SAVED SEAT</span></div><div class="profileStat"><b>'+(d?.epoch||'—')+'</b><span class="small">HOST EPOCH</span></div><div class="profileStat"><b>'+(HST?'HOST':'PLAYER')+'</b><span class="small">ROLE</span></div></div><div class="hostMuted" style="margin-top:12px">'+(d?'Current host seat '+esc(String(host?.seat||'—'))+'. Seat reclaim tokens survive peer ID changes, resume packets restore the authoritative state, and deterministic failover advances the host epoch.':'No active room. You can still verify the complete reclaim/epoch logic locally without another device.')+'</div><button id="runReconnectQA" class="btn" style="margin-top:12px">RUN LOCAL RECONNECT QA</button></div>';$('runReconnectQA').onclick=runLiveReconnectQA;
}


function runProtocolPolicyQA(){
 let checks=[];try{
  const d=MTGRoomSession.createDescriptor({room:'policyqa',sessionId:'room:policyqa',matchId:'qa',hostPlayerId:'host',hostPeerId:'hp',participants:[{playerId:'host',peerId:'hp',seat:1,role:'player',seatToken:'h'},{playerId:'p2',peerId:'p2',seat:2,role:'player',seatToken:'2'},{playerId:'spec',peerId:'spec',seat:0,role:'spectator',seatToken:'s'}],epoch:1});
  const unknown=MTGProtocol.envelope({type:'UNKNOWN_PACKET',room:'policyqa',sessionId:'room:policyqa',senderId:'p2'});
  const spec=MTGProtocol.envelope({type:'ACTION_REQUEST',room:'policyqa',sessionId:'room:policyqa',senderId:'spec',payload:{legacy:{t:'ready'}}});
  const heartbeat=MTGProtocol.envelope({type:'HEARTBEAT',room:'policyqa',sessionId:'room:policyqa',senderId:'spec',payload:{legacy:{t:'ping',ts:1}}});
  checks=[
   ['Unknown legacy blocked',!MTGProtocolPolicy.validateLegacy({t:'mystery'}).ok],
   ['Unknown envelope blocked',!MTGProtocol.inspectInbound(unknown,{room:'policyqa',sessionId:'room:policyqa',hostId:'host:policyqa:epoch:1'}).accept],
   ['Spectator gameplay blocked',MTGProtocolPolicy.inspect(spec,{expectedHostId:'host:policyqa:epoch:1',roomSession:MTGRoomSession,descriptor:d}).reason==='spectator-gameplay'],
   ['Spectator heartbeat allowed',MTGProtocolPolicy.inspect(heartbeat,{expectedHostId:'host:policyqa:epoch:1',roomSession:MTGRoomSession,descriptor:d}).ok],
   ['Generic peer fallback removed',MTGProtocol.requiredAuthority('PEER_MESSAGE')===null]
  ];
 }catch(e){checks=[['Protocol policy harness',false]]}
 const ok=checks.every(x=>x[1]);
 if(typeof MTGObservability!=='undefined')diagnosticLog=MTGObservability.append(diagnosticLog,{category:'qa',level:ok?'info':'error',code:ok?'PROTOCOL_POLICY_QA_PASS':'PROTOCOL_POLICY_QA_FAIL',message:'Phase 36 protocol policy QA '+(ok?'passed':'failed')});
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 36 · LOCAL QA</div><div class="whyTitle">Protocol Policy '+(ok?'PASS':'FAIL')+'</div><div class="historyList" style="margin-top:12px">'+checks.map(c=>'<div class="historyMatch"><span><b>'+esc(c[0])+'</b><small>Deterministic transport-boundary check</small></span><strong>'+(c[1]?'✓':'!')+'</strong></div>').join('')+'</div></div>';
}
function showProtocolPolicy(){
 if(typeof MTGProtocolPolicy==='undefined')return toast('Protocol policy module unavailable.');
 const s=MTGProtocolPolicy.summary();
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 36</div><div class="whyTitle">Strict Protocol Policy</div><div class="profileStatGrid"><div class="profileStat"><b>'+s.legacyTypes.length+'</b><span class="small">WIRE TYPES</span></div><div class="profileStat"><b>'+s.envelopeTypes.length+'</b><span class="small">ENVELOPES</span></div><div class="profileStat"><b>STRICT</b><span class="small">FALLBACK</span></div></div><div class="hostMuted" style="margin-top:12px">Unknown battle messages no longer inherit peer authority. Unsupported packets are rejected before gameplay handling, and spectators cannot submit gameplay requests.</div><button id="runPolicyQA" class="btn" style="margin-top:12px">RUN LOCAL PROTOCOL QA</button></div>';
 $('runPolicyQA').onclick=runProtocolPolicyQA;
}

function showReliableDelivery(){
 const q=deliveryQueue?deliveryQueue.snapshot():{pending:0,acked:0,retries:0,timeouts:0,superseded:0};
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 34</div><div class="whyTitle">Reliable Delivery</div><div class="profileStatGrid"><div class="profileStat"><b>'+Number(q.pending||0)+'</b><span class="small">PENDING</span></div><div class="profileStat"><b>'+Number(q.acked||0)+'</b><span class="small">ACKED</span></div><div class="profileStat"><b>'+Number(q.retries||0)+'</b><span class="small">RETRIES</span></div></div><div class="hostPlayerStats" style="margin-top:12px"><span class="hostStat">Timeouts '+Number(q.timeouts||0)+'</span><span class="hostStat">Superseded '+Number(q.superseded||0)+'</span></div><div class="hostMuted" style="margin-top:12px">Battle packets remain pending until acknowledged. Lost packets retry with bounded exponential backoff, while newer state snapshots supersede older pending snapshots per connection.</div></div>';
}

function showLiveTransport(){
 const ts=ensureTransportSession(),q=ts?ts.stats:transportStats;
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 25</div><div class="whyTitle">Live Transport Security</div><div class="profileStatGrid"><div class="profileStat"><b>'+Number(q.accepted||0)+'</b><span class="small">ACCEPTED</span></div><div class="profileStat"><b>'+Number(q.rejected||0)+'</b><span class="small">REJECTED</span></div><div class="profileStat"><b>'+Number(q.duplicates||0)+'</b><span class="small">DUPLICATES</span></div></div><div class="hostPlayerStats" style="margin-top:12px"><span class="hostStat">Authority rejects '+Number(q.authorityRejects||0)+'</span><span class="hostStat">Stale rejects '+Number(q.staleRejects||0)+'</span><span class="hostStat">Session '+esc(transportSessionId())+'</span></div><div class="hostMuted" style="margin-top:12px">Battle DataConnections are now hardened at the transport boundary. Existing gameplay messages are enveloped automatically before send and validated before the legacy game handler can process them.</div></div>';
}

function showProtocolStatus(){
 if(typeof MTGProtocol==='undefined')return;
 const sample=MTGProtocol.envelope({type:'HEARTBEAT',room:activeRoom||'offline',sessionId:st?.meta?.matchId||'lobby',senderId:String(me||1),seq:MTGStateVerify?.eventSeq?MTGStateVerify.eventSeq(st):0});
 const v=MTGProtocol.validateMessage(sample,{room:sample.room,sessionId:sample.sessionId});
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 24</div><div class="whyTitle">Multiplayer Protocol</div><div class="profileStatGrid"><div class="profileStat"><b>V'+MTGProtocol.SCHEMA+'</b><span class="small">SCHEMA</span></div><div class="profileStat"><b>'+(v.ok?'VALID':'INVALID')+'</b><span class="small">ENVELOPE</span></div><div class="profileStat"><b>ON</b><span class="small">REPLAY GUARD</span></div></div><div class="hostMuted" style="margin-top:12px">Authoritative packets are host-gated, duplicate message IDs are rejected, and repeated action IDs cannot be applied twice after retries or reconnects.</div></div>';
}

function showStateVerification(){
 if(typeof MTGStateVerify==='undefined')return;
 const fp=MTGStateVerify.fingerprint(st),ev=MTGStateVerify.inspectEvents(st);
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 23</div><div class="whyTitle">State Verification</div><div class="profileStatGrid"><div class="profileStat"><b>'+fp.seq+'</b><span class="small">EVENT SEQ</span></div><div class="profileStat"><b>'+esc(fp.hash.toUpperCase())+'</b><span class="small">STATE HASH</span></div><div class="profileStat"><b>'+(ev.ok?'CLEAN':'ISSUES')+'</b><span class="small">EVENT LOG</span></div></div><div class="hostMuted" style="margin-top:12px">This fingerprint ignores presentation-only fields and checks the authoritative state projection. Same sequence + different hash means true state divergence, not a cosmetic HUD difference.</div>'+(ev.issues.length?'<div class="historyList" style="margin-top:10px">'+ev.issues.map(i=>'<div class="historyMatch"><span><b>'+esc(i.code)+'</b><small>Authoritative event consistency issue</small></span></div>').join('')+'</div>':'')+'</div>';
}

function showRoomHealth(){
 if(typeof MTGRoomResilience==='undefined')return;
 const peerList=(players||[]).map((p,i)=>({
   playerId:p.id||i+1,seat:i+1,peerId:p.peerId||'',connected:p.connected!==false,
   lastSeen:p.lastSeen||Date.now(),isHost:Number(p.id||i+1)===Number(me)&&!!HST
 }));
 const h=MTGRoomResilience.roomHealth(peerList),next=MTGRoomResilience.electHost(peerList);
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 22</div><div class="whyTitle">Room Health</div><div class="profileStatGrid"><div class="profileStat"><b>'+h.connected+'</b><span class="small">CONNECTED</span></div><div class="profileStat"><b>'+h.stale+'</b><span class="small">STALE</span></div><div class="profileStat"><b>'+(h.healthy?'HEALTHY':'DEGRADED')+'</b><span class="small">ROOM</span></div></div><div class="hostMuted" style="margin-top:12px">Reconnect snapshots are sequence-checked before acceptance, and host failover uses deterministic seat order among live peers. Candidate host: '+esc(next?String(next.playerId):'none')+'.</div></div>';
}

function showAppStatus(){
 const s=MTGPWA.status({registered:!!mtgtePwaRegistration,controller:!!navigator.serviceWorker?.controller,online:navigator.onLine!==false,installPrompt:!!mtgteInstallPrompt});
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 21</div><div class="whyTitle">App & Offline Status</div><div class="profileStatGrid"><div class="profileStat"><b>'+esc(s.state.toUpperCase())+'</b><span class="small">STATE</span></div><div class="profileStat"><b>'+(s.online?'ONLINE':'OFFLINE')+'</b><span class="small">NETWORK</span></div><div class="profileStat"><b>'+(s.installable?'YES':'NO')+'</b><span class="small">INSTALLABLE</span></div></div><div class="hostMuted" style="margin-top:12px">When hosted over HTTPS, the app shell caches locally so the interface can reopen without a network connection. Live multiplayer still requires network connectivity.</div>'+(s.installable?'<button id="installPwaBtn" class="btn">INSTALL APP</button>':'')+'</div>';
 if(s.installable)$('installPwaBtn').onclick=installPWA;
}

function showDataHealth(){
 if(!playerProfile||typeof MTGIntegrity==='undefined')return;
 const a=MTGIntegrity.auditProfile(playerProfile),h=MTGIntegrity.health(playerProfile);
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 20</div><div class="whyTitle">Data Health</div><div class="profileStatGrid"><div class="profileStat"><b>'+esc(h.status.toUpperCase())+'</b><span class="small">STATUS</span></div><div class="profileStat"><b>'+a.errors+'</b><span class="small">ERRORS</span></div><div class="profileStat"><b>'+a.warnings+'</b><span class="small">WARNINGS</span></div></div><div class="historyList" style="margin-top:12px">'+(a.issues.length?a.issues.map(i=>'<div class="historyMatch"><span><b>'+esc(i.code)+'</b><small>'+esc(i.message)+'</small></span><strong>'+esc(i.severity.toUpperCase())+'</strong></div>').join(''):'<div class="hostMuted">No integrity issues detected.</div>')+'</div><button id="repairProfileData" class="btn" '+(a.issues.length?'':'disabled')+'>REPAIR SAFE ISSUES</button></div>';
 if(a.issues.length)$('repairProfileData').onclick=()=>{const r=MTGIntegrity.repairProfile(playerProfile);playerProfile=MTGProfileStore.migrate(r.profile);saveProfile();showDataHealth();toast('Data health repair completed.')};
}

function showSyncQueue(){
 if(!playerProfile||typeof MTGSyncJournal==='undefined')return;
 const q=MTGSyncJournal.summary(playerProfile.syncJournal||{});
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 19</div><div class="whyTitle">Offline Sync Queue</div><div class="profileStatGrid"><div class="profileStat"><b>'+q.pending+'</b><span class="small">PENDING</span></div><div class="profileStat"><b>'+q.ready+'</b><span class="small">READY</span></div><div class="profileStat"><b>'+q.failed+'</b><span class="small">RETRYING</span></div></div><div class="hostMuted" style="margin-top:12px">Changes are journaled locally before any future cloud write. Failed writes remain queued with exponential backoff and can be acknowledged only after the remote provider confirms success.</div><button id="compactSyncQueue" class="btn ghost">COMPACT ACKNOWLEDGED</button></div>';
 $('compactSyncQueue').onclick=()=>{playerProfile.syncJournal=MTGSyncJournal.compact(playerProfile.syncJournal||{});profileStorage.save(playerProfile);showSyncQueue();toast('Sync queue compacted.')};
}

function showAccountLinkStatus(){
 if(!playerProfile)return;
 const a=playerProfile.auth||{mode:'guest'};
 $('modal').classList.remove('h');
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 18</div><div class="whyTitle">Account Link</div><div class="profileStatGrid"><div class="profileStat"><b>'+esc(String(a.mode||'guest').toUpperCase())+'</b><span class="small">MODE</span></div><div class="profileStat"><b>'+(a.provider?esc(String(a.provider).toUpperCase()):'LOCAL')+'</b><span class="small">PROVIDER</span></div><div class="profileStat"><b>'+(a.subject?'BOUND':'UNBOUND')+'</b><span class="small">IDENTITY</span></div></div><div class="hostMuted" style="margin-top:12px">Phase 18 adds the authenticated identity and cloud-profile contract only. No external provider is enabled yet, so your data remains local until a real provider is configured.</div></div>';
}

function showRecoveryStatus(){
 const c=typeof MTGRecovery!=='undefined'?MTGRecovery.load(localStorage,MTGSessionBoundary.recoveryKey(playerProfile?.id)):null;
 $('modal').classList.remove('h');
 if(!c){$('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 15</div><div class="whyTitle">Live Recovery</div><div class="hostMuted">No unfinished match checkpoint is stored.</div></div>';return}
 const x=MTGRecovery.summary(c),ok=MTGRecovery.recoverable(c);
 $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 15</div><div class="whyTitle">Live Recovery</div><div class="profileStatGrid"><div class="profileStat"><b>'+x.turn+'</b><span class="small">TURN</span></div><div class="profileStat"><b>'+x.players+'</b><span class="small">PLAYERS</span></div><div class="profileStat"><b>'+(ok?'READY':'STALE')+'</b><span class="small">STATUS</span></div></div><div class="hostMuted" style="margin-top:12px">Room '+esc(String(x.room||'offline').toUpperCase())+' · '+esc(x.phase||'Unknown phase')+'</div><button id="recoveryRestoreNow" class="btn" '+(ok?'':'disabled')+'>RESTORE MATCH</button><button id="recoveryDiscard" class="btn ghost">DISCARD CHECKPOINT</button></div>';
 if(ok)$('recoveryRestoreNow').onclick=()=>{const r=MTGRecovery.restore(c);st=MTGEngine.normalizeState(r.state);players=r.players;activeRoom=r.room||'';me=r.localPlayerId;HST=r.isHost?1:0;battleStarted=true;game();toast('Match restored.')};
 $('recoveryDiscard').onclick=()=>{discardLiveRecovery();showRecoveryStatus();toast('Recovery checkpoint discarded.')};
}

function showSyncStatus(){
  if(!playerProfile)return;
  playerProfile=MTGSync.ensureSync(playerProfile,syncDeviceId());profileStorage.save(playerProfile);
  const s=MTGSync.status(playerProfile);
  $('modal').classList.remove('h');
  $('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 14</div><div class="whyTitle">Sync Readiness</div><button id="changeAvatarBtn" class="btn" style="margin-top:10px">CHANGE AVATAR</button><div class="profileStatGrid" style="margin-top:10px"><div class="profileStat"><b>'+s.localRevision+'</b><span class="small">LOCAL REVISION</span></div><div class="profileStat"><b>'+s.pendingChanges+'</b><span class="small">PENDING</span></div><div class="profileStat"><b>'+(s.lastSyncAt?'READY':'LOCAL')+'</b><span class="small">STATE</span></div></div><div class="judgeBlock" style="margin-top:12px"><div class="judgeTitle">DEVICE ID</div><div class="hostMuted">'+esc(s.deviceId)+'</div></div><div class="hostMuted" style="margin-top:10px">The app now has a deterministic replica contract and conflict resolver. A real remote account provider can plug into this layer later without changing match rules or replay history.</div><button id="syncSnapshotBtn" class="btn">PREPARE SYNC SNAPSHOT</button></div>';
  $('syncSnapshotBtn').onclick=()=>{const r=MTGSync.replica(playerProfile,syncDeviceId()),blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='mtgte-sync-snapshot.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('Sync snapshot prepared.')};
}

function downloadProfileBackup(){
  if(!playerProfile)return toast('Create a profile first.');
  const text=MTGPortability.stringify(playerProfile),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='mtg-table-engine-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup exported.');
}
function importProfileBackup(){
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{const text=await f.text(),sum=MTGPortability.summary(text);choice(['Merge Backup','Replace Local Data','Cancel'],x=>{if(x==='Cancel')return;try{const mode=x==='Replace Local Data'?'replace':'merge';if(mode==='replace'&&!confirm('Replace all local profile data with this backup?'))return;playerProfile=MTGProfileStore.migrate(MTGPortability.importBackup(playerProfile,text,{mode}));saveProfile();renderProfile();toast('Backup imported: '+sum.matches+' matches · '+sum.decks+' decks.')}catch(e){toast(e.message)}})}catch(e){toast('Import failed: '+e.message)}};
  input.click();
}

function showPlaygroups(){if(!playerProfile)return;let gs=playerProfile.playgroups||[];$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet"><div class="sectionHead"><div><div class="small">PHASE 12</div><div class="whyTitle">Playgroups</div></div><button id="newPlaygroup" class="hostMini">NEW</button></div><div class="historyList">'+(gs.length?gs.map(g=>'<button class="historyMatch" data-pg="'+esc(g.id)+'"><span><b>'+esc(g.name)+'</b><small>'+Number((g.members||[]).length)+' members · '+MTGPlaygroups.groupMatches(playerProfile,g).length+' recorded matches</small></span><strong>›</strong></button>').join(''):'<div class="hostMuted">Create a playgroup to track your regular Commander table.</div>')+'</div></div>';document.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>showPlaygroupDetail(b.dataset.pg));$('newPlaygroup').onclick=()=>{let n=prompt('Playgroup name','Commander Night');if(!n?.trim())return;let g=MTGPlaygroups.create(n.trim());playerProfile=MTGPlaygroups.save(playerProfile,g);saveProfile();showPlaygroups()}}
function showPlaygroupDetail(id){let g=(playerProfile.playgroups||[]).find(x=>String(x.id)===String(id));if(!g)return;let intel=MTGPlaygroups.intelligence(playerProfile,g);$('choices').innerHTML='<div class="whySheet"><div class="whyTitle">'+esc(g.name)+'</div><div class="profileStatGrid"><div class="profileStat"><b>'+intel.games+'</b><span class="small">MATCHES</span></div><div class="profileStat"><b>'+Number((g.members||[]).length)+'</b><span class="small">MEMBERS</span></div><div class="profileStat"><b>'+(intel.bestDeck?Math.round(intel.bestDeck.winRate*100)+'%':'—')+'</b><span class="small">BEST DECK WR</span></div></div><div class="whyTitle" style="margin-top:14px">Members</div><div class="historyList">'+((g.members||[]).length?g.members.map(m=>'<div class="historyMatch"><span><b>'+esc(m.name)+'</b><small>'+(m.code?'TME-'+esc(m.code):'Local member')+'</small></span></div>').join(''):'<div class="hostMuted">No members yet.</div>')+'</div><button id="pgAdd" class="btn">ADD MEMBER</button><button id="pgDelete" class="btn ghost">DELETE PLAYGROUP</button></div>';$('pgAdd').onclick=()=>{let n=prompt('Member name');if(!n)return;let c=prompt('Friend code (optional)','');g=MTGPlaygroups.addMember(g,{name:n,code:c});playerProfile=MTGPlaygroups.save(playerProfile,g);saveProfile();showPlaygroupDetail(id)};$('pgDelete').onclick=()=>{if(!confirm('Delete this playgroup? Match history will remain.'))return;playerProfile=MTGPlaygroups.remove(playerProfile,id);saveProfile();showPlaygroups()}}
function runTargetingQA(){if(typeof MTGTargeting==='undefined')return toast('Targeting module unavailable.');let r=MTGTargeting.localQA(MTGEngine);$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 39 · LOCAL QA</div><div class="whyTitle">Targeting '+(r.ok?'PASS':'FAIL')+'</div><div class="historyList" style="margin-top:12px">'+r.checks.map(c=>'<div class="historyMatch"><span><b>'+esc(c[0])+'</b><small>Authoritative targeting check</small></span><strong>'+(c[1]?'✓':'!')+'</strong></div>').join('')+'</div></div>'}function showTargetingStatus(){$('modal').classList.remove('h');$('choices').innerHTML='<div class="whySheet"><div class="small">PHASE 39</div><div class="whyTitle">Targeting & Selection</div><div class="hostMuted" style="margin-top:12px">Players and battlefield objects can be tracked in an authoritative target set. Zone changes automatically remove stale permanent targets.</div><button id="runTargetingQA" class="btn" style="margin-top:12px">RUN LOCAL TARGETING QA</button></div>';$('runTargetingQA').onclick=runTargetingQA}
