const THEMES = { electric: '햇살 전기 파티', peach: '복숭아빛 축하' };
const CHARACTERS = { pikachu: '피카츄', pichu: '피츄', jolteon: '쥬피썬더' };
const ANIMATIONS = { electric: '촛불 켜기', bow: '꾸벅 인사' };
const PUBLIC_BASE = 'https://pollmap.github.io/birthday-card-studio/';

function cleanText(value, max, label) {
  if (typeof value !== 'string') throw new Error(`${label}을(를) 입력해 주세요.`);
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text || [...text].length > max) throw new Error(`${label}은(는) 1~${max}자로 입력해 주세요.`);
  return text;
}

function validate(input, requireSlug = true) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('카드 내용을 확인해 주세요.');
  const slug = String(input.slug || '').trim().toLowerCase();
  if (requireSlug && !/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug)) throw new Error('주소 이름은 영문 소문자·숫자·하이픈으로 2~48자여야 합니다.');
  const recipient = cleanText(input.recipient, 30, '받는 분 이름');
  const salutation = cleanText(input.salutation, 18, '카드 호칭');
  const message = cleanText(input.message, 22, '축하 문구');
  const signature = cleanText(input.signature, 30, '서명');
  const previewTitle = input.previewTitle && String(input.previewTitle).trim()
    ? cleanText(input.previewTitle, 54, '링크 제목')
    : `${salutation} ${message}`;
  const theme = String(input.theme || 'electric');
  const leftCharacter = String(input.leftCharacter || 'pikachu');
  const rightCharacter = String(input.rightCharacter || 'pichu');
  const animation = String(input.animation || 'electric');
  if (!(theme in THEMES)) throw new Error('테마를 선택해 주세요.');
  if (!(leftCharacter in CHARACTERS) || !(rightCharacter in CHARACTERS)) throw new Error('포켓몬을 선택해 주세요.');
  if (!(animation in ANIMATIONS)) throw new Error('연출을 선택해 주세요.');
  return { slug, recipient, salutation, message, signature, previewTitle, theme, leftCharacter, rightCharacter, animation };
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderHTML(config, preview = false) {
  const c = validate(config, !preview);
  const base = preview ? '/' : '../../';
  const url = `${PUBLIC_BASE}cards/${encodeURIComponent(c.slug || 'preview')}/`;
  const og = `${url}og.png`;
  const description = `${c.recipient} 님께 보내는 생일 카드 · ${CHARACTERS[c.leftCharacter]}와 ${CHARACTERS[c.rightCharacter]}가 함께 축하합니다.`;
  const head = preview ? '' : `
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="${esc(c.previewTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(og)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(c.recipient)} 님께 보내는 생일 카드">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(c.previewTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(og)}">
  <link rel="canonical" href="${esc(url)}">`;
  const char = (side, name) => `<div class="character ${side} pokemon-${name}"><img src="${base}assets/characters/${name}.png" alt="축하하는 ${CHARACTERS[name]}" width="475" height="475"></div>`;
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="${c.theme === 'peach' ? '#e8b9b4' : '#efbd43'}">
  <meta name="description" content="${esc(description)}">${head}
  <title>${esc(c.previewTitle)}</title>
  <link rel="stylesheet" href="${base}assets/card.css">
</head>
<body class="theme-${c.theme}">
  <main class="card" id="card" data-animation="${c.animation}" aria-label="${esc(c.recipient)} 님 생일 카드">
    <header class="headline"><h1><span>${esc(c.salutation)}</span><span class="accent">${esc(c.message)}</span></h1></header>
    <div class="scene" id="scene">
      ${char('left', c.leftCharacter)}
      ${char('right', c.rightCharacter)}
      <div class="cake" id="cake"><img src="${base}assets/cake.png" alt="딸기 생크림 생일 케이크" width="1254" height="1254"><i class="flame" aria-hidden="true"></i><i class="flame" aria-hidden="true"></i><i class="flame" aria-hidden="true"></i><i class="flame" aria-hidden="true"></i><i class="flame" aria-hidden="true"></i></div>
      <canvas id="effects" aria-hidden="true"></canvas>
    </div>
    <footer class="footer"><p class="signature">${esc(c.signature)}</p><button id="replay" class="replay" type="button" aria-label="생일 카드 다시 보기">↻ 다시 보기</button></footer>
    <span id="announcement" class="sr-only" role="status" aria-live="polite"></span>
  </main>
  <script defer src="${base}assets/card.js"></script>
</body>
</html>`;
}

module.exports = { THEMES, CHARACTERS, ANIMATIONS, PUBLIC_BASE, validate, renderHTML };
