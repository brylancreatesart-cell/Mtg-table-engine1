const { chromium } = require('playwright');

const BASE = process.env.PREVIEW_URL;
if (!BASE) throw new Error('PREVIEW_URL is required');
const deck = `1 Giada, Font of Hope\n99 Plains`;

const near = (a,b,t=3) => Math.abs(a-b) <= t;

(async()=>{
  const browser = await chromium.launch({headless:true});
  const ctx = await browser.newContext({viewport:{width:390,height:844}, isMobile:true});
  const page = await ctx.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  try{
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#authGuestBtn',{state:'visible',timeout:25000});
    await page.click('#authGuestBtn');
    await page.waitForSelector('#createProfileBtn',{state:'visible',timeout:10000});
    await page.fill('#displayNameInput','Alignment QA');
    const u=page.locator('#usernameInput'); if(await u.count()) await u.fill('alignmentqa');
    await page.click('#createProfileBtn');
    await page.waitForSelector('#setup',{state:'visible',timeout:12000});

    const metrics=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect();
      const center=r=>r.left+r.width/2;
      const header=document.querySelector('header');
      const title=document.querySelector('header h1');
      const actions=document.querySelector('header>div:last-child');
      const dividers=[...document.querySelectorAll('#setup .verifyDivider')].map(d=>{
        const r=d.getBoundingClientRect(); const b=d.querySelector('b').getBoundingClientRect();
        return {containerCenter:center(r),labelCenter:center(b),label:b.width,container:r.width};
      });
      const cta=rect('#ver'); const ctaText=rect('#ver>span:last-child');
      return {
        viewport:document.documentElement.clientWidth,
        bodyScrollWidth:document.documentElement.scrollWidth,
        header:{left:header.getBoundingClientRect().left,right:header.getBoundingClientRect().right,width:header.getBoundingClientRect().width},
        title:{fontSize:parseFloat(getComputedStyle(title).fontSize),height:title.getBoundingClientRect().height,whiteSpace:getComputedStyle(title).whiteSpace,text:title.textContent.trim()},
        actions:{left:actions.getBoundingClientRect().left,right:actions.getBoundingClientRect().right,width:actions.getBoundingClientRect().width},
        dividers,
        cta:{containerCenter:center(cta),textCenter:center(ctaText),containerWidth:cta.width,textWidth:ctaText.width}
      };
    });

    const fail=[];
    if(metrics.bodyScrollWidth>metrics.viewport+1) fail.push(`horizontal overflow ${metrics.bodyScrollWidth} > ${metrics.viewport}`);
    if(metrics.title.fontSize>31.1) fail.push(`mobile header title too large: ${metrics.title.fontSize}px`);
    if(metrics.title.whiteSpace!=='nowrap') fail.push(`mobile header title is not nowrap: ${metrics.title.whiteSpace}`);
    if(metrics.header.left < -1 || metrics.header.right > metrics.viewport+1) fail.push('header exceeds viewport');
    if(metrics.actions.left < -1 || metrics.actions.right > metrics.viewport+1) fail.push('header actions exceed viewport');
    metrics.dividers.forEach((d,i)=>{ if(!near(d.containerCenter,d.labelCenter,3)) fail.push(`divider ${i} label center off by ${Math.abs(d.containerCenter-d.labelCenter).toFixed(2)}px`); });
    if(!near(metrics.cta.containerCenter,metrics.cta.textCenter,3)) fail.push(`CTA text center off by ${Math.abs(metrics.cta.containerCenter-metrics.cta.textCenter).toFixed(2)}px`);
    if(pageErrors.length) fail.push(`page errors: ${JSON.stringify(pageErrors)}`);
    console.log(JSON.stringify(metrics,null,2));
    if(fail.length) throw new Error(fail.join('; '));
    console.log('Mobile alignment regression passed.');
  } finally {
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exit(1)});
