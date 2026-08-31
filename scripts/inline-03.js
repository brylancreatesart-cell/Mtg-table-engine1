
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGPWA=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase21-pwa-shell-1',CACHE_VERSION='mtgte-shell-v21';
const CORE_ASSETS=['/','/index.html','/manifest.webmanifest','/src/styles.css','/src/app.js','/src/engine.js','/src/profile-store.js','/src/deck-engine.js','/src/avatar-registry.js','/src/match-records.js','/src/history-analytics.js','/src/playgroups.js','/src/portability.js','/src/sync-engine.js','/src/storage-adapter.js','/src/recovery-engine.js','/src/accounts.js','/src/session-boundary.js','/src/auth-contract.js','/src/cloud-sync.js','/src/sync-journal.js','/src/integrity.js','/src/pwa.js','/icons/icon-192.png','/icons/icon-512.png'];
function supported(env={}){return !!(env.navigator?.serviceWorker&&env.location&&/^https?:$/.test(env.location.protocol||''))}
function installable(event){return !!(event&&typeof event.prompt==='function')}
function networkState(env={}){return env.navigator?.onLine===false?'offline':'online'}
function shellAssets(extra=[]){return [...new Set([...CORE_ASSETS,...extra])]}
function status({registered=false,controller=false,online=true,installPrompt=false}={}){
  return{registered:!!registered,controlled:!!controller,online:!!online,installable:!!installPrompt,state:!online?'offline':controller?'ready':registered?'registered':'web'};
}
async function register(env){
  env=env||((typeof window!=='undefined')?window:null);
  if(!env||!supported(env))return{supported:false,registration:null};
  try{const registration=await env.navigator.serviceWorker.register('/sw.js',{scope:'/'});return{supported:true,registration}}catch(error){return{supported:true,registration:null,error}}
}
return{VERSION,CACHE_VERSION,CORE_ASSETS,supported,installable,networkState,shellAssets,status,register};
});
