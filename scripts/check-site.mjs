// Checks the 3D hero and the rest of the page in Microsoft Edge (or Chrome), headless.
//   node scripts/check-site.mjs [url] [--shots <folder>]
// The default url is a local `npm run preview`. Screenshots go to test-output/.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {strFromU8, unzipSync} from 'fflate';
import {chromium} from 'playwright-core';
import {PNG} from 'pngjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4180/Creative-website/';
const shotsAt = args.includes('--shots') ? resolve(args[args.indexOf('--shots') + 1]) : null;
const out = join(root, 'test-output');
mkdirSync(out, {recursive: true});

const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (ok) passed++;
  else failed.push(name);
};
const section = (t) => console.log(`\n${t}`);
const sha = (b) => createHash('sha256').update(b).digest('hex');

// The confirmed handoff the site should be showing.
const handoff = unzipSync(new Uint8Array(readFileSync(join(root, 'handoff', 'Venture_3D_Confirmed_Handoff.zip'))));
const handoffManifest = JSON.parse(strFromU8(handoff['model-manifest.json']));

const COBALT = [0x0b, 0x7a, 0x4b];
/** Share of pixels in a PNG that differ clearly from the brand green (i.e. the mascot). */
function coverage(png) {
  const img = PNG.sync.read(png);
  let hit = 0;
  let top = img.height;
  let bottom = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const d = Math.abs(img.data[i] - COBALT[0]) + Math.abs(img.data[i + 1] - COBALT[1]) + Math.abs(img.data[i + 2] - COBALT[2]);
      if (d > 90) {
        hit++;
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return {share: hit / (img.width * img.height), top, bottom, height: img.height};
}
/** Mean per-channel difference between two same-sized PNGs, 0 to 255. */
function diff(a, b) {
  const A = PNG.sync.read(a);
  const B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return 255;
  let sum = 0;
  for (let i = 0; i < A.data.length; i += 4) sum += Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]);
  return sum / ((A.data.length / 4) * 3);
}
const overlaps = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function open(browser, {width = 1440, height = 900, reducedMotion = 'no-preference', touch = false} = {}) {
  const context = await browser.newContext({viewport: {width, height}, reducedMotion, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1});
  const page = await context.newPage();
  const errors = [];
  const bad = [];
  const outside = [];
  let glb = null;
  page.on('pageerror', (e) => errors.push(e.message));
  // The site has never had a favicon; that 404 predates the 3D work.
  page.on('console', (m) => m.type() === 'error' && !m.location().url.endsWith('/favicon.ico') && errors.push(`${m.text()} ${m.location().url}`));
  page.on('response', async (r) => {
    const url = new URL(r.url());
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
    if (url.origin === new URL(BASE).origin && !url.pathname.startsWith(new URL(BASE).pathname)) outside.push(url.pathname);
    if (url.pathname.endsWith('/media/3d/model.glb') && r.status() === 200) glb = await r.body().catch(() => null);
  });
  page.setDefaultTimeout(90000);
  await page.goto(BASE, {waitUntil: 'load'});
  return {context, page, errors, bad, outside, glb: () => glb};
}
const box = (page) => page.locator('[data-testid="hero-mascot"]');
const shotBox = async (page) => page.screenshot({clip: await box(page).boundingBox()});
const ready = (page) => page.waitForSelector('[data-testid="hero-mascot"][data-status="ready"]', {timeout: 120000});

const browser = await chromium.launch({executablePath: exe, headless: true, args: GL});

