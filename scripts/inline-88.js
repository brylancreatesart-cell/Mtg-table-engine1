
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGAccounts=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase16-local-account-boundaries-1',INDEX_KEY='mtgte_accounts_index_v1',ACTIVE_KEY='mtgte_active_account_v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=x=>String(x||'').trim();
function accountKey(id){return 'mtgte_account_'+String(id)}
function readIndex(storage){storage=storage||localStorage;try{const x=JSON.parse(storage.getItem(INDEX_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function writeIndex(list,storage){storage=storage||localStorage;storage.setItem(INDEX_KEY,JSON.stringify(list));return list}
function activeId(storage){storage=storage||localStorage;return storage.getItem(ACTIVE_KEY)||null}
function setActive(id,storage){storage=storage||localStorage;if(id)storage.setItem(ACTIVE_KEY,String(id));else storage.removeItem(ACTIVE_KEY);return id||null}
function saveAccount(profile,storage){
 storage=storage||localStorage;if(!profile?.id)throw new Error('Profile ID required');
 storage.setItem(accountKey(profile.id),JSON.stringify(profile));
 let idx=readIndex(storage),item={id:profile.id,displayName:profile.displayName||profile.name||'Player',username:profile.username||'',avatarId:profile.avatarId||null,updatedAt:new Date().toISOString()};
 const i=idx.findIndex(x=>String(x.id)===String(profile.id));if(i>=0)idx[i]=item;else idx.unshift(item);writeIndex(idx,storage);return profile;
}
function loadAccount(id,storage){storage=storage||localStorage;if(!id)return null;try{return JSON.parse(storage.getItem(accountKey(id))||'null')}catch{return null}}
function removeAccount(id,storage){
 storage=storage||localStorage;storage.removeItem(accountKey(id));let idx=readIndex(storage).filter(x=>String(x.id)!==String(id));writeIndex(idx,storage);if(activeId(storage)===String(id))setActive(idx[0]?.id||null,storage);return idx;
}
function migrateLegacy(profile,storage){if(!profile?.id)return null;saveAccount(profile,storage);setActive(profile.id,storage);return profile}
function list(storage){return readIndex(storage)}
function exportAccount(id,storage){const p=loadAccount(id,storage);if(!p)throw new Error('Account not found');return clone(p)}
return{VERSION,INDEX_KEY,ACTIVE_KEY,accountKey,readIndex,writeIndex,activeId,setActive,saveAccount,loadAccount,removeAccount,migrateLegacy,list,exportAccount};
});
