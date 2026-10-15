'use strict';
// Number words: reading, hearing and writing the spellings of 1–100. Classic scripts sharing one global scope; load order is set in index.html.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const numWord = n => (n === 100 ? 'one hundred' : n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));

const NUM_RANGES = [['1-10', '1 – 10'], ['11-20', '11 – 20'], ['tens', '10, 20 … 100'], ['21-50', '21 – 50'], ['51-100', '51 – 100'], ['all', '1 – 100']];
const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
function numRange(r = S.settings.numRange || '1-10') {
  return ({ '1-10': span(1, 10), '11-20': span(11, 20), tens: span(1, 10).map(x => x * 10), '21-50': span(21, 50), '51-100': span(51, 100), all: span(1, 100) })[r] || span(1, 10);
}
// Numbers easy to mix up with n: next door, ten away, digits swapped, and the teen / -ty pairs (13 and 30).
function numNeighbours(n) {
  const c = [n + 1, n - 1, n + 10, n - 10];
  if (n >= 10 && n < 100) c.push(Number(String(n).split('').reverse().join('')));
  if (n >= 13 && n <= 19) c.push((n - 10) * 10);
  if (n % 10 === 0 && n >= 30 && n <= 90) c.push(n / 10 + 10);
  return [...new Set(c)].filter(x => x >= 1 && x <= 100 && x !== n);
}
const numOptions = (n, k) => [...shuffle(numNeighbours(n)), ...shuffle(span(1, 100))].filter((x, i, a) => x !== n && a.indexOf(x) === i).slice(0, k);

const COUNTERS = ['🍎', '⭐', '🐟', '🎈', '🚗', '🌸'];
function numCard(n) {
  return h('button', { class: 'num-card', onclick: () => say(String(n)) }, h('span', { class: 'num-big' }, String(n)),
    n <= 20 ? h('div', { class: 'counters' }, Array.from({ length: n }, () => h('span', null, COUNTERS[n % COUNTERS.length]))) : null);
}

// ---------------- write number names ----------------
function numberLesson(n, { onFinish, onHome } = {}) {
  const word = numWord(n);
  const parts = word.includes('-') ? [word.split('-')[0], '-' + word.split('-')[1]] : word.split(' '); // long names are traced in two parts
  const info = [h('span', { class: 'num-big inline' }, String(n)), h('button', { class: 'ex read', onclick: () => say(word) }, '🔊 ', word)];
  const steps = [];
  ['dots', 'free'].forEach(stage => parts.forEach((p, i) => steps.push({
    shape: D.compose(p.split('')), stage, info, label: `${stage === 'dots' ? 'Trace' : 'Write'}: ${p}`,
    demo: stage === 'dots' && i === 0,
    intro: i ? null : stage === 'dots' ? () => say(`${n}. ${word}. Let's write ${word}.`) : () => say(`Now write ${word} by yourself.`),
  })));
  traceLesson({ title: `Write ${n}`, steps, recordKey: 'num:' + n, doneTitle: `You wrote ${word}!`, onFinish: onFinish || showNumberGrid, onHome });
}

function showNumberGrid() {
  newScreen();
  const bar = frame({ title: 'Write number names' });
  bar.body.append(h('div', { class: 'picker' }, rangeSeg(showNumberGrid),
    h('div', { class: 'num-grid' }, numRange().map(n => {
      const st = (S.letters['num:' + n] || {}).stars || 0;
      return h('button', { class: 'letter-tile num-tile' + (st >= 3 ? ' done' : ''), onclick: () => numberLesson(n) },
        h('span', { class: 'num-big tile' }, String(n)), h('small', { class: 'read word' }, numWord(n)), h('small', null, starsText(st)));
    }))));
}
const nextNumberToWrite = () => numRange().find(n => ((S.letters['num:' + n] || {}).stars || 0) < 3) || pick(numRange());

// ---------------- quizzes ----------------
function gameNumToWord(o = {}) {
  runQuiz({ title: 'Number → word', items: pickN(numRange(), o.count || 5), kind: 'numword', doneTitle: 'Number reader!', onFinish: showNumbersMenu, ...o,
    q: (bar, n) => ask(bar, {
      wide: true, prompt: () => say('Read the words. Which word is this number?'), top: numCard(n),
      options: shuffle([n, ...numOptions(n, 2)]).map(x => ({ cls: 'word-chip read big', label: numWord(x), ok: x === n,
        right: () => say(`Yes! ${n}, ${numWord(n)}.`), wrong: () => say(`That says ${numWord(x)}. That is ${x}.`) })),
    }) });
}