// ---------------------------------------------------------------------------
section('Desktop, 1440 x 900');
{
  const {context, page, errors, bad, outside, glb} = await open(browser, {reducedMotion: 'reduce'});
  await ready(page);
  await page.waitForTimeout(1500);
  check('Page loads with the 3D mascot ready', (await box(page).getAttribute('data-status')) === 'ready');
  const bytes = glb();
  check('The site loads the confirmed GLB unchanged', !!bytes && sha(bytes) === handoffManifest.files.model.sha256, bytes ? `${(bytes.length / 1024).toFixed(0)} KB, sha256 ${sha(bytes).slice(0, 10)}` : 'not fetched');
  const served = await (await page.request.get(new URL('media/3d/model-manifest.json', BASE).href)).json();
  check('Manifest on the site is the confirmed one', served.confirmedAt === handoffManifest.confirmedAt && served.modelName === handoffManifest.modelName, served.modelName);

  await page.screenshot({path: join(out, 'desktop-hero.png')});
  if (shotsAt) await page.screenshot({path: join(shotsAt, 'website-desktop.png')});
  const first = await shotBox(page);
  const c = coverage(first);
  const b = await box(page).boundingBox();
  check('Mascot is clearly visible', c.share > 0.12, `${(c.share * 100).toFixed(0)}% of its area`);
  const mascotHeight = (Math.min(c.bottom, (await page.locator('h1').boundingBox()).y + 40 - b.y) - c.top) / 900;
  check('Mascot is large, not tiny', mascotHeight > 0.5, `${(mascotHeight * 100).toFixed(0)}% of the window height`);
  check('Mascot is not clipped at the top', c.top > 2, `top edge ${c.top}px into its frame`);
  const header = await page.locator('header').boundingBox();
  check('Head stays below the navigation', b.y + c.top > 60, `head top at ${Math.round(b.y + c.top)}px`);

  const mark = await page.locator('h1').boundingBox();
  const bar = await page.locator('[role="toolbar"]').boundingBox();
  check('Controls do not cover the wordmark', !overlaps(bar, mark));
  check('Controls do not cover the navigation', !overlaps(bar, header));
  const feet = coverage(await page.screenshot({clip: {x: b.x, y: b.y, width: b.width, height: Math.max(1, mark.y - b.y)}}));
  check('Mascot reaches down to the wordmark', b.y + feet.bottom > mark.y - 12, `lowest visible point ${Math.round(b.y + feet.bottom)}px, letters start ${Math.round(mark.y)}px`);

  // Turning, zoom and reset (reduced motion keeps the view still between steps).
  const bb = await box(page).boundingBox();
  await page.mouse.move(bb.x + bb.width * 0.4, bb.y + bb.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width * 0.4 + 220, bb.y + bb.height * 0.5, {steps: 10});
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const turned = await shotBox(page);
  check('Dragging turns the mascot', diff(first, turned) > 3, `difference ${diff(first, turned).toFixed(1)}`);
  await page.screenshot({path: join(out, 'desktop-turned.png')});
  await page.getByTestId('mascot-reset').click();
  await page.waitForTimeout(1500);
  const back = await shotBox(page);
  check('Reset returns to the starting view', diff(first, back) < 1.5, `difference ${diff(first, back).toFixed(2)}`);
  await page.getByTestId('mascot-zoom-in').click();
  await page.getByTestId('mascot-zoom-in').click();
  await page.waitForTimeout(1200);
  const zoomed = await shotBox(page);
  check('Zoom in moves closer', coverage(zoomed).share > c.share * 1.2, `${(coverage(zoomed).share * 100).toFixed(0)}% vs ${(c.share * 100).toFixed(0)}%`);
  await page.screenshot({path: join(out, 'desktop-zoomed.png')});
  await page.getByTestId('mascot-zoom-out').click();
  await page.getByTestId('mascot-zoom-out').click();
  await page.getByTestId('mascot-view-back').click();
  await page.waitForTimeout(1500);
  check('Back view shows the other side', diff(first, await shotBox(page)) > 3);
  await page.getByTestId('mascot-view-side').click();
  await page.waitForTimeout(1500);
  await page.screenshot({path: join(out, 'desktop-side.png')});
  await page.getByTestId('mascot-reset').click();
  await page.waitForTimeout(1500);
  await page.locator('[data-testid="hero-mascot"] [role="img"]').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(1200);
  check('Arrow keys turn the mascot', diff(first, await shotBox(page)) > 3);
  const label = await page.locator('[data-testid="hero-mascot"] [role="img"]').getAttribute('aria-label');
  check('3D view has an accessible description', /doctor mascot/i.test(label) && /drag/i.test(label));
  await page.getByTestId('mascot-reset').click();

  // The hero's scroll beat still runs: the mascot moves aside for the copy.
  const total = await page.evaluate(() => document.getElementById('top').offsetHeight - innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.74));
  await page.waitForTimeout(2500);
  const moved = await box(page).boundingBox();
  check('Scrolling moves the mascot aside', moved.x + moved.width / 2 > 1440 * 0.62, `centre at ${Math.round(moved.x + moved.width / 2)}px`);
  const heading = await page.locator('#top h2').boundingBox();
  check('Copy and mascot do not overlap', !overlaps(heading, moved));
  const headingVisible = await page.locator('#top h2 span span').first().evaluate((el) => getComputedStyle(el).transform);
  check('Hero copy rises into view', headingVisible === 'none' || headingVisible.includes('matrix(1, 0, 0, 1, 0, 0)'), headingVisible);
  await page.screenshot({path: join(out, 'desktop-scrolled.png')});

  // Navigation and the rest of the page.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  for (const [name, hash] of [['Features', '#services'], ["Who it's for", '#audience']]) {
    await page.locator('header nav').getByRole('link', {name}).click();
    await page.waitForTimeout(2200);
    const top = await page.locator(hash).evaluate((el) => el.getBoundingClientRect().top);
    check(`Navigation link "${name}" still scrolls to its section`, Math.abs(top) < 120, `section top ${Math.round(top)}px`);
  }
  for (const id of ['manifesto', 'services', 'process', 'audience', 'contact']) {
    check(`Section #${id} is still on the page`, (await page.locator(`#${id}`).count()) === 1);
  }
  const prices = await page.locator('body').innerText();
  check('Pricing copy is unchanged', prices.includes('$29.99 a year'));
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const form = page.locator('#contact form');
  check('Waitlist form is still there', (await form.count()) === 1);
  await form.locator('button[type="submit"]').click();
  await page.waitForTimeout(300);
  const status = await page.locator('#contact-status').innerText();
  check('Waitlist form still validates empty input', status.trim().length > 0, status.trim());

  check('No JavaScript errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  check('No missing files', bad.length === 0, bad.slice(0, 3).join(' | '));
  check('All files load from the Pages subpath', outside.length === 0, outside.slice(0, 3).join(' | '));
  await context.close();
}

