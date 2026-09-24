const form = document.getElementById('card-form');
const existing = document.getElementById('existing');
const iframe = document.getElementById('card-preview');
const feedback = document.getElementById('feedback');
const publishButton = document.getElementById('publish');
const refreshButton = document.getElementById('refresh');
let cards = [];
let previewTimer;

const field = name => form.elements.namedItem(name);
const newSlug = () => `card-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5)}`;

function values(forPreview = false) {
  const read = name => field(name).value.trim();
  return {
    slug: read('slug'),
    recipient: read('recipient') || (forPreview ? '생일 주인공' : ''),
    salutation: read('salutation') || (forPreview ? '오늘의 주인공,' : ''),
    message: read('message'),
    signature: read('signature'),
    previewTitle: read('previewTitle'),
    theme: read('theme'),
    animation: read('animation'),
    leftCharacter: read('leftCharacter'),
    rightCharacter: read('rightCharacter')
  };
}

function note(message, error = false, link = '') {
  feedback.classList.toggle('error', error);
  feedback.replaceChildren(document.createTextNode(message));
  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = ' 카드 열기 ↗';
    feedback.append(anchor);
  }
}

async function request(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `요청 실패: ${response.status}`);
  }
  return response;
}

async function preview() {
  try {
    const html = await (await request('/api/preview', values(true))).text();
    iframe.srcdoc = html;
  } catch (error) {
    note(`미리보기: ${error.message}`, true);
  }
}

function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(preview, 240);
}

function fill(card) {
  for (const name of ['slug', 'recipient', 'salutation', 'message', 'signature', 'previewTitle', 'theme', 'animation', 'leftCharacter', 'rightCharacter']) {
    field(name).value = card[name] ?? '';
  }
  publishButton.textContent = cards.some(item => item.slug === card.slug) ? '기존 카드 업데이트' : '새 카드 게시하기';
  note('');
  preview();
}

async function loadCards(selectSlug = '') {
  const response = await fetch('/api/cards');
  cards = await response.json();
  existing.replaceChildren(new Option('새 카드 만들기', ''));
  for (const card of cards) existing.add(new Option(`${card.recipient} · ${card.slug}`, card.slug));
  existing.value = selectSlug;
}

async function pollStatus(sha, url) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 4500));
    try {
      const response = await fetch(`/api/status?sha=${encodeURIComponent(sha)}`);
      const data = await response.json();
      if (data.status === 'built') { note('게시 완료! 링크를 열어 카드와 썸네일을 확인해 주세요.', false, url); return; }
      if (data.status === 'errored') { note('GitHub Pages 배포가 실패했습니다. 저장소의 Actions 상태를 확인해 주세요.', true, url); return; }
    } catch { /* Brief network errors do not cancel a GitHub Pages build. */ }
  }
  note('GitHub에 올렸습니다. Pages 배포가 계속 진행 중이니 잠시 후 링크를 확인해 주세요.', false, url);
}

form.addEventListener('input', schedulePreview);
form.addEventListener('change', schedulePreview);
field('slug').addEventListener('input', () => {
  publishButton.textContent = cards.some(item => item.slug === field('slug').value.trim()) ? '기존 카드 업데이트' : '새 카드 게시하기';
});
refreshButton.addEventListener('click', preview);
existing.addEventListener('change', () => {
  const card = cards.find(item => item.slug === existing.value);
  if (card) fill(card);
  else fill({ slug: newSlug(), recipient: '', salutation: '', message: '생일 축하해!', signature: '이찬희 드림', previewTitle: '', theme: 'electric', animation: 'electric', leftCharacter: 'pikachu', rightCharacter: 'pichu' });
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const config = values();
  publishButton.disabled = true;
  note('썸네일을 만들고 GitHub에 게시하는 중입니다…');
  try {
    const result = await (await request('/api/publish', config)).json();
    await loadCards(config.slug);
    publishButton.textContent = '기존 카드 업데이트';
    if (result.status === 'unchanged') note('이미 게시된 내용입니다.', false, result.url);
    else { note('GitHub에 올렸습니다. Pages 배포를 확인 중입니다…', false, result.url); pollStatus(result.sha, result.url); }
  } catch (error) {
    note(`게시 실패: ${error.message}`, true);
  } finally {
    publishButton.disabled = false;
  }
});

loadCards().then(() => fill({ slug: newSlug(), recipient: '', salutation: '', message: '생일 축하해!', signature: '이찬희 드림', previewTitle: '', theme: 'electric', animation: 'electric', leftCharacter: 'pikachu', rightCharacter: 'pichu' }))
  .catch(error => note(`카드 목록을 열지 못했습니다: ${error.message}`, true));
