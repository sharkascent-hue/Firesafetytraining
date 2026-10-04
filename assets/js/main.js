/* Kirby Fire Safety: site interactions */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Header, fuse progress, floating buttons ---------- */
  const header = $('#header');
  const fuse = $('.fuse');
  const toTop = $('#toTop');
  const callFab = $('.call-fab');
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header && header.classList.toggle('scrolled', y > 10);
    fuse && fuse.style.setProperty('--p', (max > 0 ? (y / max) * 100 : 0) + '%');
    toTop && toTop.classList.toggle('show', y > 600);
    callFab && callFab.classList.toggle('show', y > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop && toTop.addEventListener('click', () => scrollTo({ top: 0 }));

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const setNav = open => {
    document.body.classList.toggle('nav-open', open);
    burger && burger.setAttribute('aria-expanded', open);
  };
  burger && burger.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  addEventListener('keydown', e => e.key === 'Escape' && setNav(false));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setNav(false)));

  /* ---------- Reveal on scroll ---------- */
  $$('[data-stagger]').forEach(group => {
    [...group.children].forEach((c, i) => {
      c.classList.add('reveal');
      c.style.setProperty('--rd', (i * 0.1) + 's');
    });
  });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .stat, .modules, .process, .report, [data-count]').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, start = +(el.dataset.from || 0);
    if (reduced) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * k);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Card glow follows pointer ---------- */
  $$('.glow-card').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- Embers ---------- */
  function embers(canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], running = false, raf;
    const density = +(canvas.dataset.density || 60);
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      r: Math.random() * 2.2 + .6,
      vy: -(Math.random() * .8 + .35),
      vx: (Math.random() - .5) * .3,
      sway: Math.random() * Math.PI * 2,
      life: 0, max: Math.random() * 400 + 260,
      hue: Math.random() * 30 + 15
    });
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.life++; p.sway += .02;
        p.x += p.vx + Math.sin(p.sway) * .35; p.y += p.vy;
        const k = p.life / p.max, a = Math.max(0, (k < .1 ? k * 10 : 1 - k)) * .9;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue + 20},100%,75%,${a})`);
        g.addColorStop(.35, `hsla(${p.hue},100%,55%,${a * .6})`);
        g.addColorStop(1, 'hsla(10,100%,50%,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        if (p.life > p.max || p.y < -20) Object.assign(p, spawn(false));
      }
      if (running) raf = requestAnimationFrame(frame);
    };
    resize();
    const n = Math.round(density * Math.min(1, w / 1200) + 12);
    for (let i = 0; i < n; i++) parts.push(spawn(true));
    addEventListener('resize', resize);
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(frame);
    }).observe(canvas);
  }
  if (!reduced) $$('.embers-canvas').forEach(embers);

  /* ---------- Video ---------- */
  const video = $('#courseVideo'), play = $('#playBtn');
  if (video && play) {
    play.addEventListener('click', () => video.play());
    video.addEventListener('play', () => play.classList.add('hidden'));
    video.addEventListener('ended', () => play.classList.remove('hidden'));
  }

  /* ---------- Testimonial slider ---------- */
  const slider = $('.slider');
  if (slider) {
    const slides = $$('.slide', slider), dots = $$('.dots button', slider);
    let i = 0, timer;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((d, k) => { d.classList.remove('on'); if (k === i) { void d.offsetWidth; d.classList.add('on'); } });
      clearTimeout(timer); timer = setTimeout(() => go(i + 1), 6000);
    };
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    // Swipe left/right on touch screens
    let sx = null, sy = null;
    slider.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    slider.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
    go(0);
  }

  /* ---------- Fire triangle ---------- */
  const tri = $('#tri');
  if (tri) {
    const msg = $('#triMsg');
    const btns = $$('.tri-btn');
    const text = {
      heat: 'Heat removed: cooling with water takes away the heat, so the fire goes out.',
      fuel: 'Fuel removed: with nothing left to burn, the fire dies.',
      oxygen: 'Oxygen removed: smothering the fire (a fire blanket or CO₂) starves it of oxygen.'
    };
    const update = () => {
      const off = btns.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.side);
      ['heat', 'fuel', 'oxygen'].forEach(s => $$(`[data-part="${s}"]`, tri).forEach(el => el.classList.toggle('off', off.includes(s))));
      tri.classList.toggle('out', off.length > 0);
      btns.forEach(b => $('.state', b).textContent = b.getAttribute('aria-pressed') === 'true' ? 'Removed' : 'Present');
      msg.classList.toggle('good', off.length > 0);
      msg.textContent = off.length ? text[off[off.length - 1]] + ' Fire out!' : 'All three sides are present, so the fire burns. Remove any one to put it out.';
    };
    btns.forEach(b => b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      update();
    }));
    const reset = $('#triReset');
    reset && reset.addEventListener('click', () => { btns.forEach(b => b.setAttribute('aria-pressed', 'false')); update(); });
    update();
  }

  /* ---------- Extinguisher guide ---------- */
  const guide = $('#extGuide');
  if (guide) {
    const data = {
      water: { name: 'Water', color: '#C8211B', label: 'Red label', classes: ['Class A: wood, paper, textiles'], yes: ['Solid materials such as wood, paper, cardboard, fabric and furniture'], no: ['Electrical equipment', 'Flammable liquids', 'Cooking oil and fat fires'] },
      foam: { name: 'Foam', color: '#F1E1B0', label: 'Cream label', classes: ['Class A', 'Class B: flammable liquids'], yes: ['Solid materials', 'Flammable liquids such as petrol, diesel and paint'], no: ['Cooking oil and fat fires', 'Live electrical equipment'] },
      co2: { name: 'CO₂', color: '#151515', label: 'Black label', classes: ['Electrical fires', 'Class B'], yes: ['Electrical equipment such as computers and server rooms', 'Flammable liquids'], no: ['Cooking oil and fat fires', 'Don\'t hold the horn: it gets extremely cold', 'Confined spaces'] },
      powder: { name: 'Dry Powder', color: '#2B5FB4', label: 'Blue label', classes: ['Class A', 'Class B', 'Class C: flammable gases', 'Electrical'], yes: ['Mixed-risk areas, vehicles, forecourts and outdoor sites', 'Flammable gases and liquids'], no: ['Cooking oil and fat fires', 'Enclosed spaces: the powder cuts visibility and can be inhaled'] },
      wetchem: { name: 'Wet Chemical', color: '#F2B92B', label: 'Yellow label', classes: ['Class F: cooking oils & fats', 'Class A'], yes: ['Deep fat fryers and commercial kitchens', 'Some solid-material fires'], no: ['Electrical equipment', 'Flammable liquids and gases'] }
    };
    const band = $('.band-fill', guide), panel = $('#extPanel', guide), tabs = $$('.ext-tab', guide);
    const show = key => {
      const d = data[key];
      tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.key === key));
      band.setAttribute('fill', d.color);
      panel.innerHTML = `<div class="ext-panel"><span class="eyebrow" style="color:var(--gold)">${d.label}</span><h3>${d.name} extinguisher</h3>
        <div class="cls">${d.classes.map(c => `<span>${c}</span>`).join('')}</div>
        <div class="ext-cols"><div class="yes"><h4>Use on</h4><ul>${d.yes.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div class="no"><h4>Never use on</h4><ul>${d.no.map(x => `<li>${x}</li>`).join('')}</ul></div></div></div>`;
    };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.key)));
    show('water');
  }

  /* ---------- Enquiry form: sends straight to Enda's inbox ---------- */
  const FORM_ENDPOINT = 'https://formsubmit.co/ajax/enda@firesafetraining.ie';
  $$('.enquiry-form').forEach(form => {
    const pre = new URLSearchParams(location.search).get('service');
    if (pre) [...form.service.options].forEach(o => { if (o.value === pre) o.selected = true; });
    const note = $('.form-note', form), btn = $('button[type="submit"]', form);
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const d = Object.fromEntries(new FormData(form));
      if (d._honey) return;
      btn.disabled = true; form.classList.add('sending');
      note.textContent = 'Sending your enquiry…';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: 'Website enquiry: ' + d.service,
            _template: 'table', _captcha: 'false', _replyto: d.email,
            Name: d.name, Company: d.company || '-', Email: d.email, Phone: d.phone || '-',
            'Interested in': d.service, Message: d.message, Page: document.title
          })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.success === false || out.success === 'false') throw new Error(out.message || 'Send failed');
        form.classList.add('sent');
        $('.form-success', form).hidden = false;
        form.reset();
      } catch (err) {
        note.innerHTML = 'Sorry, we couldn\'t send that just now. Please call <a href="tel:+353863716251">086 371 6251</a> or email <a href="mailto:enda@firesafetraining.ie">enda@firesafetraining.ie</a>.';
      } finally {
        btn.disabled = false; form.classList.remove('sending');
      }
    });
  });

  $$('.year').forEach(el => (el.textContent = new Date().getFullYear()));

  /* =========================================================
     INTRO: house fire put out by an extinguisher
     ========================================================= */
  const intro = $('#intro');
  if (!intro || root.classList.contains('no-intro')) { intro && intro.remove(); return; }

  const canvas = $('#introCanvas'), ctx = canvas.getContext('2d');
  const W = 800, H = 500;
  let scale = 1;
  const fit = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    scale = canvas.clientWidth / W;
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  };
  fit(); addEventListener('resize', fit);

  const sources = [
    { x: 395, y: 318, w: 18, s: 1 }, { x: 545, y: 318, w: 18, s: 1 },
    { x: 470, y: 200, w: 40, s: 1.45 }, { x: 405, y: 236, w: 22, s: .9 }, { x: 535, y: 236, w: 22, s: .9 }
  ];
  const NOZ = { x: 272, y: 322 };
  const fire = [], spray = [], smoke = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  let start = null, last = 0, done = false;
  const T = { extIn: .9, sprayOn: 1.55, decay: 1.8, decayLen: 2.1, sprayOff: 4.0, brand: 4.5, leave: 6.6 };
  const flags = {};
  const at = (key, t, fn) => { if (!flags[key] && t >= T[key]) { flags[key] = true; fn(); } };

  const finish = () => {
    if (done) return; done = true;
    try { sessionStorage.setItem('kfs-intro', '1'); } catch (e) {}
    intro.classList.add('leave');
    root.classList.remove('has-intro');
    setTimeout(() => intro.remove(), 1000);
  };
  $('.intro-skip', intro).addEventListener('click', finish);

  const loop = now => {
    if (done) return;
    if (start === null) { start = now; last = now; }
    const t = (now - start) / 1000;
    const f = Math.min(3, (now - last) / 16.67); last = now;

    at('extIn', t, () => intro.classList.add('ext-in'));
    at('sprayOn', t, () => intro.classList.add('spraying'));
    at('sprayOff', t, () => { intro.classList.remove('spraying'); intro.classList.add('out'); });
    at('brand', t, () => intro.classList.add('brand'));
    at('leave', t, finish);

    const intensity = t < T.decay ? Math.min(1, t / .5) : Math.max(0, 1 - (t - T.decay) / T.decayLen);

    // spawn fire
    for (const s of sources) {
      const n = intensity * s.s * 2.6 * f;
      for (let k = 0; k < n; k++) {
        if (Math.random() > n - k && k >= Math.floor(n)) break;
        fire.push({ x: s.x + rnd(-s.w, s.w), y: s.y + rnd(-4, 4), vx: rnd(-.35, .35), vy: -rnd(1.2, 2.6) * s.s, life: 0, max: rnd(22, 42) * (.6 + .4 * s.s), r: rnd(8, 16) * s.s * (.5 + .5 * intensity) });
      }
    }
    // spray
    const spraying = t > T.sprayOn && t < T.sprayOff;
    if (spraying) {
      const sweep = Math.sin((t - T.sprayOn) * 3.2);
      const tx = 470 + sweep * 90, ty = 255 + Math.cos((t - T.sprayOn) * 4.1) * 55;
      const base = Math.atan2(ty - NOZ.y - 40, tx - NOZ.x);
      for (let k = 0; k < 7 * f; k++) {
        const a = base + rnd(-.09, .09), v = rnd(8.5, 11.5);
        spray.push({ x: NOZ.x, y: NOZ.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(30, 44), r: rnd(1.4, 2.6) });
      }
    }
    // smoke
    if (t > T.decay && t < T.brand + 1.5) {
      const rate = (1 - intensity) * (t < T.sprayOff + .4 ? 1.6 : .6) * f;
      for (const s of sources) if (Math.random() < rate * .45) smoke.push({ x: s.x + rnd(-s.w, s.w), y: s.y, vx: rnd(.1, .6), vy: -rnd(.6, 1.3), life: 0, max: rnd(90, 150), r: rnd(10, 18) });
    }

    ctx.clearRect(0, 0, W, H);
    // house glow
    if (intensity > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(470, 260, 10, 470, 260, 260);
      g.addColorStop(0, `rgba(255,120,30,${.35 * intensity})`);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // smoke
    ctx.globalCompositeOperation = 'source-over';
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i]; p.life += f; p.x += p.vx * f; p.y += p.vy * f; p.r += .35 * f;
      const k = p.life / p.max, a = (k < .2 ? k * 5 : 1 - k) * .22;
      if (k >= 1) { smoke.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(170,170,170,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    // fire
    ctx.globalCompositeOperation = 'lighter';
    for (let i = fire.length - 1; i >= 0; i--) {
      const p = fire[i]; p.life += f; p.x += p.vx * f; p.y += p.vy * f; p.vx *= .98;
      const k = p.life / p.max;
      if (k >= 1) { fire.splice(i, 1); continue; }
      const r = p.r * (1 - k * .7), hue = 52 - k * 50, light = 62 - k * 18, a = (1 - k) * .55;
      ctx.fillStyle = `hsla(${hue},100%,${light}%,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }
    // spray
    ctx.globalCompositeOperation = 'source-over';
    for (let i = spray.length - 1; i >= 0; i--) {
      const p = spray[i]; p.life += f; p.x += p.vx * f; p.y += p.vy * f; p.vy += .16 * f; p.vx *= .985; p.r += .09 * f;
      const k = p.life / p.max;
      if (k >= 1 || p.y > 432) { spray.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(232,242,255,${(1 - k) * .75})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