section('Idle motion and reduced motion');
{
  const normal = await open(browser);
  await ready(normal.page);
  await normal.page.waitForTimeout(6000);
  const a = await shotBox(normal.page);
  await normal.page.waitForTimeout(1500);
  const b = await shotBox(normal.page);
  check('Gentle idle sway runs normally', diff(a, b) > 0.3, `difference ${diff(a, b).toFixed(2)}`);
  await normal.context.close();

  const still = await open(browser, {reducedMotion: 'reduce'});
  await ready(still.page);
  await still.page.waitForTimeout(6000);
  const c = await shotBox(still.page);
  await still.page.waitForTimeout(1500);
  const d = await shotBox(still.page);
  check('Reduced motion keeps the mascot still', diff(c, d) < 0.05, `difference ${diff(c, d).toFixed(3)}`);
  await still.context.close();
}

section('Phone, 390 x 844');
{
  const {context, page, errors} = await open(browser, {width: 390, height: 844, touch: true, reducedMotion: 'reduce'});
  await ready(page);
  await page.waitForTimeout(1500);
  await page.screenshot({path: join(out, 'phone-hero.png')});
  if (shotsAt) await page.screenshot({path: join(shotsAt, 'website-phone.png')});
  const c = coverage(await shotBox(page));
  check('Mascot is visible on a phone', c.share > 0.1, `${(c.share * 100).toFixed(0)}%`);
  const bar = await page.locator('[role="toolbar"]').boundingBox();
  check('Phone controls fit on screen', bar.x >= 0 && bar.x + bar.width <= 390);
  check('Phone controls are big enough to tap', bar.width >= 40);
  check('Vertical swipes on the mascot still scroll the page', (await box(page).evaluate((el) => getComputedStyle(el).touchAction)) === 'pan-y');
  check('Menu button is still there', await page.locator('header button').first().isVisible());
  const total = await page.evaluate(() => document.getElementById('top').offsetHeight - innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.74));
  await page.waitForTimeout(2500);
  await page.screenshot({path: join(out, 'phone-scrolled.png')});
  const moved = await box(page).boundingBox();
  const cards = await page.locator('#top ul').boundingBox();
  check('Small mascot hides its buttons on phones', (await box(page).getAttribute('data-compact')) === 'true' && (await page.locator('[role="toolbar"]').evaluate((el) => getComputedStyle(el.parentElement).opacity)) === '0');
  check('On phones the mascot moves below the copy', moved.y + moved.height * 0.15 > cards.y + cards.height * 0.6, `mascot top ${Math.round(moved.y)}px, cards end ${Math.round(cards.y + cards.height)}px`);
  check('No JavaScript errors on a phone', errors.length === 0, errors.slice(0, 3).join(' | '));
  await context.close();
}
await browser.close();

section('Without WebGL');
{
  const noGl = await chromium.launch({executablePath: exe, headless: true, args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis']});
  const {context, page, errors} = await open(noGl);
  await page.waitForSelector('[data-testid="hero-mascot-fallback"]', {timeout: 30000});
  const fig = page.getByTestId('hero-mascot-fallback');
  const caption = await fig.locator('figcaption').innerText();
  check('Fallback shows the confirmed preview image', await fig.locator('img').evaluate((img) => img.complete && img.naturalWidth > 0));
  check('Fallback is labelled as a static preview', /static preview/i.test(caption), caption);
  check('Fallback offers no 3D controls', (await page.locator('[role="toolbar"]').count()) === 0);
  await page.screenshot({path: join(out, 'fallback.png')});
  check('No JavaScript errors without WebGL', errors.length === 0, errors.slice(0, 3).join(' | '));
  await context.close();
  await noGl.close();
}

console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length) {
  console.log(` - ${failed.join('\n - ')}`);
  process.exit(1);
}
writeFileSync(join(out, 'last-run.txt'), `${new Date().toISOString()} ${BASE} ${passed} passed\n`);
