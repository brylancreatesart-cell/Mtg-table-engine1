
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGIntegrity=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase20-integrity-migrations-1',PROFILE_SCHEMA=3;
const clone=x=>JSON.parse(JSON.stringify(x));
function issue(code,severity,message,path=''){return{code,severity,message,path}}
function migrateProfile(input){
  let p=clone(input||{}),from=Number(p.schemaVersion||1),steps=[];
  if(from<2){
    p.schemaVersion=2;p.displayName=p.displayName||p.name||'Player';p.name=p.displayName;
    p.decks=p.decks||[];p.history=p.history||[];p.playgroups=p.playgroups||[];p.friends=p.friends||[];p.recentPlayers=p.recentPlayers||[];
    steps.push('1→2');from=2;
  }
  if(from<3){
    p.schemaVersion=3;p.sync=p.sync||null;p.syncJournal=p.syncJournal||{schemaVersion:1,entries:[],lastAckRevision:0};
    p.auth=p.auth||{mode:'guest',provider:null,subject:null};steps.push('2→3');from=3;
  }
  p.schemaVersion=PROFILE_SCHEMA;
  return{profile:p,steps,changed:steps.length>0};
}
function auditProfile(input){
  const p=clone(input||{}),issues=[];
  if(!p.id)issues.push(issue('PROFILE_ID_MISSING','error','Profile ID is missing.','id'));
  if(!p.displayName&&!p.name)issues.push(issue('DISPLAY_NAME_MISSING','warning','Display name is missing.','displayName'));
  for(const k of ['decks','history','playgroups','friends','recentPlayers'])if(!Array.isArray(p[k]))issues.push(issue('COLLECTION_INVALID','error',k+' must be an array.',k));
  const dup=(arr,key='id')=>{const seen=new Set();for(const x of arr||[]){const v=String(x?.[key]||'');if(v&&seen.has(v))return v;if(v)seen.add(v)}return null};
  const dh=dup(p.history);if(dh)issues.push(issue('DUPLICATE_MATCH_ID','error','Duplicate match ID '+dh+'.','history'));
  const dd=dup(p.decks);if(dd)issues.push(issue('DUPLICATE_DECK_ID','error','Duplicate deck ID '+dd+'.','decks'));
  const dp=dup(p.playgroups);if(dp)issues.push(issue('DUPLICATE_PLAYGROUP_ID','error','Duplicate playgroup ID '+dp+'.','playgroups'));
  for(const m of p.history||[]){
    if(!m.id)issues.push(issue('MATCH_ID_MISSING','error','A history record has no ID.','history'));
    if(m.deckId&&m.deckVersionId){
      const d=(p.decks||[]).find(x=>x.id===m.deckId);
      if(d&&!(d.versions||[]).some(v=>v.id===m.deckVersionId))issues.push(issue('DECK_VERSION_ORPHAN','warning','Match '+m.id+' references a missing deck version.','history.'+m.id+'.deckVersionId'));
    }
  }
  if(p.stats){
    const games=(p.history||[]).length,wins=(p.history||[]).filter(m=>m.result==='win').length,losses=(p.history||[]).filter(m=>m.result==='loss').length;
    if(Number(p.stats.games||0)!==games||Number(p.stats.wins||0)!==wins||Number(p.stats.losses||0)!==losses)issues.push(issue('STATS_DRIFT','warning','Profile aggregate stats do not match durable history.','stats'));
  }
  return{ok:!issues.some(x=>x.severity==='error'),issues,errors:issues.filter(x=>x.severity==='error').length,warnings:issues.filter(x=>x.severity==='warning').length};
}
function repairProfile(input){
  let {profile:p,steps}=migrateProfile(input),repairs=[...steps];
  for(const k of ['decks','history','playgroups','friends','recentPlayers'])if(!Array.isArray(p[k])){p[k]=[];repairs.push('reset:'+k)}
  function unique(arr){const seen=new Set();return(arr||[]).filter(x=>{const k=String(x?.id||'');if(!k)return true;if(seen.has(k))return false;seen.add(k);return true})}
  const before=[p.decks.length,p.history.length,p.playgroups.length];
  p.decks=unique(p.decks);p.history=unique(p.history);p.playgroups=unique(p.playgroups);
  if(before[0]!==p.decks.length)repairs.push('dedupe:decks');if(before[1]!==p.history.length)repairs.push('dedupe:history');if(before[2]!==p.playgroups.length)repairs.push('dedupe:playgroups');
  p.stats={games:p.history.length,wins:p.history.filter(m=>m.result==='win').length,losses:p.history.filter(m=>m.result==='loss').length};repairs.push('recompute:stats');
  return{profile:p,repairs,audit:auditProfile(p)};
}
function health(profile){
  const a=auditProfile(profile);return{status:a.errors?'error':a.warnings?'warning':'healthy',errors:a.errors,warnings:a.warnings,issueCodes:[...new Set(a.issues.map(x=>x.code))]};
}
return{VERSION,PROFILE_SCHEMA,migrateProfile,auditProfile,repairProfile,health};
});
