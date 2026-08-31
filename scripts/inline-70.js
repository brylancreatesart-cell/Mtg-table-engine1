
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MTGDeckTheme=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ORDER=['W','U','B','R','G'];
const COLOR={W:'#f2e9d0',U:'#52b8ff',B:'#8f7aa8',R:'#ff6258',G:'#4bdf88',C:'#9eabb5'};
const NAME={W:'WHITE',U:'BLUE',B:'BLACK',R:'RED',G:'GREEN',C:'COLORLESS'};
function normalizeIdentity(input){let a=Array.isArray(input)?input:String(input||'').split('');a=[...new Set(a.map(x=>String(x).toUpperCase()).filter(x=>ORDER.includes(x)))];return ORDER.filter(x=>a.includes(x));}
function identityFromProfile(profile){let cmd=profile?.commander&&profile?.cardMap?.get?.(String(profile.commander).toLowerCase());let ci=normalizeIdentity(cmd?.colorIdentity||cmd?.color_identity);if(ci.length)return ci;let all=[];for(const c of profile?.cards||[])all.push(...normalizeIdentity(c.colorIdentity||c.color_identity||c.colors));return normalizeIdentity(all);}
function themeForIdentity(input){let id=normalizeIdentity(input),key=id.join('')||'C',colors=id.length?id.map(x=>COLOR[x]):[COLOR.C];let a=colors[0],b=colors[1]||colors[0],c=colors[2]||colors[colors.length-1]||a;return{key,identity:id.length?id:['C'],label:id.length?id.map(x=>NAME[x]).join(' / '):'COLORLESS',accent:a,accent2:b,accent3:c,colors};}
function apply(profile,doc){doc=doc||((typeof document!=='undefined')?document:null);let t=themeForIdentity(identityFromProfile(profile));if(!doc)return t;let el=doc.documentElement;el.dataset.deckTheme=t.key;el.style.setProperty('--deck-a',t.accent);el.style.setProperty('--deck-b',t.accent2);el.style.setProperty('--deck-c',t.accent3);el.style.setProperty('--deck-glow',hexToRgba(t.accent,.22));el.style.setProperty('--deck-glow-2',hexToRgba(t.accent2,.12));return t;}
function hexToRgba(hex,a){let h=String(hex).replace('#','');if(h.length!==6)return `rgba(82,184,255,${a})`;let n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function localQA(){let checks=[];let q=(n,v)=>checks.push([n,!!v]);q('mono green',themeForIdentity(['G']).key==='G');q('azorius order',themeForIdentity(['U','W']).key==='WU');q('five color',themeForIdentity(['W','U','B','R','G']).identity.length===5);q('colorless fallback',themeForIdentity([]).key==='C');let p={commander:'Test',cardMap:new Map([['test',{colorIdentity:['U','W']}]]),cards:[]};q('commander identity preferred',identityFromProfile(p).join('')==='WU');let p2={cards:[{colorIdentity:['R']},{colorIdentity:['G']}],cardMap:new Map()};q('deck identity fallback',identityFromProfile(p2).join('')==='RG');return{ok:checks.every(x=>x[1]),checks};}
return{ORDER,COLOR,normalizeIdentity,identityFromProfile,themeForIdentity,apply,localQA};
});

