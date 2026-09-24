const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { validate, renderHTML, PUBLIC_BASE } = require('./render');

const runFile = promisify(execFile);
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'docs');
const CARDS = path.join(ROOT, 'cards');
const SCRATCH = path.join(ROOT, '.scratch');
const PORT = Number(process.env.BIRTHDAY_STUDIO_PORT || 4173);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const REPOSITORY = 'pollmap/birthday-card-studio';
let publishing = false;

async function command(bin, args) {
  const { stdout } = await runFile(bin, args, { cwd: ROOT, windowsHide: true, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  return stdout.trim();
}

function respond(res, status, data, type = 'application/json; charset=utf-8') {
  const body = type.startsWith('application/json') ? JSON.stringify(data) : data;
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

function fail(res, error, status = 400) {
  respond(res, status, { error: error?.message || String(error) });
}

async function readJSON(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new Error('JSON 요청만 받습니다.');
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 32768) throw new Error('카드 내용이 너무 큽니다.');
  }
  return JSON.parse(body);
}

async function listCards() {
  const names = await fs.readdir(CARDS).catch(() => []);
  const items = [];
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    try {
      const card = JSON.parse(await fs.readFile(path.join(CARDS, name), 'utf8'));
      items.push({ ...card, url: `${PUBLIC_BASE}cards/${card.slug}/` });
    } catch { /* A bad draft must not prevent opening the editor. */ }
  }
  return items.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function publish(raw) {
  if (publishing) throw new Error('다른 카드를 게시하는 중입니다. 잠시 후 다시 시도해 주세요.');
  publishing = true;
  try {
    const config = validate(raw, true);
    const remote = await command('git', ['remote', 'get-url', 'origin']);
    if (!remote.includes(REPOSITORY)) throw new Error('게시 저장소 연결을 확인해 주세요.');
    const branch = await command('git', ['branch', '--show-current']);
    if (branch !== 'main') throw new Error('main 브랜치에서만 게시할 수 있습니다.');
    if (await command('git', ['diff', '--cached', '--name-only'])) throw new Error('이미 준비된 Git 변경사항이 있습니다. 먼저 정리해 주세요.');

    await fs.mkdir(SCRATCH, { recursive: true });
    const tempConfig = path.join(SCRATCH, `${config.slug}.json`);
    const tempOg = path.join(SCRATCH, `${config.slug}.png`);
    await fs.writeFile(tempConfig, JSON.stringify(config, null, 2) + '\n', 'utf8');
    await command('python', [path.join(__dirname, 'og.py'), tempConfig, tempOg]);

    const outputDir = path.join(SITE, 'cards', config.slug);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(CARDS, `${config.slug}.json`), JSON.stringify(config, null, 2) + '\n', 'utf8');
    await fs.writeFile(path.join(outputDir, 'index.html'), renderHTML(config), 'utf8');
    await fs.copyFile(tempOg, path.join(outputDir, 'og.png'));
    await command('git', ['add', '--', `cards/${config.slug}.json`, `docs/cards/${config.slug}/index.html`, `docs/cards/${config.slug}/og.png`]);
    const staged = await command('git', ['diff', '--cached', '--name-only']);
    if (staged) {
      await command('git', ['commit', '-m', `Publish birthday card: ${config.slug}`]);
      await command('git', ['push', 'origin', 'main']);
    }
    const sha = await command('git', ['rev-parse', 'HEAD']);
    return { url: `${PUBLIC_BASE}cards/${config.slug}/`, sha, status: staged ? 'building' : 'unchanged' };
  } finally {
    publishing = false;
  }
}

async function buildStatus(sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('게시 상태를 확인할 수 없습니다.');
  const raw = await command('gh', ['api', `repos/${REPOSITORY}/pages/builds/latest`]);
  const build = JSON.parse(raw);
  return { status: build.commit === sha ? build.status : 'waiting', commit: build.commit || null };
}

async function serveFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
  const data = await fs.readFile(file);
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.headers.host !== `127.0.0.1:${PORT}`) return fail(res, new Error('로컬 주소로 접속해 주세요.'), 403);
    const url = new URL(req.url, ORIGIN);
    if (req.method === 'GET' && url.pathname === '/') return await serveFile(res, path.join(__dirname, 'index.html'));
    if (req.method === 'GET' && url.pathname === '/studio.css') return await serveFile(res, path.join(__dirname, 'style.css'));
    if (req.method === 'GET' && url.pathname === '/studio.js') return await serveFile(res, path.join(__dirname, 'app.js'));
    if (req.method === 'GET' && url.pathname === '/api/cards') return respond(res, 200, await listCards());
    if (req.method === 'GET' && url.pathname === '/api/status') return respond(res, 200, await buildStatus(url.searchParams.get('sha') || ''));
    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      const relative = decodeURIComponent(url.pathname.slice(1));
      const file = path.resolve(SITE, relative);
      if (!file.startsWith(path.resolve(SITE, 'assets') + path.sep)) return fail(res, new Error('잘못된 경로입니다.'), 403);
      return await serveFile(res, file);
    }
    if (req.method === 'POST') {
      if (req.headers.origin !== ORIGIN) return fail(res, new Error('로컬 편집 화면에서만 게시할 수 있습니다.'), 403);
      const raw = await readJSON(req);
      if (url.pathname === '/api/preview') return respond(res, 200, renderHTML(validate(raw, false), true), 'text/html; charset=utf-8');
      if (url.pathname === '/api/publish') return respond(res, 200, await publish(raw));
    }
    fail(res, new Error('페이지를 찾지 못했습니다.'), 404);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 400;
    fail(res, error, status);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`생일 카드 스튜디오: ${ORIGIN}\n`);
});
