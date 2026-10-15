'use strict';
// Shared core: state, helpers, speech, screens, rewards and the tracing engine. Classic scripts sharing one global scope; load order is set in index.html.
const D = DATA;

// ---------------- state ----------------
const KEY = 'appu-garden-v1';
const today = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const defaults = () => ({
  name: '', askedName: false, stars: 0, // the child's name lives only in this device's storage letters: {}, sounds: {}, sight: {}, words: {}, games: {},
  trip: { date: '', done: [], bonus: false }, patIdx: 0, days: [],
  settings: { voice: '', rate: 0.9, tol: 'easy', crayon: '#e8452c', sounds: D.SOUND_KEYS.slice(), wordSets: ['cvc'], sightCount: 20 },
});
function load() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) }, trip: { ...base.trip, ...(s.trip || {}) } }; }
  } catch (e) { /* storage blocked: run without saving */ }
  return base;
}
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const kid = () => S.name || 'friend';
function stat(kind, key, ok) {
  const m = S[kind] || (S[kind] = {});
  const r = m[key] || (m[key] = { r: 0, n: 0 });
  r.n++; if (ok) r.r++;
  const g = S.games[kind] || (S.games[kind] = { r: 0, n: 0 });
  g.n++; if (ok) g.r++;
  save();
}

// ---------------- helpers ----------------
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
const rnd = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];
const shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickN = (arr, n) => shuffle(arr).slice(0, n);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const wait = ms => new Promise(r => setTimeout(r, ms));
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
const PRAISE = ['Super!', 'Well done!', 'Wow, great writing!', 'Fantastic!', 'You did it!', 'Brilliant!', 'Lovely!'];
const LETTER_NAMES = { a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'jee', h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el', m: 'em',
  n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'ess', t: 'tee', u: 'you', v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zed' };
const spell = k => k.toLowerCase().split('').map(c => LETTER_NAMES[c] || c).join(' ');

// ---------------- speech + sound ----------------
const synth = window.speechSynthesis;
let voices = [];
const loadVoices = () => { if (synth) voices = synth.getVoices().filter(v => /^en/i.test(v.lang)); };
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
function pickVoice() {
  if (S.settings.voice) { const v = voices.find(x => x.name === S.settings.voice); if (v) return v; }
  return voices.find(v => /en[-_]IN/i.test(v.lang)) || voices.find(v => /en[-_]GB/i.test(v.lang)) || voices[0];
}
function say(text, rate = 1) {
  return new Promise(res => {
    if (!synth || !text) return res();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
    u.rate = rate * S.settings.rate; u.pitch = 1.1;
    let done = false;
    const fin = () => { if (!done) { done = true; res(); } };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, 1800 + text.length * 110 / u.rate); // Chrome sometimes never fires onend
    synth.speak(u);
  });
}
let lastHint = 0;
const hintSay = t => { const n = performance.now(); if (n - lastHint > 6000) { lastHint = n; say(t); } };

let actx = null;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, t0, dur, type = 'sine', vol = 0.18) {
  const c = audio(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  ding() { tone(880, 0, 0.25); tone(1320, 0.08, 0.35); },
  pop() { tone(620, 0, 0.08, 'triangle', 0.25); tone(940, 0.05, 0.14, 'triangle', 0.2); },
  boop() { tone(260, 0, 0.18, 'sine', 0.12); tone(200, 0.1, 0.25, 'sine', 0.1); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4, 'triangle', 0.16)); },
};

// ---------------- screens ----------------
const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
let screenId = 0, cleanup = [];
function newScreen() {
  cleanup.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
  cleanup = []; screenId++;
  if (synth) synth.cancel();
  app.replaceChildren();
  return screenId;
}
const alive = id => id === screenId;

