const { chromium } = require('playwright');

const BASE = process.env.PREVIEW_URL || 'https://mtg-table-engine1-git-sidekick-refactor-brylancreatesart-7523.vercel.app';
const deck = `1 Giada, Font of Hope\n99 Plains`;
const report = { base: BASE, startedAt: new Date().toISOString(), checks: [], consoleErrors: [], pageErrors: [], badResponses: [], requestFailures: [], diagnostics: {} };
const check = (name, ok, details='') => { report.checks.push({ name, ok: !!ok, details }); if (!ok) throw new Error(`${name}${details ? ': '+details : ''}`); };

async function captureErrors(page, label) {
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push({ label, text: msg.text() }); });
  page.on('pageerror', err => report.pageErrors.push({ label, text: String(err && (err.stack || err.message) || err) }));
  page.on('response', res => { if (res.status() >= 400) report.badResponses.push({ label, status: res.status(), url: res.url(), resourceType: res.request().resourceType() }); });
  page.on('requestfailed', req => report.requestFailures.push({ label, url: req.url(), resourceType: req.resourceType(), error: req.failure()?.errorText || 'unknown' }));
}

async function runtimeSnapshot(page) {
  try{return await page.evaluate(async()=>({
    url:location.href,
    net:document.querySelector('#net')?.textContent||null,
    lobbyVisible:!!document.querySelector('#lobby')&&!document.querySelector('#lobby').classList.contains('h'),
    gameVisible:!!document.querySelector('#game')&&!document.querySelector('#game').classList.contains('h'),
    introVisible:!!document.querySelector('#battleIntro')&&!document.querySelector('#battleIntro').classList.contains('h'),
    roomCode:document.querySelector('#battleRoomCode')?.textContent||document.querySelector('#code')?.textContent||null,
    serviceWorkers:navigator.serviceWorker?await navigator.serviceWorker.getRegistrations().then(xs=>xs.map(x=>({scope:x.scope,active:x.active?.scriptURL||null}))):[]
  }))}catch(e){return{error:String(e)}}
}

async function waitForApp(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#authGuestBtn', { state: 'visible', timeout: 25000 });
  check('front door renders', await page.locator('#authGuestBtn').isVisible());
  await page.waitForFunction(()=>typeof window.Peer==='function',null,{timeout:15000});
  check('PeerJS runtime loads', await page.evaluate(()=>typeof window.Peer==='function'));
}

async function guestToLobby(page, name, username) {
  await waitForApp(page);
  await page.click('#authGuestBtn');
  await page.waitForSelector('#createProfileBtn', { state: 'visible', timeout: 10000 });
  await page.fill('#displayNameInput', name);
  const u = page.locator('#usernameInput'); if (await u.count()) await u.fill(username);
  await page.click('#createProfileBtn');
  await page.waitForSelector('#deck', { state: 'visible', timeout: 12000 });
  check(`${name} guest reaches verify`, await page.locator('#setup').isVisible());
  await page.fill('#deck', deck);
  await page.click('#ver');
  await page.waitForFunction(() => document.querySelectorAll('#commanderSelect option').length > 1, null, { timeout: 30000 });
  check(`${name} commander options populate`, await page.locator('#commanderSelect option').count() > 1);
  await page.selectOption('#commanderSelect', { label: 'Giada, Font of Hope' });
  await page.click('#cont');
  await page.waitForSelector('#lobby:not(.h)', { timeout: 12000 });
  check(`${name} verify-to-lobby`, await page.locator('#lobby').isVisible());
  check(`${name} deck theme applied`, await page.evaluate(() => !!getComputedStyle(document.documentElement).getPropertyValue('--deck-a').trim() || !!document.documentElement.style.getPropertyValue('--deck-a')));
}

async function readyPlayer(page, label) {
  await page.click('#rdy');
  await page.waitForSelector('#modal:not(.h)', { timeout: 10000 });
  const keep = page.getByRole('button', { name: 'KEEP 7 · 0 MULLIGANS', exact: true });
  await keep.waitFor({ state: 'visible', timeout: 10000 });
  await keep.click();
  await page.waitForTimeout(700);
  check(`${label} opening hand confirmed`, await page.evaluate(() => document.querySelector('#modal')?.classList.contains('h')));
}

