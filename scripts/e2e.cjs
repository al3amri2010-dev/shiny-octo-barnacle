/* Browser end-to-end test: builds the web export, serves it, plays and solves an Easy game.
 * Run with `npm run e2e`. Uses the preinstalled Chromium (never runs `playwright install`). */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

/** Static server with SPA fallback: unknown paths without an extension serve index.html. */
function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(DIST, urlPath);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.extname(urlPath) ? null : path.join(DIST, 'index.html');
    }
    if (!file || !fs.existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function assert(cond, msg) {
  if (!cond) throw new Error(`E2E assertion failed: ${msg}`);
  console.log(`ok - ${msg}`);
}

async function main() {
  console.log('Building web export...');
  execSync('npx expo export --platform web', { cwd: ROOT, stdio: 'inherit' });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    page.on('pageerror', (e) => console.log('pageerror:', e.message));
    const tid = (id) => page.locator(`[data-testid="${id}"]`);

    await page.goto(base);
    await tid('new-game').click();
    await tid('new-easy').click();
    await tid('board').waitFor({ timeout: 60000 });
    assert(true, 'Easy game started');

    // Hint -> technique link -> lesson.
    await tid('bar-help').click();
    await tid('help-hint').click();
    await tid('hint-lesson').click();
    await page.waitForURL(/\/training\//);
    await tid('next').waitFor();
    assert(
      /\/training\/[\w-]+/.test(page.url()),
      `hint technique link opened a lesson (${page.url()})`,
    );
    await page.goBack();
    await tid('board').waitFor();
    if (await tid('hint-dismiss').count()) await tid('hint-dismiss').click();

    // Read the solution from the persisted store and enter it digit-first.
    const { puzzle, solution } = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('sudoku-game'));
      return { puzzle: raw.state.puzzle, solution: raw.state.solution };
    });
    assert(solution.length === 81 && solution.every((d) => d >= 1), 'solution found in storage');
    for (let d = 1; d <= 9; d++) {
      const cells = [];
      for (let i = 0; i < 81; i++) if (puzzle[i] === 0 && solution[i] === d) cells.push(i);
      if (cells.length === 0) continue;
      await tid(`key-${d}`).click();
      for (const i of cells) await tid(`cell-${i}`).click();
    }
    await tid('win-dialog').waitFor({ timeout: 10000 });
    assert(true, 'win dialog appears after solving');

    // Statistics shows one solved Easy game.
    await tid('dialog-home').click();
    await tid('stats').click();
    const card = tid('stats-easy');
    await card.waitFor();
    const text = (await card.innerText()).replace(/\s+/g, ' ');
    assert(/Games solved\s*1\b/i.test(text), `Statistics shows 1 solved Easy game ("${text}")`);
    console.log('E2E passed');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