function frame({ title, onHome, pips = 0, repeat }) {
  const starNum = h('b', null, S.stars);
  const pipEls = Array.from({ length: pips }, () => h('i', { class: 'pip' }));
  const repeatBtn = h('button', { class: 'icon-btn', 'aria-label': 'Say it again', onclick: () => bar.repeat && bar.repeat() }, '🔊');
  const top = h('header', { class: 'topbar' },
    h('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome || showHome }, '🏠'),
    h('h1', { class: 'title' }, title),
    h('div', { class: 'pips' }, pipEls),
    repeatBtn,
    h('span', { class: 'star-count' }, '⭐ ', starNum));
  const body = h('main', { class: 'stage' });
  app.append(top, body);
  const bar = {
    body, repeat,
    setPip(i, state) { if (pipEls[i]) pipEls[i].className = 'pip ' + state; },
    setRepeat(fn) { bar.repeat = fn; repeatBtn.hidden = !fn; },
  };
  repeatBtn.hidden = !repeat;
  return bar;
}

// ---------------- rewards ----------------
const stickerCount = () => Math.min(D.STICKERS.length, Math.floor(S.stars / 5));
const roundStars = (first, total) => (first === total ? 3 : first >= total * 0.6 ? 2 : 1);

function confetti(cv) {
  if (reduceMotion) return;
  const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
  const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
  const cols = ['--sun', '--berry', '--sky-line', '--leaf', '--plum', '--coral'].map(cssVar);
  const parts = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 18 * dpr, vy: (-Math.random() * 16 - 6) * dpr,
    r: (5 + Math.random() * 6) * dpr, c: pick(cols), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4,
  }));
  const t0 = performance.now();
  (function step(t) {
    if (!cv.isConnected || t - t0 > 3200) return;
    ctx.clearRect(0, 0, W, H);
    for (const q of parts) {
      q.vy += 0.5 * dpr; q.x += q.vx; q.y += q.vy; q.vx *= 0.99; q.a += q.va;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = q.c; ctx.fillRect(-q.r, -q.r / 2, q.r * 2, q.r); ctx.restore();
    }
    requestAnimationFrame(step);
  })(t0);
}

function sparkle(el) {
  if (reduceMotion) return;
  for (let i = 0; i < 8; i++) {
    const sp = h('span', { class: 'sparkle', style: `--a:${i * 45}deg` }, '⭐');
    el.append(sp); setTimeout(() => sp.remove(), 900);
  }
}

function celebrate({ title, stars = 2, text }) {
  return new Promise(resolve => {
    const before = stickerCount();
    S.stars += stars; save();
    const after = stickerCount();
    const cv = h('canvas', { class: 'confetti' });
    const card = h('div', { class: 'modal-card celebrate' },
      h('div', { class: 'buddy-big' }, '🐘'),
      h('h2', null, title),
      h('div', { class: 'star-row' }, Array.from({ length: stars }, (_, i) => h('span', { style: `animation-delay:${0.15 + i * 0.25}s` }, '⭐'))),
      h('button', { class: 'big-btn', onclick: next }, 'Next ▶'));
    overlay.replaceChildren(cv, card); overlay.hidden = false;
    confetti(cv); sfx.fanfare(); say(text || title);
    function next() {
      if (after > before) {
        const st = D.STICKERS[after - 1];
        overlay.replaceChildren(h('div', { class: 'modal-card celebrate' },
          h('div', { class: 'sticker-new' }, st), h('h2', null, 'New sticker!'),
          h('button', { class: 'big-btn', onclick: close }, 'Yay! ▶')));
        sfx.fanfare(); say('You got a new sticker for your sticker book!');
      } else close();
    }
    function close() { overlay.hidden = true; overlay.replaceChildren(); resolve(); }
  });
}

// ---------------- tracing engine ----------------
const TOL = { easy: 13, medium: 9, hard: 6 }; // frame units; x-height is 30
const CRAYONS = ['#e8452c', '#2f7fd8', '#2f9e5a', '#8a4fd1', '#f08a00'];
const STAGE_TEXT = { thick: 'Trace it', dots: 'Follow the dots', free: 'Write it yourself' };
const STAGE_SAY = {
  thick: 'Your turn! Start at the green dot and follow the arrows.',
  dots: 'Now follow the dots.',
  free: 'Now write it all by yourself! Start at the green dot.',
};
const Y0 = 6, YH = 110; // visible frame rows

