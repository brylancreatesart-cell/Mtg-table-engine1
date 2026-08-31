const { chromium } = require('playwright');

const BASE = process.env.PREVIEW_URL || 'https://mtg-table-engine1-git-sidekick-refactor-brylancreatesart-7523.vercel.app';
const deck = `1 Giada, Font of Hope\n99 Plains`;
const report = { base: BASE, startedAt: new Date().toISOString(), checks: [], consoleErrors: [], pageErrors: [], badResponses: [], requestFailures: [] };
const check = (name, ok, details='') => { report.checks.push({ name, ok: !!ok, details }); if (!ok) throw new Error(`${name}${details ? ': '+details : ''}`); };

async function captureErrors(page, label) {
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push({ label, text: msg.text() }); });
  page.on('pageerror', err => report.pageErrors.push({ label, text: String(err && (err.stack || err.message) || err) }));
  page.on('response', res => { if (res.status() >= 400) report.badResponses.push({ label, status: res.status(), url: res.url(), resourceType: res.request().resourceType() }); });
  page.on('requestfailed', req => report.requestFailures.push({ label, url: req.url(), resourceType: req.resourceType(), error: req.failure()?.errorText || 'unknown' }));
}

async function waitForApp(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#authGuestBtn', { state: 'visible', timeout: 25000 });
  check('front door renders', await page.locator('#authGuestBtn').isVisible());
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const joinCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const displayCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const host = await hostCtx.newPage(), join = await joinCtx.newPage(), display = await displayCtx.newPage();
    await captureErrors(host,'host'); await captureErrors(join,'join'); await captureErrors(display,'display');

    await guestToLobby(host, 'Smoke Host', 'smokehost');
    await host.click('#host');
    await host.waitForFunction(() => /^[A-Z0-9]{6}$/.test((document.querySelector('#code')?.textContent || '').trim()), null, { timeout: 20000 });
    const room = (await host.locator('#code').textContent()).trim();
    check('host creates six-character room', /^[A-Z0-9]{6}$/.test(room), room);
    await host.waitForTimeout(1000);

    await guestToLobby(join, 'Smoke Join', 'smokejoin');
    await join.click('#join');
    await join.fill('#jc', room);
    await join.click('#con');
    await join.waitForFunction(() => /CONNECTED|ONLINE/.test((document.querySelector('#net')?.textContent || '').toUpperCase()), null, { timeout: 25000 });
    check('second player connects to host', /CONNECTED|ONLINE/.test(((await join.locator('#net').textContent())||'').toUpperCase()));
    await host.waitForFunction(() => (document.querySelector('#slots')?.textContent || '').includes('Smoke Join'), null, { timeout: 15000 });
    check('host roster receives joined player', (await host.locator('#slots').textContent()).includes('Smoke Join'));

    await display.goto(`${BASE}/?display=${room}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await display.waitForSelector('#sharedDisplay', { state: 'visible', timeout: 20000 });
    await display.waitForFunction(() => (document.querySelector('#sharedDisplayPlayers')?.textContent || '').includes('Smoke Host'), null, { timeout: 25000 });
    check('shared display receives host roster', (await display.locator('#sharedDisplayPlayers').textContent()).includes('Smoke Host'));
    check('shared display receives joined player', (await display.locator('#sharedDisplayPlayers').textContent()).includes('Smoke Join'));
    check('shared display remains read-only', await display.evaluate(() => document.body.classList.contains('sharedTableDisplayMode') && document.querySelector('#game')?.classList.contains('h')));

    const assetStatuses = await host.evaluate(async () => {
      const urls=['styles/inline-01.css','scripts/inline-100.js','scripts/inline-101.js'];
      const out={}; for (const u of urls) out[u]=(await fetch(u,{cache:'no-store'})).status; return out;
    });
    for (const [asset,status] of Object.entries(assetStatuses)) check(`asset ${asset} loads`, status===200, String(status));

    check('no uncaught page errors', report.pageErrors.length===0, JSON.stringify(report.pageErrors));
    const important404s = report.badResponses.filter(x => x.status===404 && ['script','stylesheet','document'].includes(x.resourceType));
    check('no required document/script/style 404s', important404s.length===0, JSON.stringify(important404s));
    report.ok = report.checks.every(c=>c.ok);
    report.room = room;
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
