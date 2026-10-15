'use strict';
// Listen & sounds: phonemic-awareness and letter-sound games. Classic scripts sharing one global scope; load order is set in index.html.
// ---------------- game: first sounds ----------------
const confusable = (x, y) => x === y || x[0] === y[0] || (['c', 'k', 'q'].includes(x[0]) && ['c', 'k', 'q'].includes(y[0]));

async function gameSounds({ count = 6, onFinish = showHome, onHome } = {}) {
  const id = newScreen();
  const bar = frame({ title: 'First sounds', pips: count, onHome });
  const pool = S.settings.sounds.filter(k => D.SOUND_WORDS[k]);
  let first = 0, prev = null;
  for (let q = 0; q < count; q++) {
    bar.setPip(q, 'now');
    let t = pick(pool); if (t === prev && pool.length > 1) t = pick(pool.filter(x => x !== prev)); prev = t;
    const others = pool.filter(k => !confusable(k, t));
    const ok = await (Math.random() < 0.55 || others.length < 2 ? soundPicToLetter : soundLetterToPic)(bar, t, others);
    if (!alive(id)) return;
    if (ok) first++;
    stat('sounds', t, ok); bar.setPip(q, ok ? 'done' : 'done soft');
    await wait(250);
  }
  await celebrate({ title: 'Super listening!', stars: roundStars(first, count), text: `Great listening, ${kid()}!` });
  if (alive(id)) onFinish();
}

function soundPicToLetter(bar, t, others) {
  return new Promise(resolve => {
    const [word, pic] = pick(D.SOUND_WORDS[t]);
    const opts = shuffle([t, ...pickN(others.length >= 2 ? others : D.SOUND_KEYS.filter(k => !confusable(k, t)), 2)]);
    let wrong = 0, solved = false;
    const prompt = () => say(`${word}. Which letter does ${word} start with?`);
    bar.setRepeat(prompt);
    const label = h('span', { class: 'pic-word read', hidden: true }, word);
    const picEl = h('button', { class: 'pic-card', onclick: () => say(word) }, h('span', { class: 'pic' }, pic), label);
    const tiles = opts.map(k => h('button', {
      class: 'tile-letter read', onclick: async e => {
        if (solved) return;
        if (k === t) {
          solved = true; e.currentTarget.classList.add('right'); sfx.pop(); label.hidden = false;
          await say(`Yes! ${word} starts with ${spell(t)}.`); resolve(wrong === 0);
        } else { wrong++; shake(e.currentTarget); sfx.boop(); say(`That is ${spell(k)}. Listen: ${word}.`); }
      },
    }, k));
    bar.body.replaceChildren(h('div', { class: 'qa' }, picEl, h('div', { class: 'choices' }, tiles)));
    prompt();
  });
}

function soundLetterToPic(bar, t, others) {
  return new Promise(resolve => {
    const items = shuffle([[t, pick(D.SOUND_WORDS[t])], ...pickN(others, 2).map(k => [k, pick(D.SOUND_WORDS[k])])]);
    let wrong = 0, solved = false, token = 0;
    const cards = items.map(([k, [word, pic]]) => h('button', {
      class: 'pic-card small', onclick: async e => {
        if (solved) return;
        token++;
        if (k === t) {
          solved = true; e.currentTarget.classList.add('right'); sfx.pop();
          await say(`Yes! ${word} starts with ${spell(t)}.`); resolve(wrong === 0);
        } else { wrong++; shake(e.currentTarget); sfx.boop(); say(`That is ${word}. ${word} starts with ${spell(k)}.`); }
      },
    }, h('span', { class: 'pic' }, pic)));
    const prompt = async () => {
      const my = ++token;
      await say(`Which picture starts with ${spell(t)}?`);
      for (let i = 0; i < items.length; i++) {
        if (my !== token || solved) break;
        cards[i].classList.add('speaking'); await say(items[i][1][0]); cards[i].classList.remove('speaking');
      }
    };
    bar.setRepeat(prompt);
    bar.body.replaceChildren(h('div', { class: 'qa' }, h('div', { class: 'big-letter read target' }, t), h('div', { class: 'choices' }, cards)));
    prompt();
  });
}

// ---------------- more listening games ----------------
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const picBtn = (it, rate = 1) => h('button', { class: 'pic-card', onclick: () => say(it.w, rate) }, picLabel(it.e));

function gameLastSound(o = {}) {
  const pool = [...D.WORDS.cvc, ...D.WORDS.digraph];
  const finals = [...new Set(pool.map(it => it.g[it.g.length - 1]))];
  runQuiz({ title: 'Last sounds', items: pickN(pool, o.count || 6), kind: 'last', key: it => it.g[it.g.length - 1], doneTitle: 'Great listening!', onFinish: showListenMenu, ...o,
    q: (bar, it) => {
      const t = it.g[it.g.length - 1];
      return ask(bar, {
        prompt: () => say(`${it.w}. Which letter does ${it.w} end with?`), top: picBtn(it),
        options: shuffle([t, ...pickN(finals.filter(f => f[0] !== t[0]), 2)]).map(g => ({
          label: g, ok: g === t, right: () => say(`Yes! ${it.w} ends with ${spell(g)}.`), wrong: () => say(`Listen to the end: ${it.w}.`) })),
      });
    } });
}

