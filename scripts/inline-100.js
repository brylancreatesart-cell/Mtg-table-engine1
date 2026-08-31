
/* Side Quest — Supabase-backed real accounts. Passwords are handled only by Supabase Auth and are never stored by MTG Table Engine. */
(function(root){
'use strict';
const PROJECT_URL='https://ccuzadxmhacuwoaisdts.supabase.co';
const API_KEY='sb_publishable_ymrKqdT5RGxsV4wDWgCP_w_9up4TKI8';
let accessToken=null,authUser=null;
async function request(path,{method='GET',body=null,auth=false,headers={}}={}){
  const h={'apikey':API_KEY,'Content-Type':'application/json',...headers};
  if(auth&&accessToken)h.Authorization='Bearer '+accessToken;
  const r=await fetch(PROJECT_URL+path,{method,headers:h,body:body==null?undefined:JSON.stringify(body)});
  let data=null;try{data=await r.json()}catch{data=null}
  if(!r.ok){const msg=data?.msg||data?.message||data?.error_description||data?.error||('Request failed ('+r.status+')');const e=new Error(msg);e.status=r.status;e.data=data;throw e}
  return data;
}
function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
function signedIn(){return !!(accessToken&&authUser?.id)}
function currentUser(){return authUser?JSON.parse(JSON.stringify(authUser)):null}
async function signUp(email,password){
  const data=await request('/auth/v1/signup',{method:'POST',body:{email:normalizeEmail(email),password}});
  if(data?.access_token){accessToken=data.access_token;authUser=data.user||null}
  return data;
}
async function signIn(email,password){
  const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:normalizeEmail(email),password}});
  accessToken=data?.access_token||null;authUser=data?.user||null;
  if(!signedIn())throw new Error('Sign in did not return an active session.');
  return data;
}
async function signOut(){try{if(accessToken)await request('/auth/v1/logout',{method:'POST',auth:true})}catch{}accessToken=null;authUser=null;return true}
function clearMemory(){accessToken=null;authUser=null}
async function loadProfileRow(){
  if(!signedIn())throw new Error('Sign in required.');
  const rows=await request('/rest/v1/mtge_profiles?select=*&user_id=eq.'+encodeURIComponent(authUser.id)+'&limit=1',{auth:true,headers:{Accept:'application/json'}});
  return Array.isArray(rows)?(rows[0]||null):null;
}
async function upsertProfile(profile,{onboardingComplete=null}={}){
  if(!signedIn())throw new Error('Sign in required.');
  const complete=onboardingComplete==null?!!profile?.onboardingComplete:!!onboardingComplete;
  const payload={user_id:authUser.id,display_name:String(profile?.displayName||profile?.name||'Player').slice(0,64),username:profile?.username?String(profile.username).toLowerCase().slice(0,32):null,avatar_id:profile?.avatarId||null,friend_code:profile?.friendCode||null,onboarding_complete:complete,profile_data:profile||{},updated_at:new Date().toISOString()};
  const rows=await request('/rest/v1/mtge_profiles?on_conflict=user_id',{method:'POST',auth:true,headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:payload});
  return Array.isArray(rows)?rows[0]:rows;
}
async function setOnboardingComplete(complete,profile){return upsertProfile({...profile,onboardingComplete:!!complete},{onboardingComplete:!!complete})}
root.MTGCloudAccount={VERSION:'supabase-account-front-door-1',signUp,signIn,signOut,clearMemory,signedIn,currentUser,loadProfileRow,upsertProfile,setOnboardingComplete};
})(typeof window!=='undefined'?window:this);