class Tracer {
  constructor(host) {
    this.host = host;
    this.cv = h('canvas', { class: 'trace-cv' });
    host.append(this.cv);
    this.ctx = this.cv.getContext('2d');
    this.strokes = []; this.frameW = 100; this.decor = []; this.stage = 'thick';
    this.k = 1; this.ox = 0; this.oy = 0; this.w = 0; this.dpr = 1;
    this.col = Object.fromEntries(['--sky', '--grass', '--soil', '--sky-line', '--grass-line', '--soil-line', '--mid-line', '--corridor', '--dots',
      '--leaf', '--ink', '--muted', '--card', '--coral'].map(n => [n.slice(2), cssVar(n)]));
    this.reset();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    const c = this.cv;
    c.addEventListener('pointerdown', e => this.down(e));
    c.addEventListener('pointermove', e => this.move(e));
    c.addEventListener('pointerup', e => this.up(e));
    c.addEventListener('pointercancel', e => this.up(e));
    c.addEventListener('contextmenu', e => e.preventDefault());
    this.alive = true;
    const loop = () => { if (!this.alive) return; this.draw(); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  destroy() { this.alive = false; cancelAnimationFrame(this.raf); this.ro.disconnect(); }
  reset() {
    this.cur = 0; this.prog = 0; this.ink = []; this.line = null; this.active = null; this.finished = false;
    this.samples = 0; this.good = 0; this.wobbles = 0; this.off = false; this.hint = false; this.misses = 0;
    this.nudgeAt = -1e9; if (this.demoState) this.stopDemo(); this.dirty = true;
  }
  load({ strokes, frameW, stage, decor = [] }) {
    this.strokes = strokes; this.frameW = frameW; this.stage = stage; this.decor = decor;
    this.reset(); this.resize();
  }
  get tol() { return (TOL[S.settings.tol] || 13) * (this.stage === 'free' ? 1.2 : 1); }
  resize() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = window.devicePixelRatio || 1; this.w = r.width;
    this.cv.width = Math.round(r.width * this.dpr); this.cv.height = Math.round(r.height * this.dpr);
    const pad = 10;
    this.k = Math.min((r.width - 2 * pad) / this.frameW, (r.height - 2 * pad) / YH);
    this.ox = (r.width - this.frameW * this.k) / 2;
    this.oy = (r.height - YH * this.k) / 2 - Y0 * this.k;
    this.dirty = true;
  }
  toFrame(e) {
    const r = this.cv.getBoundingClientRect();
    return [(e.clientX - r.left - this.ox) / this.k, (e.clientY - r.top - this.oy) / this.k];
  }
  down(e) {
    if (this.finished || !this.strokes.length) return;
    if (e.pointerType === 'pen') this.penAt = performance.now();
    else if (e.pointerType === 'touch' && performance.now() - (this.penAt || -1e9) < 1500) return; // palm resting while using a stylus
    if (this.active !== null) return;
    e.preventDefault(); audio();
    if (this.demoState) this.stopDemo();
    const q = this.toFrame(e), st = this.strokes[this.cur];
    const near = this.tol * 1.6;
    if (dist(q, st.pts[this.prog]) > near) {
      if (this.prog > 0 && dist(q, st.pts[0]) <= near) { this.ink = this.ink.filter(x => x.s !== this.cur); this.prog = 0; } // restarting the stroke is fine
      else { this.nudge(); return; }
    }
    if (st.dot) { this.ink.push({ s: this.cur, pts: [st.pts[0]] }); this.complete(); return; }
    this.active = e.pointerId;
    try { this.cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    this.line = { s: this.cur, pts: [q] }; this.ink.push(this.line); this.last = q; this.dirty = true;
  }
  move(e) {
    if (e.pointerId !== this.active) return;
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    for (const ev of evs) {
      const q = this.toFrame(ev), dx = q[0] - this.last[0], dy = q[1] - this.last[1];
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 1.5));
      for (let i = 1; i <= n; i++) {
        const r = [this.last[0] + dx * i / n, this.last[1] + dy * i / n];
        this.line.pts.push(r);
        this.track(r);
        if (this.active === null) return;
      }
      this.last = q;
    }
    this.dirty = true;
  }
  // Progress = closest path point inside a short window ahead, so the child must actually travel the
  // stroke in order; the window stops shortcuts across loops (o, b, p) and jumps to the far end.
  track(q) {
    const pts = this.strokes[this.cur].pts, n = pts.length, tol = this.tol;
    const lo = Math.max(0, this.prog - 10), hi = Math.min(n - 1, this.prog + 15);
    let bi = -1, bd = Infinity;
    for (let i = lo; i <= hi; i++) { const dd = dist(q, pts[i]); if (dd < bd) { bd = dd; bi = i; } }
    this.samples++;
    if (bd <= tol) { this.good++; this.off = false; if (bi > this.prog) this.prog = bi; }
    else if (bd > tol * 1.7 && !this.off) { this.off = true; this.wobbles++; this.offTrack(); }
    if (this.prog >= n - 3) this.complete();
  }
  offTrack() {
    if (this.stage === 'free' && this.wobbles >= 2) this.hint = true;
    if (S.settings.tol === 'hard') {
      this.ink = this.ink.filter(x => x.s !== this.cur); this.prog = 0;
      try { this.cv.releasePointerCapture(this.active); } catch (_) { /* ignore */ }
      this.active = null; sfx.boop(); hintSay('Oops! Try again from the green dot.');
    } else hintSay('Stay on the path!');
  }
  up(e) {
    if (e.pointerId !== this.active) return;
    this.active = null; this.line = null;
    if (S.settings.tol === 'hard' && !this.finished) { this.ink = this.ink.filter(x => x.s !== this.cur); this.prog = 0; }
    this.dirty = true;
  }
  complete() {
    if (this.active !== null) { try { this.cv.releasePointerCapture(this.active); } catch (_) { /* ignore */ } }
    this.active = null; this.line = null; this.off = false;
    sfx.ding(); this.cur++; this.prog = 0; this.dirty = true;
    if (this.cur >= this.strokes.length) {
      this.finished = true;
      const acc = this.samples ? this.good / this.samples : 1;
      setTimeout(() => { if (this.alive && this.onDone) this.onDone({ acc, wobbles: this.wobbles }); }, 450);
    }
  }
  nudge() {
    this.nudgeAt = performance.now(); this.misses++;
    if (this.stage === 'free' && this.misses >= 2) this.hint = true;
    sfx.boop(); hintSay('Start at the green dot.');
  }
  demo() {
    this.reset();
    return new Promise(res => { this.demoState = { t0: performance.now(), res }; });
  }
  stopDemo() { const ds = this.demoState; this.demoState = null; this.dirty = true; if (ds) ds.res(); }