function gameMiddleSound(o = {}) {
  runQuiz({ title: 'Middle sounds', items: pickN(D.WORDS.cvc, o.count || 6), kind: 'middle', key: it => it.g[1], doneTitle: 'Super ears!', onFinish: showListenMenu, ...o,
    q: (bar, it) => {
      const slots = it.g.map((g, i) => h('span', { class: 'slot read' + (i === 1 ? '' : ' filled') }, i === 1 ? '' : g));
      return ask(bar, {
        prompt: () => say(`${it.w}. What sound is in the middle of ${it.w}?`),
        top: h('div', { class: 'qa-top' }, picBtn(it, 0.6), h('div', { class: 'slots' }, slots)),
        options: VOWELS.map(v => ({ label: v, ok: v === it.g[1],
          right: async () => { slots[1].textContent = v; slots[1].classList.add('filled', 'glow'); await say(`Yes! ${it.w}.`); },
          wrong: () => say(`Listen to the middle: ${it.w}.`, 0.7) })),
      });
    } });
}

const rimeOf = it => it.w.slice(1);
const FAMILIES = D.WORDS.cvc.reduce((m, it) => { (m[rimeOf(it)] = m[rimeOf(it)] || []).push(it); return m; }, {});

function gameRhyme(o = {}) {
  const targets = D.WORDS.cvc.filter(it => FAMILIES[rimeOf(it)].length > 1);
  runQuiz({ title: 'Rhyme time', items: pickN(targets, o.count || 5), kind: 'rhyme', key: it => rimeOf(it), doneTitle: 'Rhyme star!', onFinish: showListenMenu, ...o,
    q: (bar, it) => {
      const match = pick(FAMILIES[rimeOf(it)].filter(x => x.w !== it.w));
      const list = shuffle([match, ...pickN(D.WORDS.cvc.filter(x => x.w.slice(-1) !== it.w.slice(-1) && x.e !== match.e), 2)]);
      return ask(bar, {
        prompt: () => sayChoices(`Which one rhymes with ${it.w}?`, bar.choices, list.map(x => x.w)),
        top: h('button', { class: 'pic-card', onclick: () => say(it.w) }, picLabel(it.e), h('span', { class: 'pic-word read' }, it.w)),
        options: list.map(x => ({ cls: 'pic-card small', label: picLabel(x.e), ok: x === match,
          right: () => say(`Yes! ${it.w}, ${x.w}. They rhyme!`), wrong: () => say(`${x.w}. ${x.w} does not rhyme with ${it.w}.`) })),
      });
    } });
}

function gameOddOne(o = {}) {
  const pool = S.settings.sounds.filter(k => (D.SOUND_WORDS[k] || []).length >= 2);
  runQuiz({ title: 'Odd one out', items: Array.from({ length: o.count || 5 }, () => pick(pool)), kind: 'odd', doneTitle: 'Sharp ears!', onFinish: showListenMenu, ...o,
    q: (bar, t) => {
      const same = pickN(D.SOUND_WORDS[t], 2);
      const k = pick(D.SOUND_KEYS.filter(x => !confusable(x, t)));
      const odd = pick(D.SOUND_WORDS[k]);
      const list = shuffle([...same, odd]);
      return ask(bar, {
        prompt: () => sayChoices('Which one starts with a different sound?', bar.choices, list.map(x => x[0])),
        top: h('div', { class: 'big-q' }, 'Which one is different?'),
        options: list.map(x => ({ cls: 'pic-card small', label: picLabel(x[1]), ok: x === odd,
          right: () => say(`Yes! ${same[0][0]} and ${same[1][0]} start with ${spell(t)}. ${odd[0]} starts with ${spell(k)}.`),
          wrong: () => say(`${x[0]} starts with ${spell(t)}.`) })),
      });
    } });
}

