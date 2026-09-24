(() => {
  const card = document.getElementById('card');
  if (!card) return;
  const scene = document.getElementById('scene');
  const cake = document.getElementById('cake');
  const canvas = document.getElementById('effects');
  const ctx = canvas.getContext('2d');
  const replay = document.getElementById('replay');
  const announcement = document.getElementById('announcement');
  const flames = [...cake.querySelectorAll('.flame')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timers = [];
  let frame = 0;
  let particles = [];
  let burstAt = 0;
  let bounds = { width: 0, height: 0 };
  let electric = null;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function fitHeadline() {
    const heading = card.querySelector('h1');
    const width = card.querySelector('.headline').clientWidth - 20;
    let size = innerWidth <= 360 ? 32 : 39;
    heading.style.fontSize = `${size}px`;
    while (size > 27 && [...heading.children].some(line => line.scrollWidth > width)) {
      heading.style.fontSize = `${--size}px`;
    }
  }

  function resize() {
    fitHeadline();
    if (!ctx) return;
    const rect = scene.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    bounds = { width: rect.width, height: rect.height };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawBolt(points, alpha, width) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach(point => ctx.lineTo(...point));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 17;
    ctx.shadowColor = `rgba(255,179,36,${alpha})`;
    ctx.strokeStyle = `rgba(255,180,45,${alpha * .7})`;
    ctx.lineWidth = width * 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,255,231,${alpha})`;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function paint(now) {
    frame = requestAnimationFrame(paint);
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    const elapsed = now - burstAt;
    if (electric && elapsed < 850) {
      const alpha = Math.min(1, elapsed / 120) * Math.max(0, 1 - elapsed / 850);
      [electric.left, electric.right].forEach((start, side) => {
        const points = [start];
        for (let step = 1; step < 7; step++) {
          const t = step / 7;
          points.push([
            start[0] + (electric.target[0] - start[0]) * t,
            start[1] + (electric.target[1] - start[1]) * t + Math.sin(step * 2.7 + Math.floor(elapsed / 65) * 3 + side * 4) * 11
          ]);
        }
        points.push(electric.target);
        drawBolt(points, alpha, 2.7);
      });
    }
    particles = particles.filter(p => now - p.born < p.life);
    for (const p of particles) {
      const t = (now - p.born) / p.life;
      ctx.save();
      ctx.translate(p.x + p.vx * t, p.y + p.vy * t + 90 * t * t);
      ctx.rotate(p.angle + t * p.spin);
      ctx.globalAlpha = Math.min(1, (1 - t) * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      ctx.restore();
    }
    if (elapsed > 1800 && !particles.length) {
      cancelAnimationFrame(frame);
      frame = 0;
      ctx.clearRect(0, 0, bounds.width, bounds.height);
    }
  }

  function burst() {
    if (!ctx || reduced.matches) return;
    resize();
    const stage = scene.getBoundingClientRect();
    const cakeRect = cake.getBoundingClientRect();
    const left = scene.querySelector('.character.left').getBoundingClientRect();
    const right = scene.querySelector('.character.right').getBoundingClientRect();
    const cx = cakeRect.left - stage.left + cakeRect.width / 2;
    const cy = cakeRect.top - stage.top + cakeRect.height * .27;
    electric = card.dataset.animation === 'electric' ? {
      target: [cx, cakeRect.top - stage.top + cakeRect.height * .12],
      left: [left.left - stage.left + left.width * .69, left.top - stage.top + left.height * .43],
      right: [right.left - stage.left + right.width * .24, right.top - stage.top + right.height * .43]
    } : null;
    const colors = card.dataset.animation === 'bow'
      ? ['#b87995', '#f5d9a6', '#fff8ef', '#dba3a0', '#a58fbe']
      : ['#e99c22', '#f4c545', '#fff8d5', '#d7773c', '#edb5a0'];
    const now = performance.now();
    particles = Array.from({ length: 46 }, (_, i) => {
      const angle = i * 2.39996;
      const speed = 75 + (i % 7) * 15;
      return { x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 90,
        size: 3 + i % 4, angle, spin: (i % 2 ? -1 : 1) * (2 + i % 5), born: now,
        life: 1150 + i % 5 * 100, color: colors[i % colors.length] };
    });
    burstAt = now;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(paint);
    if (electric) { card.classList.add('charged'); later(() => card.classList.remove('charged'), 650); }
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    particles = [];
    if (ctx) ctx.clearRect(0, 0, bounds.width, bounds.height);
    flames.forEach(flame => flame.classList.remove('lit'));
    card.classList.remove('playing', 'revealed', 'finished', 'bowing', 'charged');
    announcement.textContent = '';
    void card.offsetWidth;
  }

  function start() {
    reset();
    if (reduced.matches) {
      card.classList.add('playing', 'revealed', 'finished');
      flames.forEach(flame => flame.classList.add('lit'));
      announcement.textContent = `${card.querySelector('h1').textContent} ${card.querySelector('.signature').textContent}`;
      return;
    }
    card.classList.add('playing');
    flames.forEach((flame, index) => later(() => flame.classList.add('lit'), 1740 + index * 90));
    later(burst, 2150);
    later(() => {
      card.classList.add('revealed');
      announcement.textContent = `${card.querySelector('h1').textContent} ${card.querySelector('.signature').textContent}`;
    }, 2530);
    if (card.dataset.animation === 'bow') {
      later(() => card.classList.add('bowing'), 2740);
      later(() => card.classList.remove('bowing'), 3840);
    }
    later(() => card.classList.add('finished'), 3900);
  }

  replay.addEventListener('click', start);
  window.addEventListener('resize', resize, { passive: true });
  resize();
  Promise.all([...document.images].map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  }))).then(start);
})();
