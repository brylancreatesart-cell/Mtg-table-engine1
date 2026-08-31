
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSessionBoundary=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase17-session-boundaries-1';
const RECOVERY_PREFIX='mtgte_live_checkpoint_v1_';
const PREF_PREFIX='mtgte_account_prefs_';
function recoveryKey(accountId){return RECOVERY_PREFIX+String(accountId||'guest')}
function prefsKey(accountId){return PREF_PREFIX+String(accountId||'guest')}
function canSwitch({battleStarted=false,recoveryExists=false}={}){return !battleStarted&&!recoveryExists}
function switchRisk({battleStarted=false,recoveryExists=false}={}){if(battleStarted)return'active-match';if(recoveryExists)return'unfinished-match';return null}
function savePrefs(accountId,prefs,storage){storage=storage||localStorage;storage.setItem(prefsKey(accountId),JSON.stringify(prefs||{}));return prefs||{}}
function loadPrefs(accountId,defaults={},storage){storage=storage||localStorage;try{return{...defaults,...JSON.parse(storage.getItem(prefsKey(accountId))||'{}')}}catch{return{...defaults}}}
return{VERSION,recoveryKey,prefsKey,canSwitch,switchRisk,savePrefs,loadPrefs};
});