function gameCountSounds(o = {}) {
  const pool = [...D.WORDS.cvc, ...D.WORDS.digraph, ...D.WORDS.blend, ...D.SOUND_COUNT_EXTRA];
  runQuiz({ title: 'Count the sounds', items: pickN(pool, o.count || 5), kind: 'count', key: it => it.w, doneTitle: 'Great counting!', onFinish: showListenMenu, ...o,
    q: (bar, it) => {
      const n = it.g.length;
      const boxes = h('div', { class: 'boxes', hidden: true }, it.g.map(g => h('span', { class: 'read' }, g)));
      return ask(bar, {
        prompt: () => say(`${it.w}. How many sounds can you hear in ${it.w}? Clap them!`),
        top: h('div', { class: 'qa-top' }, picBtn(it, 0.5), boxes),
        options: [2, 3, 4].map(c => ({ cls: 'tile-letter count', label: [h('b', null, String(c)), h('small', null, '●'.repeat(c))], ok: c === n,
          right: async () => { boxes.hidden = false; await say(`Yes! ${it.w} has ${n} sounds.`); await wait(700); },
          wrong: () => say(`Listen again. ${it.w}.`, 0.5) })),
      });
    } });
}

function gameLetterHunt(o = {}) {
  const keys = D.JOLLY_ORDER.filter(k => D.LOOKALIKE[k]);
  runQuiz({ title: 'Letter hunt', items: pickN(keys, o.count || 4), kind: 'hunt', doneTitle: 'Letter detective!', onFinish: showListenMenu, ...o, q: huntRound });
}

function huntRound(bar, t) {
  return new Promise(resolve => {
    const nT = 3 + rnd(2), look = D.LOOKALIKE[t].split('');
    const fillers = Array.from({ length: 12 - nT }, (_, i) => (i < 5 ? pick(look) : pick(D.JOLLY_ORDER.filter(k => k !== t))));
    const cells = shuffle([...Array(nT).fill(t), ...fillers]);
    let found = 0, wrong = 0;
    const prompt = () => say(`Find all the letters ${spell(t)}. There are ${nT}!`);
    bar.setRepeat(prompt);
    const counter = h('span', { class: 'hunt-count' }, `0 of ${nT}`);
    const btns = cells.map(k => h('button', {
      class: 'hunt-cell read', onclick: async e => {
        const b = e.currentTarget;
        if (b.classList.contains('right') || found === nT) return;
        if (k === t) {
          b.classList.add('right'); sfx.pop(); found++; counter.textContent = `${found} of ${nT}`;
          if (found === nT) { sfx.ding(); await say('You found them all!'); resolve(wrong === 0); }
        } else { wrong++; shake(b); sfx.boop(); say(`That is ${spell(k)}.`); }
      },
    }, k));
    bar.body.replaceChildren(h('div', { class: 'qa' }, h('div', { class: 'hunt-head' }, h('span', { class: 'big-letter read target' }, t), counter), h('div', { class: 'hunt' }, btns)));
    prompt();
  });
}

function gameBigSmall(o = {}) {
  runQuiz({ title: 'Big & small', items: pickN(D.JOLLY_ORDER, o.count || 6), kind: 'case', doneTitle: 'Letter match!', onFinish: showListenMenu, ...o,
    q: (bar, t, i) => {
      const up = i % 2 === 0; // alternate: capital → small, small → capital
      const others = pickN([...new Set([...(D.LOOKALIKE[t] || ''), ...pickN(D.JOLLY_ORDER, 4)])].filter(k => k !== t), 2);
      return ask(bar, {
        prompt: () => say(up ? `This is capital ${spell(t)}. Find small ${spell(t)}.` : `This is small ${spell(t)}. Find capital ${spell(t)}.`),
        top: h('div', { class: 'big-letter read target' }, up ? t.toUpperCase() : t),
        options: shuffle([t, ...others]).map(k => ({ label: up ? k : k.toUpperCase(), ok: k === t,
          right: () => say(`Yes! Capital ${spell(t)} and small ${spell(t)}.`), wrong: () => say(`That is ${up ? 'small' : 'capital'} ${spell(k)}.`) })),
      });
    } });
}

const LISTEN_ACTS = [
  { icon: '👂', name: 'First sounds', sub: 'sun starts with s', play: o => gameSounds({ count: 6, onFinish: showListenMenu, ...o }) },
  { icon: '🔚', name: 'Last sounds', sub: 'cat ends with t', play: gameLastSound },
  { icon: '🎯', name: 'Middle sounds', sub: 'c _ t', play: gameMiddleSound },
  { icon: '🎵', name: 'Rhyme time', sub: 'cat · hat', play: gameRhyme },
  { icon: '🤔', name: 'Odd one out', sub: 'which is different?', play: gameOddOne },
  { icon: '👏', name: 'Count the sounds', sub: 'f · i · sh = 3', play: gameCountSounds },
  { icon: '🔍', name: 'Letter hunt', sub: 'b d p q', play: gameLetterHunt },
  { icon: '🔠', name: 'Big & small', sub: 'A a  B b', play: gameBigSmall },
];

function showListenMenu() {
  activityMenu({ title: 'Listen & sounds', note: 'Hear the sounds at the start, middle and end of words, find rhymes, and spot letters that look alike.',
    acts: LISTEN_ACTS.map(a => ({ ...a, run: () => a.play({}) })) });
}
