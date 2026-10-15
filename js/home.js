'use strict';
// Daily trip, home screen, sticker book, grown-ups corner and boot. Classic scripts sharing one global scope; load order is set in index.html.
// ---------------- daily trip ----------------
const TRIP = [
  { label: 'Warm-up', icon: '🌧️' }, { label: 'Write', icon: '✏️' }, { label: 'Listen', icon: '👂' },
  { label: 'Words', icon: '🧩' }, { label: 'Numbers', icon: '🔢' }, { label: 'Read', icon: '📖' },
];
function ensureTrip() {
  if (S.trip.date !== today() || S.trip.done.length !== TRIP.length) { S.trip = { date: today(), done: TRIP.map(() => false), bonus: false }; save(); }
  if (!S.days.includes(today())) { S.days.push(today()); save(); }
}
function nextLetter() {
  const all = [...D.JOLLY_ORDER, ...D.JOLLY_ORDER.map(c => c.toUpperCase())];
  return all.find(k => ((S.letters[k] || {}).stars || 0) < 3)
    || all.slice().sort((x, y) => ((S.letters[x] || {}).acc || 0) - ((S.letters[y] || {}).acc || 0))[0];
}
function startStop(i) {
  const finish = async () => {
    S.trip.done[i] = true; save();
    if (S.trip.done.every(Boolean) && !S.trip.bonus) {
      S.trip.bonus = true; save();
      await celebrate({ title: 'Trip complete!', stars: 3, text: `Hooray ${kid()}! You finished today's trip with Appu!` });
    }
    showHome();
  };
  if (i === 0) { const pt = D.PATTERNS[S.patIdx % D.PATTERNS.length]; S.patIdx++; save(); patternLesson(pt, { onFinish: finish }); }
  else if (i === 1) letterLesson(nextLetter(), { onFinish: finish });
  else if (i === 2) pick(LISTEN_ACTS).play({ count: 4, onFinish: finish });
  else if (i === 3) pick(WORD_ACTS.slice(0, 4)).play({ count: 4, set: S.settings.wordSet, onFinish: finish });
  else if (i === 4) {
    if (new Date().getDate() % 2) numberLesson(nextNumberToWrite(), { onFinish: finish }); // writing days alternate with quiz days
    else pick(NUM_ACTS.slice(1)).play({ count: 4, onFinish: finish });
  } else pick(READ_ACTS).play({ count: 3, onFinish: finish });
}

// ---------------- home ----------------
function showHome() {
  newScreen();
  ensureTrip();
  const nextIdx = S.trip.done.findIndex(x => !x);
  const stops = TRIP.map((s, i) => h('button', {
    class: 'stop' + (S.trip.done[i] ? ' done' : '') + (i === nextIdx ? ' next' : ''), onclick: () => startStop(i), 'aria-label': s.label,
  }, i === nextIdx ? h('span', { class: 'appu' }, '🐘') : null,
  h('span', { class: 'stop-dot' }, S.trip.done[i] ? '✔' : s.icon), h('span', { class: 'stop-label' }, s.label)));
  const trip = h('section', { class: 'trip' },
    h('div', { class: 'trip-head' }, h('h2', null, "Today's trip"), h('span', { class: 'trip-count' }, `${S.trip.done.filter(Boolean).length} of ${TRIP.length}`)),
    h('div', { class: 'trip-path', style: `grid-template-columns:repeat(${TRIP.length}, minmax(0, 1fr))` }, stops),
    nextIdx >= 0
      ? h('button', { class: 'big-btn', onclick: () => startStop(nextIdx) }, nextIdx === 0 ? "Let's go! ▶" : 'Keep going ▶')
      : h('p', { class: 'trip-done' }, 'All done today! Come back tomorrow for a new trip.'));
  const tiles = [
    ['🌧️', 'Warm-up lines', showPatternGrid, '--sky'],
    ['✏️', 'Write letters', () => showLetterGrid(false), '--sun-soft'],
    ['👂', 'Listen & sounds', showListenMenu, '--grass'],
    ['🧩', 'Small words', showWordsMenu, '--berry-soft'],
    ['📖', 'Read sentences', showReadMenu, '--soil'],
    ['🔢', 'Number words', showNumbersMenu, '--sky'],
    ['🎈', 'Pop the word', () => gameSight({ count: 6 }), '--sun-soft'],
    ['🦁', 'Sticker book', showStickers, '--grass'],
  ].map(([e, name, fn, bg]) => h('button', { class: 'tile', style: `--bg:var(${bg})`, onclick: fn }, h('span', { class: 'tile-pic' }, e), h('span', { class: 'tile-name' }, name)));
  const head = h('header', { class: 'home-head' },
    h('div', { class: 'hello' }, h('span', { class: 'buddy' }, '🐘'), h('div', null, h('div', { class: 'hi' }, `Hi ${kid()}!`), h('div', { class: 'sub' }, 'Appu is ready to play.'))),
    h('div', { class: 'head-right' },
      h('button', { class: 'pill', onclick: showStickers }, '⭐ ', h('b', null, S.stars), h('span', { class: 'pill-txt' }, ' Stickers')),
      h('button', { class: 'icon-btn', 'aria-label': 'Full screen', onclick: () => { const r = document.documentElement.requestFullscreen; if (r) document.documentElement.requestFullscreen().catch(() => {}); } }, '⛶'),
      h('button', { class: 'icon-btn', 'aria-label': 'Grown-ups corner', onclick: parentGate }, '⚙️')));
  if (!S.name && !S.askedName) askName();
  app.append(h('div', { class: 'home' }, head, trip, h('h2', { class: 'section-title' }, 'Play anything'), h('div', { class: 'tile-grid' }, tiles)));
}

