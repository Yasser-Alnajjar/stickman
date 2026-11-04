/**
 * Browser smoke test that drives the real game with the keyboard (Playwright is NOT a project dependency).
 *
 *   npm run build && npm run preview &
 *   npx playwright install chromium   # once
 *   npx --package playwright node scripts/e2e-smoke.mjs [http://127.0.0.1:4173]
 *
 * Uses the `?debug` hook (window.__stickman) only to read game state and to wait on the *game* clock,
 * which is robust on slow software-rendered CI machines.
 */
const url = process.argv[2] ?? 'http://127.0.0.1:4173';
import { createRequire } from 'node:module';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  try {
    ({ chromium } = createRequire(import.meta.url)('playwright')); // honours NODE_PATH / global installs
  } catch {
    console.error('playwright is not installed. Run: npx --package playwright node scripts/e2e-smoke.mjs');
    process.exit(2);
  }
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

const gameTime = (ms) => page.evaluate((ms) => new Promise((done) => {
  const s = window.__stickman.scene; const t0 = s.clock.now;
  const iv = setInterval(() => { if (s.clock.now - t0 >= ms) { clearInterval(iv); done(); } }, 8);
}), ms);
const state = () => page.evaluate(() => { const p = window.__stickman.scene.player; return { x: p.cx, y: p.cy, state: p.state, grounded: p.grounded }; });
const checks = [];
const check = (name, ok, detail = '') => { checks.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${detail}`); };

await page.goto(`${url}/?debug`, { waitUntil: 'load' });
await page.waitForSelector('text=New Game');
await page.click('text=New Game');
await page.waitForFunction(() => window.__stickman?.scene?.player);
await gameTime(500);

const a = await state();
await page.keyboard.down('KeyD'); await gameTime(600); await page.keyboard.up('KeyD');
check('player runs right', (await state()).x - a.x > 100);

await page.keyboard.down('Space'); await gameTime(250);
check('player leaves the ground when jumping', !(await state()).grounded);
await page.keyboard.up('Space'); await gameTime(1200);
check('player lands again (gravity + ground collision)', (await state()).grounded);

await page.keyboard.press('KeyJ', { delay: 60 }); await gameTime(60);
check('light attack enters the Attacking state', (await state()).state === 'Attacking');
await gameTime(600);

await page.keyboard.press('Escape'); await page.waitForSelector('.pause-card');
check('pause menu opens', true);
await page.click('.tab:has-text("Skills")');
await page.click('.skill:has-text("Fire Punch") button');
check('skill unlock works from the UI', await page.evaluate(() => window.__stickman.session.profile.abilities.fire_punch === 1));
await page.click('.tab:has-text("Pause")');
await page.click('text=Save Game');
await page.waitForSelector('text=Saved');
await page.click('text=Resume');
await gameTime(300);

await page.reload({ waitUntil: 'load' });
await page.waitForSelector('button:has-text("Continue"):not([disabled])');
await page.click('button:has-text("Continue")');
await page.waitForFunction(() => window.__stickman?.scene?.player);
check('Continue restores the unlocked ability from IndexedDB', await page.evaluate(() => window.__stickman.session.profile.abilities.fire_punch === 1));

check('no console errors', problems.length === 0, problems.join(' | '));
await browser.close();
process.exit(checks.every(Boolean) ? 0 : 1);