  path(pts, to = pts.length - 1) {
    const c = this.ctx; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= to; i++) c.lineTo(pts[i][0], pts[i][1]);
  }
  draw() {
    const now = performance.now();
    const pulsing = !this.finished && this.active === null;
    if (!this.dirty && !this.demoState && !(pulsing && now - (this.lastDraw || 0) > 50)) return;
    this.lastDraw = now; this.dirty = false;
    const c = this.ctx, k = this.k, dpr = this.dpr, col = this.col;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    c.setTransform(dpr * k, 0, 0, dpr * k, dpr * this.ox, dpr * this.oy);
    const x0 = -this.ox / k, x1 = (this.w - this.ox) / k;
    c.lineCap = 'round'; c.lineJoin = 'round';
    // sky / grass / ground bands and the four writing lines
    [[20, 50, col.sky], [50, 80, col.grass], [80, 110, col.soil]].forEach(([ya, yb, f]) => { c.fillStyle = f; c.fillRect(x0, ya, x1 - x0, yb - ya); });
    [[20, col['sky-line'], 0.7, null], [50, col['mid-line'], 0.6, [3, 3]], [80, col['grass-line'], 1.2, null], [110, col['soil-line'], 0.7, null]]
      .forEach(([y, s, wdt, dash]) => { c.strokeStyle = s; c.lineWidth = wdt; c.setLineDash(dash || []); c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); });
    c.setLineDash([]);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `12px ${cssEmoji}`;
    this.decor.forEach(dc => c.fillText(dc.e, dc.x, dc.y));

    const showPath = this.stage !== 'free' || this.hint;
    const crayon = S.settings.crayon;
    // guides for strokes still to do (and faint ones for strokes done)
    this.strokes.forEach((st, i) => {
      if (i < this.cur) {
        if (this.stage !== 'free' && !st.dot) { this.path(st.pts); c.strokeStyle = col.corridor; c.lineWidth = 2; c.stroke(); }
        return;
      }
      if (!showPath) return;
      if (st.dot) {
        c.setLineDash([1.5, 1.5]); c.strokeStyle = col.dots; c.lineWidth = 0.8;
        c.beginPath(); c.arc(st.pts[0][0], st.pts[0][1], 3, 0, 7); c.stroke(); c.setLineDash([]);
        return;
      }
      if (this.stage === 'thick') {
        this.path(st.pts); c.strokeStyle = col.corridor; c.lineWidth = 14; c.stroke();
        c.setLineDash([2.5, 3]); c.strokeStyle = col.card; c.lineWidth = 1.2; this.path(st.pts); c.stroke(); c.setLineDash([]);
      } else {
        c.fillStyle = col.dots;
        for (let j = 0; j < st.pts.length; j += 2) { c.beginPath(); c.arc(st.pts[j][0], st.pts[j][1], 0.95, 0, 7); c.fill(); }
      }
    });
    // filled progress on the current stroke
    const st = this.strokes[this.cur];
    if (st && !st.dot && this.prog > 0 && this.stage !== 'free') {
      this.path(st.pts, this.prog); c.globalAlpha = 0.3; c.strokeStyle = crayon; c.lineWidth = this.stage === 'thick' ? 14 : 7; c.stroke(); c.globalAlpha = 1;
    }
    // direction arrows on the current stroke
    if (st && !st.dot && showPath && !this.demoState) {
      c.strokeStyle = col.muted; c.lineWidth = 1.1;
      for (let j = 8; j < st.pts.length - 4; j += 14) {
        if (j <= this.prog) continue;
        const [ax, ay] = st.pts[j], [bx, by] = st.pts[Math.min(j + 2, st.pts.length - 1)];
        const ang = Math.atan2(by - ay, bx - ax);
        c.save(); c.translate(ax, ay); c.rotate(ang);
        c.beginPath(); c.moveTo(-2, -2.4); c.lineTo(1.2, 0); c.lineTo(-2, 2.4); c.stroke(); c.restore();
      }
    }
    // start dots: numbered, current one green and pulsing
    c.font = `bold 5px ${cssDisplay}`;
    this.strokes.forEach((s2, i) => {
      if (i < this.cur || this.demoState) return;
      const [sx, sy] = s2.pts[i === this.cur ? this.prog : 0]; // after a lift, the green dot waits where he stopped
      if (i === this.cur && this.active !== null) return;
      if (i > this.cur && st && dist(s2.pts[0], st.pts[this.prog]) < 9) return; // a later start dot under the green one is clutter
      if (i === this.cur) {
        const pulse = 1 + 0.18 * Math.sin(now / 220);
        const nudged = now - this.nudgeAt < 900;
        c.fillStyle = nudged ? col.coral : col.leaf; c.globalAlpha = 0.25;
        c.beginPath(); c.arc(sx, sy, (nudged ? 9 : 6.5) * pulse, 0, 7); c.fill(); c.globalAlpha = 1;
        c.fillStyle = col.leaf; c.beginPath(); c.arc(sx, sy, 4.4, 0, 7); c.fill();
        c.fillStyle = col.card; c.fillText(String(s2.num), sx, sy + 0.3);
      } else if (showPath) {
        c.fillStyle = col.dots; c.beginPath(); c.arc(sx, sy, 3.2, 0, 7); c.fill();
        c.fillStyle = col.card; c.font = `bold 4px ${cssDisplay}`; c.fillText(String(s2.num), sx, sy + 0.25); c.font = `bold 5px ${cssDisplay}`;
      }
    });
    // the child's own ink
    c.strokeStyle = crayon; c.fillStyle = crayon; c.lineWidth = 4.2;
    this.ink.forEach(ln => {
      if (ln.pts.length === 1) { c.beginPath(); c.arc(ln.pts[0][0], ln.pts[0][1], 3, 0, 7); c.fill(); }
      else { this.path(ln.pts); c.stroke(); }
    });
    // the bee leads the way along the current stroke
    if (st && !st.dot && showPath && (this.active !== null || this.prog > 0)) {
      const [bx, by] = st.pts[Math.min(this.prog + 9, st.pts.length - 1)];
      const wig = this.off ? Math.sin(now / 40) * 1.6 : 0;
      c.font = `10px ${cssEmoji}`; c.fillText('🐝', bx + wig, by - 7);
      this.dirty = true;
    }
    if (this.demoState) this.drawDemo(now);
  }
  drawDemo(now) {
    const c = this.ctx, speed = 0.075; // frame units per ms
    let el = now - this.demoState.t0, i = 0;
    c.strokeStyle = this.col.leaf; c.fillStyle = this.col.leaf; c.lineWidth = 5;
    for (; i < this.strokes.length; i++) {
      const st = this.strokes[i];
      const dur = st.dot ? 300 : st.pts.length * 1.5 / speed;
      if (el < dur) {
        let tip;
        if (st.dot) { tip = st.pts[0]; c.beginPath(); c.arc(tip[0], tip[1], 3, 0, 7); c.fill(); }
        else { const to = Math.max(1, Math.floor(st.pts.length * el / dur)); this.path(st.pts, to); c.stroke(); tip = st.pts[to]; }
        c.font = `11px ${cssEmoji}`; c.textAlign = 'left'; c.textBaseline = 'bottom';
        c.fillText('✏️', tip[0] - 1, tip[1] + 1); c.textAlign = 'center'; c.textBaseline = 'middle';
        return;
      }
      if (st.dot) { c.beginPath(); c.arc(st.pts[0][0], st.pts[0][1], 3, 0, 7); c.fill(); } else { this.path(st.pts); c.stroke(); }
      el -= dur + 380;
      if (el < 0) return;
    }
    if (el > 500) this.stopDemo();
  }
}
let cssEmoji = 'sans-serif', cssDisplay = 'sans-serif';

