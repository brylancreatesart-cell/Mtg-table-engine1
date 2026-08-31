#!/usr/bin/env python3
from pathlib import Path

ACCOUNT=Path('scripts/inline-100.js')
SRC_DIR=Path('scripts/app-src')

account=ACCOUNT.read_text(encoding='utf-8')
old="""const PROJECT_URL='https://ccuzadxmhacuwoaisdts.supabase.co';
const API_KEY='sb_publishable_ymrKqdT5RGxsV4wDWgCP_w_9up4TKI8';
let accessToken=null,authUser=null;
"""
new="""const PROJECT_URL='https://ccuzadxmhacuwoaisdts.supabase.co';
const API_KEY='sb_publishable_ymrKqdT5RGxsV4wDWgCP_w_9up4TKI8';
const SESSION_KEY='mtgte_supabase_session_v1';
let accessToken=null,authUser=null,refreshToken=null,expiresAt=0;
function sessionStore(){try{return localStorage}catch{return null}}
function persistSession(){let s=sessionStore();if(!s)return false;if(!accessToken||!refreshToken||!authUser?.id){s.removeItem(SESSION_KEY);return false}try{s.setItem(SESSION_KEY,JSON.stringify({accessToken,refreshToken,authUser,expiresAt}));return true}catch{return false}}
function forgetSession(){try{sessionStore()?.removeItem(SESSION_KEY)}catch{}accessToken=null;refreshToken=null;authUser=null;expiresAt=0;return true}
function adoptSession(data){accessToken=data?.access_token||null;refreshToken=data?.refresh_token||refreshToken||null;authUser=data?.user||authUser||null;expiresAt=Date.now()+Math.max(0,Number(data?.expires_in||3600)-30)*1000;if(!accessToken||!authUser?.id)return false;persistSession();return true}
async function restoreSession(){let raw=null;try{raw=sessionStore()?.getItem(SESSION_KEY)||null}catch{}if(!raw)return false;let saved;try{saved=JSON.parse(raw)}catch{forgetSession();return false}refreshToken=String(saved?.refreshToken||'')||null;authUser=saved?.authUser||null;accessToken=saved?.accessToken||null;expiresAt=Number(saved?.expiresAt||0);if(!refreshToken||!authUser?.id){forgetSession();return false}try{const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:refreshToken}});if(!adoptSession(data))throw new Error('Session refresh did not return an active account.');return true}catch(e){forgetSession();return false}}
"""
if account.count(old)!=1: raise SystemExit(f'Safety stop: account header expected once, found {account.count(old)}')
account=account.replace(old,new,1)
account=account.replace("if(data?.access_token){accessToken=data.access_token;authUser=data.user||null}","if(data?.access_token)adoptSession(data)",1)
old_signin="""  accessToken=data?.access_token||null;authUser=data?.user||null;
  if(!signedIn())throw new Error('Sign in did not return an active session.');
"""
new_signin="""  if(!adoptSession(data))throw new Error('Sign in did not return an active session.');
"""
if account.count(old_signin)!=1: raise SystemExit('Safety stop: sign-in session assignment not found')
account=account.replace(old_signin,new_signin,1)
old_out="async function signOut(){try{if(accessToken)await request('/auth/v1/logout',{method:'POST',auth:true})}catch{}accessToken=null;authUser=null;return true}\nfunction clearMemory(){accessToken=null;authUser=null}"
new_out="async function signOut(){try{if(accessToken)await request('/auth/v1/logout',{method:'POST',auth:true})}catch{}forgetSession();return true}\nfunction clearMemory(){accessToken=null;authUser=null;refreshToken=null;expiresAt=0}"
if account.count(old_out)!=1: raise SystemExit('Safety stop: sign-out block not found')
account=account.replace(old_out,new_out,1)
old_export="root.MTGCloudAccount={VERSION:'supabase-account-front-door-1',signUp,signIn,signOut,clearMemory,signedIn,currentUser,loadProfileRow,upsertProfile,setOnboardingComplete};"
new_export="root.MTGCloudAccount={VERSION:'supabase-account-front-door-2',signUp,signIn,signOut,clearMemory,forgetSession,restoreSession,signedIn,currentUser,loadProfileRow,upsertProfile,setOnboardingComplete};"
if account.count(old_export)!=1: raise SystemExit('Safety stop: account export not found')
account=account.replace(old_export,new_export,1)
ACCOUNT.write_text(account,encoding='utf-8')

old_load="""function loadProfile(){
 if(sharedDisplayMode){MTGCloudAccount.clearMemory();startSharedDisplayMode();return}
 clearLegacyGuestPersistence();MTGCloudAccount.clearMemory();showFrontDoor();
}
"""
new_load="""async function loadProfile(){
 if(sharedDisplayMode){MTGCloudAccount.clearMemory();startSharedDisplayMode();return}
 clearLegacyGuestPersistence();
 try{if(await MTGCloudAccount.restoreSession?.()){await enterAuthenticatedAccount();return}}catch(e){console.warn('Account session restore failed',e)}
 MTGCloudAccount.clearMemory();showFrontDoor();
}
"""
found=[]
for p in sorted(SRC_DIR.glob('controller-part-*.part.js')):
    text=p.read_text(encoding='utf-8');n=text.count(old_load)
    if n:found.append((p,n,text))
if sum(n for _,n,_ in found)!=1:raise SystemExit('Safety stop: loadProfile block not found exactly once')
p,_,text=found[0];p.write_text(text.replace(old_load,new_load,1),encoding='utf-8')

# Choosing Guest must intentionally forget any remembered account session.
old_guest="function startGuestIdentity(){\n clearLegacyGuestPersistence();MTGCloudAccount.clearMemory();"
new_guest="function startGuestIdentity(){\n clearLegacyGuestPersistence();MTGCloudAccount.forgetSession?.();MTGCloudAccount.clearMemory();"
found=[]
for p in sorted(SRC_DIR.glob('controller-part-*.part.js')):
    text=p.read_text(encoding='utf-8');n=text.count(old_guest)
    if n:found.append((p,n,text))
if sum(n for _,n,_ in found)!=1:raise SystemExit('Safety stop: guest identity block not found exactly once')
p,_,text=found[0];p.write_text(text.replace(old_guest,new_guest,1),encoding='utf-8')
print('batch 4 returning-account session repair applied')
