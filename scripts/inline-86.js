
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGStorage=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase14-storage-adapter-1';
class MemoryReplicaAdapter{
  constructor(seed=null){this.value=seed}
  async pull(){return this.value?JSON.parse(JSON.stringify(this.value)):null}
  async push(replica){this.value=JSON.parse(JSON.stringify(replica));return this.pull()}
}
class SyncCoordinator{
  constructor(adapter,syncApi){this.adapter=adapter;this.sync=syncApi||(typeof MTGSync!=='undefined'?MTGSync:null)}
  async synchronize(profile,deviceId){
    if(!this.sync)throw new Error('Sync engine unavailable');
    const remote=await this.adapter.pull();
    let merged=remote?this.sync.mergeReplica(profile,remote,deviceId):this.sync.ensureSync(profile,deviceId);
    const localReplica=this.sync.replica(merged,deviceId);
    const saved=await this.adapter.push(localReplica);
    merged=this.sync.mergeReplica(merged,saved,deviceId);
    return{profile:merged,replica:saved,status:this.sync.status(merged)}
  }
}
return{VERSION,MemoryReplicaAdapter,SyncCoordinator};
});