function tracerPanel(container) {
  const host = h('div', { class: 'trace-host' });
  const tracer = new Tracer(host);
  cleanup.push(() => tracer.destroy());
  const crayons = CRAYONS.map(col => h('button', {
    class: 'crayon' + (col === S.settings.crayon ? ' on' : ''), style: `--c:${col}`, 'aria-label': 'Crayon colour',
    onclick: e => { S.settings.crayon = col; save(); crayons.forEach(b => b.classList.toggle('on', b === e.currentTarget)); tracer.dirty = true; },
  }));
  const hintBtn = h('button', { class: 'tool', onclick: () => { tracer.hint = true; tracer.dirty = true; } }, h('b', null, '💡'), h('span', null, 'Help me'));
  const tools = h('div', { class: 'tools' },
    h('button', { class: 'tool', onclick: () => tracer.demo() }, h('b', null, '▶'), h('span', null, 'Show me')),
    h('button', { class: 'tool', onclick: () => tracer.reset() }, h('b', null, '↺'), h('span', null, 'Start again')),
    hintBtn,
    h('div', { class: 'crayons' }, crayons));
  container.append(host, tools);
  return { tracer, setStage(stage) { hintBtn.hidden = stage !== 'free'; } };
}

// A lesson is a list of steps, each tracing one shape at one stage (thick / dots / free). Steps can change
// the shape, so one lesson can write several words, or a long number name in parts.
function traceLesson({ title, steps, recordKey, doneTitle, onFinish, onHome }) {
  const id = newScreen();
  const bar = frame({ title, pips: steps.length, onHome });
  const infoBox = h('div', { class: 'lesson-info' });
  const wrap = h('div', { class: 'lesson' }, infoBox);
  bar.body.append(wrap);
  const panel = tracerPanel(wrap), tracer = panel.tracer;
  let si = 0; const accs = [];
  async function run() {
    const my = si, step = steps[si];
    const stale = () => !alive(id) || si !== my;
    const touched = () => tracer.cur > 0 || tracer.ink.length > 0;
    bar.setPip(si, 'now');
    infoBox.replaceChildren(...[].concat(step.info || []), h('span', { class: 'stage-label' }, step.label || STAGE_TEXT[step.stage]));
    panel.setStage(step.stage);
    bar.setRepeat(step.intro || (() => say(STAGE_SAY[step.stage])));
    tracer.load({ ...step.shape, decor: step.decor || [], stage: step.stage });
    if (step.intro) { await step.intro(); if (stale() || touched()) return; } // he may start tracing while Appu is still talking
    if (step.demo) { await tracer.demo(); if (stale() || touched()) return; }
    if (step.demo || !step.intro) say(STAGE_SAY[step.stage]);
  }
  tracer.onDone = async ({ acc }) => {
    accs.push(acc); bar.setPip(si, 'done');
    if (recordKey) { const r = S.letters[recordKey] || (S.letters[recordKey] = { stars: 0, tries: 0, acc: 0 }); r.stars = Math.max(r.stars, Math.round(3 * (si + 1) / steps.length)); save(); }
    sparkle(wrap); await say(pick(PRAISE)); if (!alive(id)) return;
    si++;
    if (si < steps.length) { run(); return; }
    if (recordKey) {
      const r = S.letters[recordKey]; r.tries++; r.last = today();
      r.acc = Math.round(100 * accs.reduce((x, y) => x + y, 0) / accs.length); save();
    }
    await celebrate({ title: doneTitle, stars: Math.min(3, steps.length), text: `Well done, ${kid()}! ${doneTitle}` });
    if (alive(id)) onFinish();
  };
  run();
}

