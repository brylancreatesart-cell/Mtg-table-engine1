
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGZones=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase38-zones-1';
 const ZONES=['battlefield','graveyard','exile','hand','command'];
 function clone(x){return JSON.parse(JSON.stringify(x));}
 function zoneName(z){z=String(z||'battlefield').toLowerCase();return ZONES.includes(z)?z:'battlefield'}
 function moveIntent(objectId,toZone,opts={}){return{type:'OBJECT_ZONE_CHANGED',payload:{objectId:String(objectId),toZone:zoneName(toZone),controllerId:opts.controllerId==null?null:Number(opts.controllerId),reset:opts.reset!==false}}}
 function summarize(state){const out={};for(const z of ZONES)out[z]=(state.zones?.[z]||[]).map(clone);out.battlefield=(state.battle||[]).map(clone);return out}
 function localQA(engine){let st=engine.normalizeState({battle:[{id:'z1',name:'QA Permanent',owner:1,controllerId:2,tapped:true,c:{'+1/+1':'2'},q:'1'}],zones:{},events:[],snapshots:[],feed:[]});
  function emit(i){return engine.reduce(st,{id:'qz'+(st.meta.seq+1),seq:++st.meta.seq,type:i.type,actorId:1,payload:i.payload,at:Date.now(),source:'qa'})}
  emit(moveIntent('z1','graveyard'));
  const gy=st.zones.graveyard?.find(x=>x.id==='z1');
  emit(moveIntent('z1','battlefield'));
  const bf=st.battle.find(x=>x.id==='z1');
  const checks=[['moved off battlefield',!!gy],['graveyard state reset',gy?.tapped===false&&Number(gy?.controllerId)===1&&Object.keys(gy?.c||{}).length===0],['returned to battlefield',!!bf],['identity preserved',bf?.id==='z1'],['controller reset to owner',Number(bf?.controllerId)===1]];
  return{ok:checks.every(x=>x[1]),checks,state:st}
 }
 return{VERSION,ZONES,zoneName,moveIntent,summarize,localQA}
});

