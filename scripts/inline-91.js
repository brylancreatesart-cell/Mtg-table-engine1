
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGCloudSync=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase18-cloud-sync-coordinator-1';
class Coordinator{
  constructor({authApi,cloudStore,syncApi,authContract}){this.auth=authApi;this.cloud=cloudStore;this.sync=syncApi;this.contract=authContract||(typeof MTGAuth!=='undefined'?MTGAuth:null)}
  async signInAndSync(profile,identity,deviceId){
    const signed=await this.auth.signIn(identity);
    if(!this.contract)throw new Error('Auth contract unavailable');
    const binding=this.contract.createBinding(profile.id,signed);
    let local=this.contract.attachIdentity(profile,signed);
    const remoteEnvelope=await this.cloud.load(profile.id);
    if(remoteEnvelope){
      const remote=this.contract.validateEnvelope(remoteEnvelope);
      const remoteReplica=this.sync.replica(remote.profile,remote.profile.sync?.deviceId||'remote');
      local=this.sync.mergeReplica(local,remoteReplica,deviceId);
    }
    const env=this.contract.profileEnvelope(local,binding);
    await this.cloud.save(env);
    return{profile:local,binding,identity:signed,envelope:env};
  }
  async push(profile,binding){
    if(!this.contract)throw new Error('Auth contract unavailable');
    const env=this.contract.profileEnvelope(profile,binding);
    await this.cloud.save(env);return env;
  }
  async signOut(profile){
    await this.auth.signOut();
    if(!this.contract)throw new Error('Auth contract unavailable');
    return this.contract.detachIdentity(profile);
  }
}
return{VERSION,Coordinator};
});