function letterLesson(key, { onFinish, onHome } = {}) {
  const lower = key.toLowerCase(), cap = key !== lower;
  const [word, pic] = D.LETTER_WORD[lower];
  const name = `${cap ? 'capital' : 'small'} ${spell(key)}`;
  const shape = D.compose([key]);
  const info = [h('span', { class: 'big-letter read' }, key), h('button', { class: 'ex', onclick: () => say(`${spell(key)}, as in ${word}`) }, h('span', { class: 'ex-pic' }, pic), h('span', { class: 'read' }, word))];
  traceLesson({
    title: `Write ${key}`, recordKey: key, doneTitle: `You wrote ${key}!`,
    steps: [
      { shape, stage: 'thick', info, demo: true, intro: () => say(`This is ${name}. ${spell(key)}, as in ${word}. Watch me write it.`) },
      { shape, stage: 'dots', info }, { shape, stage: 'free', info }],
    onFinish: onFinish || (() => showLetterGrid(cap)), onHome,
  });
}

function patternLesson(pt, { onFinish, onHome } = {}) {
  const info = [h('span', { class: 'ex-pic' }, pt.icon), h('span', { class: 'lesson-say' }, pt.say)];
  traceLesson({
    title: pt.name, recordKey: 'pat:' + pt.id, doneTitle: `${pt.name} done!`,
    steps: [
      { shape: pt.shape, decor: pt.decor, stage: 'thick', info, demo: true, intro: () => say(pt.say) },
      { shape: pt.shape, decor: pt.decor, stage: 'dots', info }],
    onFinish: onFinish || showPatternGrid, onHome,
  });
}

