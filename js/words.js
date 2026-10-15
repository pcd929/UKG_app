'use strict';
// Small words: reading, building and writing CVC / digraph / blend words. Classic scripts sharing one global scope; load order is set in index.html.
// ---------------- word lists ----------------
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const WORD_SETS = [['a', 'a words'], ['e', 'e words'], ['i', 'i words'], ['o', 'o words'], ['u', 'u words'], ['cvc', 'All 3-letter'], ['digraph', 'sh ch th ck'], ['blend', 'Blends']];
const ALL_WORDS = [...D.WORDS.cvc, ...D.WORDS.digraph, ...D.WORDS.blend];
function wordPool(set = S.settings.wordSet || 'cvc') {
  if (VOWELS.includes(set)) return D.WORDS.cvc.filter(it => it.g[1] === set);
  return D.WORDS[set] || D.WORDS.cvc;
}
// Real words one letter away (cat → hat, cot, can), so choosing the right one needs every letter read.
function lookalikeWords(it) {
  const near = ALL_WORDS.filter(x => x.w !== it.w && x.w.length === it.w.length && [...x.w].filter((c, i) => c !== it.w[i]).length === 1).map(x => x.w);
  const far = ALL_WORDS.filter(x => x.w !== it.w && x.w.length === it.w.length && x.w[0] === it.w[0]).map(x => x.w);
  return [...new Set([...shuffle(near), ...shuffle(far)])].slice(0, 2);
}

// ---------------- game: build words ----------------
async function gameWords({ count = 4, set, write = true, onFinish = showWordsMenu, onHome } = {}) {
  const id = newScreen();
  const bar = frame({ title: 'Build words', pips: count + (write ? 1 : 0), onHome });
  const pool = set ? wordPool(set) : S.settings.wordSets.flatMap(s => D.WORDS[s]);
  const list = pickN(pool, count);
  let first = 0;
  for (let i = 0; i < list.length; i++) {
    bar.setPip(i, 'now');
    const ok = await buildWord(bar, list[i]);
    if (!alive(id)) return;
    if (ok) first++;
    stat('words', list[i].w, ok); bar.setPip(i, 'done');
  }
  if (write) {
    bar.setPip(list.length, 'now');
    await writeWord(bar, id, list[list.length - 1]);
    if (!alive(id)) return;
    bar.setPip(list.length, 'done');
  }
  await celebrate({ title: 'Word builder!', stars: roundStars(first, list.length), text: `You built ${list.length} words, ${kid()}!` });
  if (alive(id)) onFinish();
}

function buildWord(bar, item) {
  return new Promise(resolve => {
    const extra = item.g.some(g => g.length > 1) ? ['sh', 'ch', 'th', 'ck'] : [];
    const pool = [...ALPHA, ...extra].filter(g => !item.g.includes(g) && g !== 'q' && g !== 'x');
    const tiles = shuffle([...item.g, ...pickN(pool, item.g.length > 3 ? 3 : 2)]);
    let next = 0, wrong = 0;
    const slots = item.g.map(() => h('span', { class: 'slot read' }));
    const prompt = () => say(`Can you make the word ${item.w}?`);
    bar.setRepeat(prompt);
    const btns = tiles.map(g => h('button', {
      class: 'tile-letter read', onclick: async e => {
        if (next >= item.g.length) return;
        const b = e.currentTarget;
        if (g === item.g[next]) {
          slots[next].textContent = g; slots[next].classList.add('filled'); b.classList.add('used'); b.disabled = true;
          sfx.pop(); next++;
          if (next === item.g.length) {
            for (const sl of slots) { sl.classList.add('glow'); await wait(260); }
            sfx.ding(); await say(`${item.w}! Well done.`); resolve(wrong === 0);
          }
        } else { wrong++; shake(b); sfx.boop(); say(item.w, 0.6); }
      },
    }, g));
    bar.body.replaceChildren(h('div', { class: 'qa' },
      h('button', { class: 'pic-card', onclick: () => say(item.w) }, h('span', { class: 'pic' }, item.e)),
      h('div', { class: 'slots' }, slots),
      h('div', { class: 'choices wrap' }, btns)));
    prompt();
  });
}

function writeWord(bar, id, item) {
  return new Promise(resolve => {
    const prompt = () => say(`Now write the word ${item.w}. Start at the green dot.`);
    bar.setRepeat(prompt);
    const wrap = h('div', { class: 'lesson' }, h('div', { class: 'lesson-info' },
      h('span', { class: 'ex-pic' }, item.e), h('span', { class: 'big-letter read' }, item.w), h('span', { class: 'stage-label' }, 'Write the word')));
    bar.body.replaceChildren(wrap);
    const panel = tracerPanel(wrap);
    panel.setStage('dots');
    panel.tracer.load({ ...D.compose(item.w.split('')), stage: 'dots' });
    panel.tracer.onDone = async () => { sparkle(wrap); await say(`You wrote ${item.w}!`); if (alive(id)) resolve(); };
    prompt();
  });
}

