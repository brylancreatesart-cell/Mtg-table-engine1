
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGBattlefieldInteractions=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase37-battlefield-interactions-1';
 function clone(x){return JSON.parse(JSON.stringify(x));}
 function normalizeObject(o={}){const x=clone(o);x.id=String(x.id||'');x.owner=Number(x.owner||0)||0;x.controllerId=Number(x.controllerId??x.owner)||x.owner;x.tapped=!!x.tapped;x.q=String(x.q??'1');x.c=(x.c&&typeof x.c==='object'&&!Array.isArray(x.c))?x.c:{};return x}
 function counters(o={}){const c=normalizeObject(o).c;return Object.entries(c).filter(([,v])=>{try{return BigInt(String(v||0))!==0n}catch{return Number(v)!==0}}).map(([name,value])=>({name,value:String(value)}))}
 function summary(o={}){const x=normalizeObject(o),cs=counters(x);return{id:x.id,owner:x.owner,controllerId:x.controllerId,tapped:x.tapped,quantity:x.q,token:!!x.token,counters:cs,label:[x.tapped?'Tapped':'Untapped',x.controllerId&&x.owner&&x.controllerId!==x.owner?'Controlled by P'+x.controllerId:null,cs.length?cs.map(c=>c.name+' '+c.value).join(', '):null].filter(Boolean).join(' · ')}}
 function tapIntent(objectId,tapped){return{type:'PERMANENT_TAPPED_SET',payload:{objectId:String(objectId),tapped:!!tapped}}}
 function controllerIntent(objectId,controllerId){return{type:'PERMANENT_CONTROLLER_CHANGED',payload:{objectId:String(objectId),controllerId:Number(controllerId)}}}
 function counterIntent(objectId,counter,delta){return{type:'PERMANENT_COUNTER_CHANGED',payload:{objectId:String(objectId),counter:String(counter||'+1/+1'),delta:String(delta??1)}}}
 function tokenQuantityIntent(objectId,delta){return{type:'TOKEN_COHORT_QUANTITY_CHANGED',payload:{objectId:String(objectId),delta:String(delta??0)}}}
 function localQA(engine){let st=engine.normalizeState({battle:[{id:'qa_perm',name:'QA Permanent',owner:1,controllerId:1,tapped:false,c:{},q:'1'},{id:'qa_token',name:'QA Token',owner:1,controllerId:1,token:1,q:'3',c:{}}],events:[],snapshots:[],feed:[]});
  const emit=i=>engine.reduce(st,{id:'qa_'+(st.meta.seq+1),seq:++st.meta.seq,type:i.type,actorId:1,payload:i.payload,at:Date.now(),source:'qa'});
  emit(tapIntent('qa_perm',true));emit(controllerIntent('qa_perm',2));emit(counterIntent('qa_perm','+1/+1',2));emit(tokenQuantityIntent('qa_token',-1));
  const p=st.battle.find(x=>x.id==='qa_perm'),t=st.battle.find(x=>x.id==='qa_token');const checks=[['tap state',p?.tapped===true],['controller change',p?.controllerId===2],['permanent counter',String(p?.c?.['+1/+1'])==='2'],['token quantity',String(t?.q)==='2']];let us=engine.normalizeState({phase:'CLEANUP',active:2,turn:2,battle:[{id:'stunned',name:'Stunned Permanent',owner:1,controllerId:1,tapped:true,c:{stun:'2'},q:'1'}],events:[],snapshots:[],feed:[]}),ue=()=>engine.reduce(us,engine.makeEvent(us,'TURN_ADVANCED',{playerOrder:[1,2],autoDraw:false},Number(us.active||1),{source:'qa'}));ue();let so=us.battle.find(x=>x.id==='stunned');checks.push(['first untap attempt consumes one stun counter and stays tapped',us.phase==='UNTAP'&&us.active===1&&so?.tapped===true&&String(so?.c?.stun)==='1']);us.phase='CLEANUP';us.active=2;ue();so=us.battle.find(x=>x.id==='stunned');checks.push(['second untap attempt consumes final stun counter and stays tapped',so?.tapped===true&&String(so?.c?.stun)==='0']);us.phase='CLEANUP';us.active=2;ue();so=us.battle.find(x=>x.id==='stunned');checks.push(['later untap succeeds after stun counters are gone',so?.tapped===false&&String(so?.c?.stun)==='0']);return{ok:checks.every(x=>x[1]),checks,state:st}
 }
 return{VERSION,normalizeObject,counters,summary,tapIntent,controllerIntent,counterIntent,tokenQuantityIntent,localQA}
});