// Write a list of words: each word dotted, then on its own (start dots only).
function writeWordsLesson(items, { title = 'Write words', onFinish = showHome, onHome } = {}) {
  const steps = items.flatMap(it => {
    const shape = D.compose(it.w.split('')), info = [h('span', { class: 'ex-pic' }, it.e), h('span', { class: 'big-letter read' }, it.w)];
    return [
      { shape, stage: 'dots', info, intro: () => say(`${it.w}. Write the word ${it.w}. Follow the dots.`) },
      { shape, stage: 'free', info: [h('span', { class: 'ex-pic' }, it.e), h('button', { class: 'ex read', onclick: () => say(it.w) }, '🔊 ', it.w.replace(/./g, '_ '))],
        intro: () => say(`Now write ${it.w} by yourself.`) }];
  });
  traceLesson({ title, steps, doneTitle: 'Super writing!', onFinish, onHome });
}

// ---------------- quiz helpers ----------------
// One multiple-choice question. Resolves true when answered right first time; wrong taps wobble and explain.
function ask(bar, { prompt, top, options, wide = false }) {
  return new Promise(resolve => {
    let wrong = 0, solved = false;
    bar.setRepeat(prompt);
    const btns = options.map(o => h('button', {
      class: o.cls || (wide ? 'word-chip read' : 'tile-letter read'), onclick: async e => {
        if (solved) return;
        const b = e.currentTarget;
        if (o.ok) { solved = true; b.classList.add('right'); sfx.pop(); if (o.right) await o.right(); resolve(wrong === 0); }
        else { wrong++; shake(b); sfx.boop(); if (o.wrong) o.wrong(); }
      },
    }, o.label));
    bar.body.replaceChildren(h('div', { class: 'qa' }, top, h('div', { class: 'choices' + (wide ? ' stack' : '') }, btns)));
    bar.choices = btns;
    prompt();
  });
}