// ---------------- game: read & find (word → picture) ----------------
function gameReadFind(o = {}) {
  runQuiz({ title: 'Read & find', items: pickN(wordPool(o.set), o.count || 6), kind: 'readword', key: it => it.w, doneTitle: 'Super reading!', onFinish: showWordsMenu, ...o,
    q: (bar, it) => {
      const list = shuffle([it, ...pickN(ALL_WORDS.filter(x => x.e !== it.e && x.w !== it.w), 2)]);
      return ask(bar, {
        prompt: () => say('Read the word. Which picture is it?'),
        top: h('div', { class: 'word-big read' }, it.g.map(g => h('span', null, g))),
        options: list.map(x => ({ cls: 'pic-card small', label: picLabel(x.e), ok: x === it,
          right: () => say(`Yes! ${it.w}.`), wrong: () => say(`That is ${x.w}. Read each sound again.`) })),
      });
    } });
}

// ---------------- game: which word? (picture + sound → written word) ----------------
function gameWhichWord(o = {}) {
  runQuiz({ title: 'Which word?', items: pickN(wordPool(o.set), o.count || 6), kind: 'readword', key: it => it.w, doneTitle: 'Word detective!', onFinish: showWordsMenu, ...o,
    q: (bar, it) => ask(bar, {
      wide: true,
      prompt: () => say(`${it.w}. Which word says ${it.w}?`),
      top: picBtn(it),
      options: shuffle([it.w, ...lookalikeWords(it)]).map(wd => ({ cls: 'word-chip read big', label: wd, ok: wd === it.w,
        right: () => say(`Yes! ${it.w}.`), wrong: () => say(`That says ${wd}.`) })),
    }) });
}

// ---------------- game: word families (change the first letter) ----------------
function gameFamilies(o = {}) {
  let pool = wordPool(o.set).filter(it => FAMILIES[rimeOf(it)]);
  if (!pool.length) pool = D.WORDS.cvc;
  runQuiz({ title: 'Word families', items: pickN(pool, o.count || 6), kind: 'family', key: it => rimeOf(it), doneTitle: 'Family fun!', onFinish: showWordsMenu, ...o,
    q: (bar, it) => {
      const r = rimeOf(it), on = it.g[0];
      const kin = FAMILIES[r].map(x => x.g[0]).filter(x => x !== on); // other real onsets of the family make tempting choices
      const others = pickN([...new Set([...kin, ...pickN('bcdfghjlmnprstvw'.split(''), 4)])].filter(x => x !== on), 2);
      const slot = h('span', { class: 'slot read' });
      return ask(bar, {
        prompt: () => say(`Make the word ${it.w}. Which letter goes first?`),
        top: h('div', { class: 'qa-top' }, picBtn(it), h('div', { class: 'slots' }, slot, [...r].map(c => h('span', { class: 'slot read filled fam' }, c)))),
        options: shuffle([on, ...others]).map(k => ({ label: k, ok: k === on,
          right: async () => { slot.textContent = on; slot.classList.add('filled', 'glow'); await say(`${it.w}! ${spell(on)}, ${r}, ${it.w}.`); },
          wrong: () => say(`That makes ${k}${r}. We want ${it.w}.`) })),
      });
    } });
}

// ---------------- menu ----------------
const WORD_ACTS = [
  { icon: '🔎', name: 'Read & find', sub: 'read cat → 🐱', play: gameReadFind },
  { icon: '🧐', name: 'Which word?', sub: 'cat · cot · cut', play: gameWhichWord },
  { icon: '🏠', name: 'Word families', sub: '_at: cat hat bat', play: gameFamilies },
  { icon: '🧩', name: 'Build it', sub: 'spell with letters', play: o => gameWords({ count: 4, write: false, set: S.settings.wordSet, onFinish: showWordsMenu, ...o }) },
  { icon: '✏️', name: 'Write it', sub: 'trace, then write alone', play: o => writeWordsLesson(pickN(wordPool(o.set), 2), { title: 'Write words', onFinish: showWordsMenu, ...o }) },
];

function showWordsMenu() {
  const cur = S.settings.wordSet || 'cvc';
  const seg = h('div', { class: 'seg' }, WORD_SETS.map(([k, label]) => h('button', {
    class: (k === cur ? 'on' : '') + (k.length === 1 ? ' read' : ''), onclick: () => { S.settings.wordSet = k; save(); showWordsMenu(); },
  }, label)));
  const sample = pickN(wordPool(cur), 6).map(it => it.w).join(' · ');
  activityMenu({ title: 'Small words', note: `Read and write short words. Now practising: ${sample}`, top: seg,
    acts: WORD_ACTS.map(a => ({ ...a, run: () => a.play({ set: cur }) })) });
}