function gameWordToNum(o = {}) {
  runQuiz({ title: 'Word → number', items: pickN(numRange(), o.count || 5), kind: 'numread', doneTitle: 'Number reader!', onFinish: showNumbersMenu, ...o,
    q: (bar, n) => ask(bar, {
      prompt: () => say('Read the word. Which number is it?'), top: h('div', { class: 'word-big read' }, numWord(n)),
      options: shuffle([n, ...numOptions(n, 2)]).map(x => ({ cls: 'tile-letter num', label: String(x), ok: x === n,
        right: () => say(`Yes! ${numWord(n)} is ${n}.`), wrong: () => say(`That is ${x}.`) })),
    }) });
}

function gameNumListen(o = {}) {
  runQuiz({ title: 'Listen & find', items: pickN(numRange(), o.count || 5), kind: 'numlisten', doneTitle: 'Super ears!', onFinish: showNumbersMenu, ...o,
    q: (bar, n) => ask(bar, {
      prompt: () => say(`Find ${n}.`), top: h('div', { class: 'big-q' }, '👂 Which number do you hear?'),
      options: shuffle([n, ...numOptions(n, 3)]).map(x => ({ cls: 'tile-letter num', label: String(x), ok: x === n,
        right: () => say(`Yes! ${n}.`), wrong: () => say(`That is ${x}. Listen: ${n}.`) })),
    }) });
}

function gameNumSpell(o = {}) {
  runQuiz({ title: 'Spell the number', items: pickN(numRange(), o.count || 4), kind: 'numspell', doneTitle: 'Super speller!', onFinish: showNumbersMenu, ...o, q: spellNumber });
}

// Short names are spelt letter by letter; two-part names (forty-seven) from word tiles.
function spellNumber(bar, n) {
  return new Promise(resolve => {
    const word = numWord(n), compound = /[- ]/.test(word);
    const parts = compound ? word.split(/[- ]/) : word.split('');
    const tiles = compound
      ? shuffle([...parts, pick(TENS.slice(2).filter(t => t !== parts[0])), pick(ONES.slice(1, 10).filter(t => t !== parts[1]))])
      : shuffle([...parts, ...pickN(ALPHA.filter(c => !parts.includes(c)), 2)]);
    let next = 0, wrong = 0;
    const slots = parts.map(() => h('span', { class: 'slot read ' + (compound ? 'word' : 'sm') }));
    const row = compound ? [slots[0], h('span', { class: 'joiner read' }, word.includes('-') ? '-' : ''), slots[1]] : slots;
    const prompt = () => say(`${n}. Spell ${word}.`);
    bar.setRepeat(prompt);
    const btns = tiles.map(t => h('button', {
      class: compound ? 'word-chip read big' : 'tile-letter read sm', onclick: async e => {
        if (next >= parts.length) return;
        const b = e.currentTarget;
        if (t === parts[next]) {
          slots[next].textContent = t; slots[next].classList.add('filled'); b.classList.add('used'); b.disabled = true;
          sfx.pop(); next++;
          if (next === parts.length) { for (const sl of slots) { sl.classList.add('glow'); await wait(180); } sfx.ding(); await say(`${word}! Well done.`); resolve(wrong === 0); }
        } else { wrong++; shake(b); sfx.boop(); say(word, 0.6); }
      },
    }, t));
    bar.body.replaceChildren(h('div', { class: 'qa' }, numCard(n), h('div', { class: 'slots' }, row), h('div', { class: 'choices wrap' }, btns)));
    prompt();
  });
}

// ---------------- menu ----------------
function rangeSeg(redraw) {
  const cur = S.settings.numRange || '1-10';
  return h('div', { class: 'seg' }, NUM_RANGES.map(([k, label]) => h('button', {
    class: k === cur ? 'on' : '', onclick: () => { S.settings.numRange = k; save(); redraw(); } }, label)));
}

const NUM_ACTS = [
  { icon: '✏️', name: 'Write number names', sub: 'trace, then write', play: () => showNumberGrid() },
  { icon: '🔢', name: 'Number → word', sub: '7 → seven', play: gameNumToWord },
  { icon: '🔤', name: 'Word → number', sub: 'seven → 7', play: gameWordToNum },
  { icon: '👂', name: 'Listen & find', sub: 'hear it, tap it', play: gameNumListen },
  { icon: '🧩', name: 'Spell the number', sub: 's e v e n', play: gameNumSpell },
];

function showNumbersMenu() {
  activityMenu({ title: 'Number words', note: 'Read, hear and write the names of numbers. Pick which numbers to practise.', top: rangeSeg(showNumbersMenu),
    acts: NUM_ACTS.map(a => ({ ...a, run: () => a.play({}) })) });
}