async function finishIntro(page, label) {
  await page.waitForSelector('#battleIntro:not(.h), #game:not(.h)', { timeout: 20000 });
  const skip = page.locator('#battleIntroSkip');
  if (await skip.count() && await skip.isVisible()) await skip.click();
  await page.waitForSelector('#game:not(.h)', { timeout: 10000 });
  check(`${label} enters battlefield`, await page.locator('#game').isVisible());
  check(`${label} battlefield route active`, (await page.url()).includes('#battle'));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let host,join,display;
  try {
    const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const joinCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const displayCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    host = await hostCtx.newPage(); join = await joinCtx.newPage(); display = await displayCtx.newPage();
    await captureErrors(host,'host'); await captureErrors(join,'join'); await captureErrors(display,'display');

    await guestToLobby(host, 'Smoke Host', 'smokehost');
    await host.click('#host');
    await host.waitForFunction(() => /^[A-Z0-9]{6}$/.test((document.querySelector('#code')?.textContent || '').trim()), null, { timeout: 20000 });
    const room = (await host.locator('#code').textContent()).trim();
    check('host creates six-character room', /^[A-Z0-9]{6}$/.test(room), room);
    await host.waitForFunction(() => /HOST ONLINE/.test((document.querySelector('#net')?.textContent || '').toUpperCase()), null, { timeout: 25000 });
    check('host peer becomes online', /HOST ONLINE/.test(((await host.locator('#net').textContent())||'').toUpperCase()));

    await guestToLobby(join, 'Smoke Join', 'smokejoin');
    await join.click('#join');
    await join.fill('#jc', room);
    await join.click('#con');
    await join.waitForFunction(() => /CONNECTED/.test((document.querySelector('#net')?.textContent || '').toUpperCase()), null, { timeout: 30000 });
    check('second player connects to host', /CONNECTED/.test(((await join.locator('#net').textContent())||'').toUpperCase()));
    await host.waitForFunction(() => (document.querySelector('#slots')?.textContent || '').includes('Smoke Join'), null, { timeout: 15000 });
    check('host roster receives joined player', (await host.locator('#slots').textContent()).includes('Smoke Join'));

    await display.goto(`${BASE}/?display=${room}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await display.waitForSelector('#sharedDisplay', { state: 'visible', timeout: 20000 });
    await display.waitForFunction(() => (document.querySelector('#sharedDisplayPlayers')?.textContent || '').includes('Smoke Host'), null, { timeout: 30000 });
    check('shared display receives host roster', (await display.locator('#sharedDisplayPlayers').textContent()).includes('Smoke Host'));
    check('shared display receives joined player', (await display.locator('#sharedDisplayPlayers').textContent()).includes('Smoke Join'));
    check('shared display remains read-only', await display.evaluate(() => document.body.classList.contains('sharedTableDisplayMode') && document.querySelector('#game')?.classList.contains('h')));

    // Confirm opening hands and ready both live players using the actual lobby UI.
    await readyPlayer(join, 'joining player');
    await host.waitForTimeout(500);
    await readyPlayer(host, 'host');
    await host.waitForFunction(() => {
      const t=document.querySelector('#slots')?.textContent||'';
      return (t.match(/READY/g)||[]).length>=2;
    }, null, { timeout: 12000 }).catch(()=>{});
    check('host start control is available', await host.locator('#start').isVisible());

    await host.click('#start');
    await Promise.all([finishIntro(host,'host'), finishIntro(join,'joining player')]);
    check('battlefield room code preserved for host', ((await host.locator('#battleRoomCode').textContent())||'').trim()===room);
    check('battlefield room code preserved for joiner', ((await join.locator('#battleRoomCode').textContent())||'').trim()===room);

    await display.waitForFunction(() => /TURN\s+1/i.test(document.querySelector('#sharedDisplayTurnSub')?.textContent||''), null, { timeout: 15000 });
    check('shared display updates into live battle', /TURN\s+1/i.test((await display.locator('#sharedDisplayTurnSub').textContent())||''));

    const assetStatuses = await host.evaluate(async () => {
      const urls=['styles/inline-01.css','scripts/inline-100.js','scripts/inline-101.js','sw.js'];
      const out={}; for (const u of urls) out[u]=(await fetch(u,{cache:'no-store'})).status; return out;
    });
    for (const [asset,status] of Object.entries(assetStatuses)) check(`asset ${asset} loads`, status===200, String(status));

    check('no uncaught page errors', report.pageErrors.length===0, JSON.stringify(report.pageErrors));
    const important404s = report.badResponses.filter(x => x.status===404 && ['script','stylesheet','document'].includes(x.resourceType));
    check('no required document/script/style 404s', important404s.length===0, JSON.stringify(important404s));
    report.ok = report.checks.every(c=>c.ok);
    report.room = room;
  } catch(err) {
    if(host)report.diagnostics.host=await runtimeSnapshot(host);
    if(join)report.diagnostics.join=await runtimeSnapshot(join);
    if(display)report.diagnostics.display=await runtimeSnapshot(display);
    throw err;
  } finally {
    report.finishedAt = new Date().toISOString();
    require('fs').writeFileSync('preview-smoke-report.json', JSON.stringify(report,null,2)+'\n');
    await browser.close();
  }
  if (!report.ok) process.exit(1);
}

main().catch(err => {
  report.ok=false; report.fatal=String(err && (err.stack||err.message)||err); report.finishedAt=new Date().toISOString();
  require('fs').writeFileSync('preview-smoke-report.json', JSON.stringify(report,null,2)+'\n');
  console.error(err); process.exit(1);
});
