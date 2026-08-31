
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGAuth=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase18-auth-contract-1',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
const uid=(p='auth')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);

function normalizeIdentity(x={}){
  return {
    provider:String(x.provider||'local'),
    subject:String(x.subject||x.sub||''),
    email:x.email?String(x.email).toLowerCase():null,
    displayName:x.displayName||x.name||null,
    avatarUrl:x.avatarUrl||x.picture||null
  };
}
function identityKey(identity){
  const i=normalizeIdentity(identity);
  if(!i.subject)throw new Error('Identity subject required');
  return i.provider+':'+i.subject;
}
function createBinding(profileId,identity){
  if(!profileId)throw new Error('Profile ID required');
  const i=normalizeIdentity(identity);
  return {schemaVersion:SCHEMA,id:uid('binding'),profileId:String(profileId),identity:i,identityKey:identityKey(i),createdAt:now(),lastSeenAt:now()};
}
function sessionClaims(binding,{expiresAt=null,issuedAt=Date.now()}={}){
  if(!binding?.profileId||!binding?.identityKey)throw new Error('Valid binding required');
  return {schemaVersion:SCHEMA,profileId:binding.profileId,identityKey:binding.identityKey,issuedAt,expiresAt,sessionId:uid('sess')};
}
function validateClaims(c,{at=Date.now()}={}){
  if(!c||Number(c.schemaVersion)!==SCHEMA||!c.profileId||!c.identityKey)throw new Error('Invalid session claims');
  if(c.expiresAt!=null&&Number(c.expiresAt)<=at)throw new Error('Session expired');
  return clone(c);
}
function profileEnvelope(profile,binding){
  if(!profile?.id)throw new Error('Profile required');
  if(String(profile.id)!==String(binding?.profileId))throw new Error('Binding/profile mismatch');
  const p=clone(profile);
  delete p.auth;
  return {format:'mtgte-cloud-profile',schemaVersion:SCHEMA,profileId:p.id,identityKey:binding.identityKey,updatedAt:now(),profile:p};
}
function validateEnvelope(e){
  if(!e||e.format!=='mtgte-cloud-profile'||Number(e.schemaVersion)!==SCHEMA)throw new Error('Invalid cloud profile envelope');
  if(!e.profile||String(e.profile.id)!==String(e.profileId))throw new Error('Envelope profile mismatch');
  return clone(e);
}
class MemoryAuthProvider{
  constructor(identity=null){this.identity=identity}
  async signIn(identity){this.identity=normalizeIdentity(identity);if(!this.identity.subject)throw new Error('Identity subject required');return clone(this.identity)}
  async signOut(){this.identity=null;return true}
  async currentIdentity(){return this.identity?clone(this.identity):null}
}
class MemoryCloudProfileStore{
  constructor(){this.map=new Map()}
  async load(profileId){const x=this.map.get(String(profileId));return x?clone(x):null}
  async save(envelope){const e=validateEnvelope(envelope);this.map.set(String(e.profileId),clone(e));return clone(e)}
}
function attachIdentity(profile,identity){
  const p=clone(profile),i=normalizeIdentity(identity);
  p.auth={mode:'authenticated',provider:i.provider,subject:i.subject,email:i.email||null};
  p.updatedAt=now();return p;
}
function detachIdentity(profile){
  const p=clone(profile);p.auth={mode:'guest',provider:null,subject:null};p.updatedAt=now();return p;
}
return{VERSION,SCHEMA,normalizeIdentity,identityKey,createBinding,sessionClaims,validateClaims,profileEnvelope,validateEnvelope,MemoryAuthProvider,MemoryCloudProfileStore,attachIdentity,detachIdentity};
});
