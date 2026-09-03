const { chromium } = require('playwright');
const fs = require('fs');
const base = process.env.PREVIEW_URL || 'https://mtg-table-engine1.vercel.app';
const targetTurn = Number(process.env.SOLO_TARGET_TURN || 5);
const report = { base, errors: [], states: [], ok: false };
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => { report.errors.push(String(e.stack || e)); console.log('PAGE ERROR', String(e)); });
  page.on('crash', () => { report.errors.push('renderer crash'); console.log('RENDERER CRASH'); });
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('#authGuestBtn').click();
    await page.locator('#displayNameInput').fill('Solo Regression');
    await page.locator('#createProfileBtn').click();
    await page.locator('#deck').fill('1 Giada, Font of Hope\n99 Plains');
    await page.locator('#ver').click();
    await page.waitForFunction(() => document.querySelectorAll('#commanderSelect option').length > 1);
    await page.selectOption('#commanderSelect', { label: 'Giada, Font of Hope' });
    await page.evaluate(() => {
      const dispatch = MTGEngine.dispatch;
      MTGEngine.dispatch = function (state, ...args) { window.__soloState = state; return dispatch.call(this, state, ...args); };
      const stamp = MTGAuthoritativeSync.stampStateMessage;
      window.__soloTransport = { calls: 0, ms: 0, maxMs: 0 };
      MTGAuthoritativeSync.stampStateMessage = function (...args) {
        const start = performance.now();
        try { return stamp.apply(this, args); }
        finally { const ms = performance.now() - start; window.__soloTransport.calls++; window.__soloTransport.ms += ms; window.__soloTransport.maxMs = Math.max(window.__soloTransport.maxMs, ms); }
      };
    });
    await page.click('#cont');
    await page.click('#profileBtn');
    await page.locator('[data-profile-hub-tab="settings"]').click();
    await page.locator('[data-profile-action="advanced"]').click();
    await page.getByRole('button', { name: 'Solo Test', exact: true }).click();
    await page.getByRole('button', { name: '3 NPC Opponents', exact: true }).click();
    await page.waitForSelector('#battleIntro:not(.h), #game:not(.h)');
    if (await page.locator('#battleIntroSkip').isVisible()) await page.click('#battleIntroSkip');
    await page.waitForSelector('#game:not(.h)');
    const match = await page.evaluate(() => ({ seed: window.__soloState?.soloNPC?.seed, seats: Object.keys(window.__soloState?.soloNPC?.decks || {}) }));
    report.match = match;
    if (match.seats.join(',') !== '2,3,4') throw new Error('Expected three NPC opponents in seats 2, 3, and 4');
    for (let i = 0; i < 1000; i++) {
      const state = await page.evaluate(() => ({
        url: location.href,
        login: !document.querySelector('#accountOverlay').classList.contains('h'),
        turn: window.__soloState?.turn,
        active: window.__soloState?.active,
        seq: window.__soloState?.meta?.seq,
        heap: performance.memory?.usedJSHeapSize,
        transport: { ...window.__soloTransport },
        text: document.querySelector('#game').innerText.slice(0, 1700),
        buttons: [...document.querySelectorAll('#game button')].filter(b => b.getClientRects().length).map(b => ({ id: b.id, text: b.textContent, action: b.dataset.contextAction }))
      }));
      if (!report.states.length || state.text !== report.states.at(-1).text) { report.states.push(state); console.log(JSON.stringify({ turn: state.turn, active: state.active, seq: state.seq, heap: state.heap, transport: state.transport })); }
      if (state.login) throw new Error('Returned to front door during solo game');
      if (report.errors.length) throw new Error('Uncaught browser error');
      if (state.turn >= targetTurn && state.active === 1) {
        for (const seat of [1,2,3,4]) if (!report.states.some(s => s.active === seat)) throw new Error('Missing active turn for seat ' + seat);
        if (process.env.EXPECT_SOLO_TRANSPORT_SKIP !== '0' && state.transport.calls !== 0) throw new Error('Solo game serialized outbound multiplayer state');
        report.ok = true; break;
      }
      const action = state.buttons.find(b => ['pass','next-phase','combat-ready'].includes(b.action));
      // Exercise the rendered control's handler. This is turn-flow coverage,
      // not a claim that mobile pointer hit targets have passed visual QA.
      if (action) await page.locator('#game button[data-context-action="' + action.action + '"]:enabled').dispatchEvent('click', {}, { timeout: 1500 }).catch(e => { if (!String(e).includes('Timeout')) throw e; });
      await page.waitForTimeout(600);
    }
    await page.screenshot({ path: 'solo-turn-smoke.png' });
    if (!report.ok) throw new Error('Four-player cycle did not return to Player 1');
  } catch (e) { report.fatal = String(e.stack || e); console.error(report.fatal); await page.screenshot({ path: 'solo-turn-failure.png', timeout: 5000 }).catch(() => {}); }
  finally { fs.writeFileSync('solo-turn-smoke-report.json', JSON.stringify(report, null, 2)); await browser.close(); if (!report.ok) process.exitCode = 1; }
})();