// Say a lead-in, then name each choice while it lights up.
async function sayChoices(lead, btns, words) {
  const my = (sayChoices.token = (sayChoices.token || 0) + 1);
  await say(lead);
  for (let i = 0; i < btns.length; i++) {
    if (my !== sayChoices.token || !btns[i].isConnected) return;
    btns[i].classList.add('speaking'); await say(words[i]); btns[i].classList.remove('speaking');
  }
}

async function runQuiz({ title, items, q, kind, key = it => String(it), doneTitle = 'Well done!', onFinish = showHome, onHome }) {
  const id = newScreen();
  const bar = frame({ title, pips: items.length, onHome });
  let first = 0;
  for (let i = 0; i < items.length; i++) {
    bar.setPip(i, 'now');
    const ok = await q(bar, items[i], i);
    if (!alive(id)) return;
    if (ok) first++;
    if (kind) stat(kind, key(items[i]), ok);
    bar.setPip(i, ok ? 'done' : 'done soft');
    await wait(300);
  }
  await celebrate({ title: doneTitle, stars: roundStars(first, items.length), text: `${doneTitle} Well done, ${kid()}!` });
  if (alive(id)) onFinish();
}

// A screen of activity tiles: [icon, name, sub, run].
function activityMenu({ title, note, top, acts, onHome }) {
  newScreen();
  const bar = frame({ title, onHome });
  bar.body.append(h('div', { class: 'picker' }, note ? h('p', { class: 'picker-note' }, note) : null, top || null,
    h('div', { class: 'tile-grid' }, acts.map(a => h('button', { class: 'tile', onclick: a.run },
      h('span', { class: 'tile-pic' }, a.icon), h('span', { class: 'tile-name' }, a.name), a.sub ? h('small', { class: 'read' }, a.sub) : null)))));
  return bar;
}
const picLabel = e => h('span', { class: 'pic' }, e);

// ---------------- letter + pattern pickers ----------------
const starsText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function showLetterGrid(upper = false) {
  newScreen();
  const bar = frame({ title: 'Write letters' });
  const toggle = h('div', { class: 'seg' },
    h('button', { class: upper ? '' : 'on', onclick: () => showLetterGrid(false) }, 'abc  small'),
    h('button', { class: upper ? 'on' : '', onclick: () => showLetterGrid(true) }, 'ABC  capital'));
  const groups = D.JOLLY_GROUPS.map((g, gi) => h('section', { class: 'letter-group' },
    h('h2', null, gi < 3 ? `Group ${gi + 1}` : 'More letters'),
    h('div', { class: 'letter-row' }, g.map(ch => {
      const key = upper ? ch.toUpperCase() : ch, n = (S.letters[key] || {}).stars || 0;
      return h('button', { class: 'letter-tile' + (n >= 3 ? ' done' : ''), onclick: () => letterLesson(key) },
        h('span', { class: 'read' }, key), h('small', null, starsText(n)));
    }))));
  bar.body.append(h('div', { class: 'picker' }, toggle, groups));
}

function showPatternGrid() {
  newScreen();
  const bar = frame({ title: 'Warm-up lines' });
  bar.body.append(h('div', { class: 'picker' },
    h('p', { class: 'picker-note' }, 'Warm up the fingers before writing letters. Every letter is made of these lines.'),
    h('div', { class: 'tile-grid' }, D.PATTERNS.map(pt => {
      const n = (S.letters['pat:' + pt.id] || {}).stars || 0;
      return h('button', { class: 'tile', onclick: () => patternLesson(pt) },
        h('span', { class: 'tile-pic' }, pt.icon), h('span', { class: 'tile-name' }, pt.name), h('small', null, starsText(n)));
    }))));
}
