
/* Phase 108 side hardening — friend codes, presence identity, and current-room deep links. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGSocialInvites=api})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const VERSION='phase108-friend-room-invite-hardening-1';
 const SIX=/^[A-Z0-9]{6}$/;
 function compact(v){return String(v??'').trim().toUpperCase().replace(/\s+/g,'')}
 function normalizeFriendCode(v){let x=compact(v).replace(/^TME[-:]?/,'').replace(/-/g,'');return SIX.test(x)?x:null}
 function fullFriendCode(v){let x=normalizeFriendCode(v);return x?'TME-'+x:null}
 function normalizeRoomCode(v){let x=compact(v).replace(/[^A-Z0-9]/g,'');return SIX.test(x)?x:null}
 function safeName(v,fallback='A friend'){let x=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,64);return x||fallback}
 function asUrl(input){try{if(input instanceof URL)return new URL(input.href);if(typeof input==='string')return new URL(input);if(input?.href)return new URL(input.href);if(input?.origin&&input?.pathname)return new URL(String(input.origin)+String(input.pathname));}catch{}return null}
 function buildRoomInviteUrl(locationLike,{room,from,friendCode}={}){let r=normalizeRoomCode(room),u=asUrl(locationLike);if(!r||!u)return null;u.hash='';u.search='';u.searchParams.set('invite',r);u.searchParams.set('from',safeName(from));let f=normalizeFriendCode(friendCode);if(f)u.searchParams.set('friend',f);return u.toString()}
 function parseRoomInviteUrl(input){let u=asUrl(input);if(!u)return null;let room=normalizeRoomCode(u.searchParams.get('invite'));if(!room)return null;return{room,fromName:safeName(u.searchParams.get('from')),fromCode:normalizeFriendCode(u.searchParams.get('friend')),source:'link'}}
 function stripInviteParams(input){let u=asUrl(input);if(!u)return null;['invite','from','friend'].forEach(k=>u.searchParams.delete(k));return u.pathname+(u.search||'')+(u.hash||'')}
 function localQA(){let checks=[];const ck=(n,v)=>checks.push([n,!!v]);ck('full friend code normalizes',normalizeFriendCode('tme-7k4p9x')==='7K4P9X');ck('bare friend code normalizes',normalizeFriendCode('7k4p9x')==='7K4P9X');ck('friend code separators normalize',normalizeFriendCode('TME-7K4-P9X')==='7K4P9X');ck('bad friend code rejected',normalizeFriendCode('TME-123')===null);ck('full friend code formats',fullFriendCode('7k4p9x')==='TME-7K4P9X');ck('room code normalizes',normalizeRoomCode(' a1b2c3 ')==='A1B2C3');let u=buildRoomInviteUrl('https://table.example/app/index.html?old=1#battle',{room:'a1b2c3',from:'Brylan',friendCode:'TME-7K4P9X'});let q=parseRoomInviteUrl(u);ck('current-room invite URL built',!!u&&u.includes('invite=A1B2C3'));ck('invite URL strips stale query/hash',!!u&&!u.includes('old=1')&&!u.includes('#battle'));ck('invite URL round trips room',q?.room==='A1B2C3');ck('invite URL round trips sender',q?.fromName==='Brylan'&&q?.fromCode==='7K4P9X');ck('invalid invite rejected',parseRoomInviteUrl('https://table.example/?invite=BAD')===null);return{ok:checks.every(x=>x[1]),checks,version:VERSION}}
 return{VERSION,normalizeFriendCode,fullFriendCode,normalizeRoomCode,safeName,buildRoomInviteUrl,parseRoomInviteUrl,stripInviteParams,localQA};
});