// First launch on a device: a grown-up types the child's name. It is saved only in this browser's storage.
function askName() {
  const inp = h('input', { id: 'first-name', class: 'name-in', placeholder: "Child's first name", autocomplete: 'off', maxlength: '20' });
  const done = () => { S.name = inp.value.trim(); S.askedName = true; save(); overlay.hidden = true; overlay.replaceChildren(); showHome(); };
  const card = h('form', { class: 'modal-card gate', onsubmit: e => { e.preventDefault(); done(); } },
    h('div', { class: 'buddy-big' }, '🐘'), h('h2', null, 'Who is playing?'),
    h('p', { class: 'note' }, 'For grown-ups: type the child’s name so Appu can cheer them on. It is kept on this device only. You can change it later in the Grown-ups corner.'),
    inp,
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn ghost', onclick: () => { inp.value = ''; done(); } }, 'Skip'), h('button', { class: 'btn' }, 'Start')));
  overlay.replaceChildren(card); overlay.hidden = false;
}

function showStickers() {
  newScreen();
  const bar = frame({ title: 'My sticker book' });
  const n = stickerCount();
  const left = 5 - (S.stars % 5);
  bar.body.append(h('div', { class: 'picker' },
    h('p', { class: 'picker-note' }, n >= D.STICKERS.length ? 'You collected every sticker!' : `${left} more ⭐ for the next sticker.`),
    h('div', { class: 'sticker-grid' }, D.STICKERS.map((e, i) => h('div', { class: 'sticker' + (i < n ? '' : ' locked') }, i < n ? e : '?')))));
}

// ---------------- grown-ups corner ----------------
const PROGRESS_KINDS = [['sounds', 'First sounds'], ['last', 'Last sounds'], ['middle', 'Middle sounds'], ['rhyme', 'Rhymes'],
  ['odd', 'Odd one out'], ['count', 'Counting sounds'], ['hunt', 'Letter hunt'], ['case', 'Big & small'],
  ['readword', 'Reading words'], ['family', 'Word families'], ['words', 'Building words'], ['sight', 'Sight words'],
  ['reading', 'Sentences'], ['cloze', 'Missing word'], ['truth', 'True or silly'], ['listen-read', 'Listen & choose'], ['story', 'Stories'],
  ['numword', 'Number → word'], ['numread', 'Word → number'], ['numlisten', 'Hearing numbers'], ['numspell', 'Spelling numbers']];
function parentGate() {
  const x = 3 + rnd(7), y = 3 + rnd(7);
  const inp = h('input', { id: 'gate-answer', type: 'number', inputmode: 'numeric', 'aria-label': 'Answer' });
  const card = h('form', { class: 'modal-card gate', onsubmit: e => {
    e.preventDefault();
    if (Number(inp.value) === x * y) { overlay.hidden = true; overlay.replaceChildren(); showParent(); }
    else { shake(card); inp.value = ''; }
  } },
  h('h2', null, 'For grown-ups'), h('p', null, `What is ${x} × ${y}?`), inp,
  h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn ghost', onclick: () => { overlay.hidden = true; overlay.replaceChildren(); } }, 'Cancel'), h('button', { class: 'btn' }, 'Open')));
  overlay.replaceChildren(card); overlay.hidden = false; inp.focus();
}

function showParent() {
  newScreen();
  const bar = frame({ title: 'Grown-ups corner' });
  const sec = (title, ...kids) => h('section', { class: 'p-sec' }, h('h2', null, title), ...kids);
  const set = (k, v) => { S.settings[k] = v; save(); };

  const nameIn = h('input', { id: 'p-name', value: S.name, placeholder: "Child's first name", autocomplete: 'off', oninput: e => { S.name = e.target.value.trim(); save(); } });

  const voiceSel = h('select', { id: 'p-voice', onchange: e => set('voice', e.target.value) },
    h('option', { value: '' }, 'Automatic (Indian or British English)'),
    voices.map(v => h('option', { value: v.name, selected: v.name === S.settings.voice }, `${v.name} (${v.lang})`)));
  const rateIn = h('input', { id: 'p-rate', type: 'range', min: '0.6', max: '1.2', step: '0.05', value: S.settings.rate, oninput: e => set('rate', Number(e.target.value)) });

  const tolSeg = h('div', { class: 'seg' }, [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Strict']].map(([k, lbl]) =>
    h('button', { class: S.settings.tol === k ? 'on' : '', onclick: e => { set('tol', k); [...tolSeg.children].forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, lbl)));

  const soundChips = h('div', { class: 'chips' }, D.SOUND_KEYS.map(k => h('button', {
    class: 'chip read' + (S.settings.sounds.includes(k) ? ' on' : ''), onclick: e => {
      const cur = new Set(S.settings.sounds);
      if (cur.has(k)) { if (cur.size <= 3) { shake(e.currentTarget); return; } cur.delete(k); } else cur.add(k);
      set('sounds', D.SOUND_KEYS.filter(x => cur.has(x))); e.currentTarget.classList.toggle('on', cur.has(k));
    },
  }, k)));

  const wordChecks = h('div', { class: 'chips' }, [['cvc', '3-letter words'], ['digraph', 'sh ch th ck'], ['blend', 'Blends']].map(([k, lbl]) => h('button', {
    class: 'chip' + (S.settings.wordSets.includes(k) ? ' on' : ''), onclick: e => {
      const cur = new Set(S.settings.wordSets);
      if (cur.has(k)) { if (cur.size <= 1) { shake(e.currentTarget); return; } cur.delete(k); } else cur.add(k);
      set('wordSets', ['cvc', 'digraph', 'blend'].filter(x => cur.has(x))); e.currentTarget.classList.toggle('on', cur.has(k));
    },
  }, lbl)));

  const sightList = h('p', { class: 'read sight-list' });
  const showSight = () => { sightList.textContent = D.SIGHT.slice(0, S.settings.sightCount).join('  ·  '); };
  const sightIn = h('input', { id: 'p-sight', type: 'range', min: '6', max: String(D.SIGHT.length), step: '1', value: S.settings.sightCount, oninput: e => { set('sightCount', Number(e.target.value)); showSight(); } });
  showSight();

  // progress
  const letterChip = key => {
    const r = S.letters[key] || {}, n = r.stars || 0;
    return h('div', { class: 'prog-chip s' + n, title: r.tries ? `${r.tries} times, ${r.acc}% on the path` : 'Not tried yet' },
      h('span', { class: 'read' }, key), h('small', null, r.tries ? `${r.acc}%` : '–'));
  };
  const weak = (kind, label) => {
    const rows = Object.entries(S[kind] || {}).filter(([, r]) => r.n >= 2).map(([k, r]) => [k, r.r / r.n, r]).sort((p1, p2) => p1[1] - p2[1]).slice(0, 8);
    const g = S.games[kind];
    return h('div', { class: 'weak' }, h('b', null, label + ': '),
      g ? `${Math.round(100 * g.r / g.n)}% right first time (${g.n} questions). ` : 'not played yet. ',
      rows.length && rows[0][1] < 1 ? h('span', null, 'Needs practice: ', rows.filter(r => r[1] < 1).map(([k, , r]) => `${k} (${r.r}/${r.n})`).join(', ')) : null);
  };

  // paper worksheet
  const wsIn = h('input', { id: 'p-ws', value: 's a t i p n' });
  const wsCase = h('div', { class: 'seg' }, ['small', 'capital', 'both'].map((k, i) => h('button', { class: i === 0 ? 'on' : '', 'data-k': k, onclick: e => [...wsCase.children].forEach(b => b.classList.toggle('on', b === e.currentTarget)) }, k)));

  const resetBox = h('div', { class: 'row' });
  const showReset = () => resetBox.replaceChildren(h('button', { class: 'btn ghost danger', onclick: () => resetBox.replaceChildren(
    h('span', null, 'Delete all stars, stickers and progress?'),
    h('button', { class: 'btn danger', onclick: () => { const keep = S.settings, nm = S.name; S = defaults(); S.settings = keep; S.name = nm; save(); showParent(); } }, 'Yes, reset'),
    h('button', { class: 'btn ghost', onclick: showReset }, 'Keep')) }, 'Reset progress…'));
  showReset();

  const g = S.games;
  bar.body.append(h('div', { class: 'parent' },
    sec('Child', h('label', { for: 'p-name' }, 'Name Appu uses'), nameIn),
    sec('Progress',
      h('p', null, `${S.days.length} day${S.days.length === 1 ? '' : 's'} played · ${S.stars} stars · ${stickerCount()} stickers`),
      h('h3', null, 'Letters (stars = stages done, % = how much of the writing stayed on the path)'),
      h('div', { class: 'prog-row' }, D.JOLLY_ORDER.map(letterChip)),
      h('div', { class: 'prog-row' }, D.JOLLY_ORDER.map(c => letterChip(c.toUpperCase()))),
      h('h3', null, 'Games (only those played so far)'),
      PROGRESS_KINDS.filter(([k]) => g[k]).map(([k, label]) => weak(k, label)),
      Object.keys(g).length ? null : h('p', { class: 'note' }, 'No games played yet.'),
      h('h3', null, 'Number names written'),
      h('p', null, span(1, 100).filter(n => ((S.letters['num:' + n] || {}).stars || 0) >= 3).join(', ') || 'None yet.')),
    sec('Voice',
      h('label', { for: 'p-voice' }, 'Voice'), voiceSel,
      h('label', { for: 'p-rate' }, 'Speaking speed'), rateIn,
      h('button', { class: 'btn ghost', onclick: () => say(`Hello ${kid()}! Let's write the letter ess, as in sun.`) }, 'Test voice'),
      h('p', { class: 'note' }, 'Tip: voices come from the device. On Windows, add "English (India)" under Settings › Time & language › Speech for an Indian accent.')),
    sec('Tracing help',
      tolSeg,
      h('p', { class: 'note' }, 'Easy keeps a wide path and never takes progress away, which suits a child whose fine motor skills are still developing. Move to Medium once letters come out neat; Strict restarts a stroke when it leaves the path.')),
    sec('Sounds to practise', h('p', { class: 'note' }, 'Jolly Phonics order. Turn off sounds the class has not reached yet.'), soundChips),
    sec('Word lists', wordChecks),
    sec('Sight words', h('label', { for: 'p-sight' }, 'How many words from the list'), sightIn, sightList),
    sec('Paper practice',
      h('p', { class: 'note' }, 'Prints a worksheet with the same sky, grass and ground lines and stroke numbers as the app, for pencil practice at the table. Printing works when the app is opened from its file in a browser.'),
      h('label', { for: 'p-ws' }, 'Letters (separate with spaces)'), wsIn, wsCase,
      h('button', { class: 'btn', onclick: () => {
        const mode = wsCase.querySelector('.on').dataset.k;
        const base = wsIn.value.split(/[\s,]+/).map(x => x.trim()).filter(x => x.length === 1 && /[a-z]/i.test(x)).map(x => x.toLowerCase());
        const keys = base.flatMap(x => (mode === 'small' ? [x] : mode === 'capital' ? [x.toUpperCase()] : [x.toUpperCase(), x]));
        if (keys.length) printWorksheet(keys);
      } }, 'Print worksheet')),
    sec('Reset', resetBox)));
}

function printWorksheet(keys) {
  const sheet = document.getElementById('print-sheet');
  const rows = keys.map(key => {
    const { strokes, frameW: W } = D.compose([key]);
    const cells = 6;
    let g = '';
    [[20, 'ws-sky'], [50, 'ws-mid'], [80, 'ws-base'], [110, 'ws-ground']].forEach(([y, cl]) => { g += `<line x1="0" x2="${W * cells}" y1="${y}" y2="${y}" class="${cl}"/>`; });
    for (let i = 0; i < cells - 1; i++) {
      strokes.forEach(st => {
        const pts = st.pts.map(([x, y]) => [x + i * W, y]);
        if (st.dot) g += `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="2.6" class="${i ? 'ws-dotted-fill' : 'ws-solid-fill'}"/>`;
        else g += `<path d="M${pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L')}" class="${i ? 'ws-dotted' : 'ws-solid'}"/>`;
        if (i === 1 || i === 2) g += `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="4.4" class="ws-start"/><text x="${pts[0][0]}" y="${pts[0][1] + 2}" class="ws-num">${st.num}</text>`;
      });
    }
    return `<svg class="ws-row" viewBox="0 12 ${W * cells} 104" preserveAspectRatio="xMinYMid meet">${g}</svg>`;
  });
  sheet.innerHTML = `<h1>${S.name ? S.name.replace(/[<>&"]/g, '') + "'s" : 'My'} writing practice</h1><p>Start at the green dot. Trace the dotted letters, then write some on your own.</p>${rows.join('')}`;
  window.print();
}

// ---------------- boot ----------------
cssEmoji = cssVar('--emoji') || 'sans-serif';
cssDisplay = cssVar('--font-display') || 'sans-serif';
document.addEventListener('pointerdown', () => audio(), { once: true });
// Offline + "Install app" when served over http(s); file:// and the claude.ai preview simply skip it.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* not allowed in this frame */ }
}
showHome();
