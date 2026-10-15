'use strict';
// Sight words and sentence reading. Classic scripts sharing one global scope; load order is set in index.html.
// ---------------- game: sight-word bubbles ----------------
async function gameSight({ count = 6, onFinish = showHome, onHome } = {}) {
  const id = newScreen();
  const bar = frame({ title: 'Pop the word', pips: count, onHome });
  const words = D.SIGHT.slice(0, Math.max(6, S.settings.sightCount));
  const targets = pickN(words, count);
  let first = 0;
  for (let i = 0; i < targets.length; i++) {
    bar.setPip(i, 'now');
    const ok = await popRound(bar, targets[i], words);
    if (!alive(id)) return;
    if (ok) first++;
    stat('sight', targets[i], ok); bar.setPip(i, ok ? 'done' : 'done soft');
  }
  await celebrate({ title: 'Pop star!', stars: roundStars(first, targets.length), text: `You read so many words, ${kid()}!` });
  if (alive(id)) onFinish();
}

function popRound(bar, target, words) {
  return new Promise(resolve => {
    const opts = shuffle([target, ...pickN(words.filter(x => x.toLowerCase() !== target.toLowerCase()), 3)]);
    let wrong = 0, solved = false;
    const prompt = () => say(`Find the word… ${target}.`);
    bar.setRepeat(prompt);
    const hues = ['--sky', '--grass', '--sun-soft', '--berry-soft'];
    const bubbles = opts.map((wd, i) => h('button', {
      class: 'bubble read', style: `--bg:var(${hues[i]});animation-delay:${-i * 0.7}s`, onclick: async e => {
        if (solved) return;
        const b = e.currentTarget;
        if (wd === target) {
          solved = true; b.classList.add('popped'); sfx.pop();
          await say(`${target}! Well done.`); resolve(wrong === 0);
        } else { wrong++; shake(b); sfx.boop(); say(`That says ${wd}.`); }
      },
    }, wd));
    bar.body.replaceChildren(h('div', { class: 'qa' }, h('div', { class: 'bubbles' }, bubbles)));
    prompt();
  });
}

// ---------------- game: read sentences ----------------
async function gameRead({ count = 4, mode = 'mix', onFinish = showReadMenu, onHome } = {}) {
  const id = newScreen();
  const bar = frame({ title: mode === 'build' ? 'Build the sentence' : mode === 'match' ? 'Read & match' : 'Read with Appu', pips: count, onHome });
  const items = pickN(D.SENTENCES, count);
  let first = 0;
  for (let i = 0; i < items.length; i++) {
    bar.setPip(i, 'now');
    const build = mode === 'build' || (mode === 'mix' && i % 2 === 1);
    const ok = await (build ? readBuild : readMatch)(bar, items[i]);
    if (!alive(id)) return;
    if (ok) first++;
    stat('reading', items[i].text, ok); bar.setPip(i, ok ? 'done' : 'done soft');
  }
  await celebrate({ title: 'Super reader!', stars: roundStars(first, items.length), text: `What a good reader you are, ${kid()}!` });
  if (alive(id)) onFinish();
}
const bare = wd => wd.replace(/[.,!?]/g, '');

function readMatch(bar, item) {
  return new Promise(resolve => {
    const pics = shuffle([item.e, ...pickN(D.SENTENCES.filter(s => s.e !== item.e).map(s => s.e), 2)]);
    let wrong = 0, solved = false;
    const prompt = () => say('Read the sentence. Tap a word to hear it. Then tap the picture.');
    bar.setRepeat(() => say(item.text, 0.85));
    const words = item.text.split(' ').map(wd => h('button', { class: 'word-chip read', onclick: () => say(bare(wd)) }, wd));
    const cards = pics.map(e => h('button', {
      class: 'pic-card small', onclick: async ev => {
        if (solved) return;
        if (e === item.e) { solved = true; ev.currentTarget.classList.add('right'); sfx.pop(); await say(`Yes! ${item.text}`); resolve(wrong === 0); }
        else { wrong++; shake(ev.currentTarget); sfx.boop(); say('Not this one. Tap the words to hear them.'); }
      },
    }, h('span', { class: 'pic' }, e)));
    bar.body.replaceChildren(h('div', { class: 'qa' }, h('div', { class: 'sentence' }, words), h('div', { class: 'choices' }, cards)));
    prompt();
  });
}

function readBuild(bar, item) {
  return new Promise(resolve => {
    const parts = item.text.split(' ');
    let next = 0, wrong = 0;
    const prompt = () => say(`Listen. ${item.text} Now make the sentence.`, 0.9);
    bar.setRepeat(prompt);
    const slots = parts.map(() => h('span', { class: 'slot word read' }));
    const btns = shuffle(parts).map(wd => h('button', {
      class: 'word-chip read', onclick: async e => {
        if (next >= parts.length) return;
        const b = e.currentTarget;
        if (wd === parts[next]) {
          slots[next].textContent = wd; slots[next].classList.add('filled'); b.classList.add('used'); b.disabled = true;
          sfx.pop(); say(bare(wd)); next++;
          if (next === parts.length) { await wait(500); sfx.ding(); await say(item.text); resolve(wrong === 0); }
        } else { wrong++; shake(b); sfx.boop(); say(bare(wd)); }
      },
    }, wd));
    bar.body.replaceChildren(h('div', { class: 'qa' },
      h('button', { class: 'pic-card', onclick: () => say(item.text, 0.85) }, h('span', { class: 'pic' }, item.e)),
      h('div', { class: 'slots sentence' }, slots),
      h('div', { class: 'choices wrap' }, btns)));
    prompt();
  });
}

// ---------------- more sentence games ----------------
const tapWords = text => h('div', { class: 'sentence' }, text.split(' ').map(wd => h('button', { class: 'word-chip read', onclick: () => say(bare(wd)) }, wd)));
const wordsOf = text => text.toLowerCase().split(' ').map(bare);

function gameCloze(o = {}) {
  runQuiz({ title: 'Missing word', items: pickN(D.CLOZE, o.count || 5), kind: 'cloze', key: it => it.text, doneTitle: 'Super reading!', onFinish: showReadMenu, ...o,
    q: (bar, it) => {
      const gap = h('span', { class: 'gap' }, '?');
      const [before, after] = it.text.split('___');
      return ask(bar, {
        prompt: () => say('Read the sentence. Which word goes in the gap?'),
        top: h('div', { class: 'qa-top' }, h('span', { class: 'pic multi' }, it.e), h('div', { class: 'sentence-line read' }, before, gap, after)),
        options: shuffle(it.options).map(wd => ({ cls: 'word-chip read big', label: wd, ok: wd === it.answer,
          right: async () => { gap.textContent = wd; gap.classList.add('filled'); await say(it.text.replace('___', wd)); },
          wrong: () => say(`${it.text.replace('___', wd)} Hmm. Does that sound right?`) })),
      });
    } });
}

function gameTruth(o = {}) {
  const n = o.count || 6;
  const items = shuffle([...pickN(D.TRUTH.filter(t => t.ok), Math.ceil(n / 2)), ...pickN(D.TRUTH.filter(t => !t.ok), Math.floor(n / 2))]);
  runQuiz({ title: 'True or silly?', items, kind: 'truth', key: it => it.text, doneTitle: 'Clever thinking!', onFinish: showReadMenu, ...o,
    q: (bar, it) => ask(bar, {
      prompt: () => say('Read the sentence. Is it true, or is it silly?'),
      top: h('div', { class: 'qa-top' }, picLabel(it.e), tapWords(it.text)),
      options: [[true, '👍', 'True'], [false, '🤪', 'Silly']].map(([v, e, label]) => ({
        cls: 'yn-btn', label: [h('span', { class: 'yn-e' }, e), h('span', null, label)], ok: v === it.ok,
        right: () => say(it.ok ? `Yes, that is true! ${it.text}` : `Yes, that is silly! ${it.text.replace(/\.$/, '')}? No way!`),
        wrong: () => say('Read it again. Tap the words to hear them.') })),
    }) });
}

function gameWhichSentence(o = {}) {
  runQuiz({ title: 'Which sentence?', items: pickN(D.SENTENCES, o.count || 4), kind: 'reading', key: it => it.text, doneTitle: 'Super reader!', onFinish: showReadMenu, ...o,
    q: (bar, it) => ask(bar, {
      wide: true,
      prompt: () => say('Look at the picture. Read the sentences. Which one matches?'),
      top: picLabel(it.e),
      options: shuffle([it, ...pickN(D.SENTENCES.filter(s => s !== it), 2)]).map(s => ({ cls: 'word-chip read sent-opt', label: s.text, ok: s === it,
        right: () => say(`Yes! ${it.text}`), wrong: () => say(`That one says: ${s.text}`) })),
    }) });
}

// Hear a sentence, find it written down; distractors share the most words with it.
function gameListenChoose(o = {}) {
  const similar = it => {
    const ws = new Set(wordsOf(it.text));
    return D.SENTENCES.filter(s => s !== it).map(s => [s, wordsOf(s.text).filter(w => ws.has(w)).length + Math.random()])
      .sort((x, y) => y[1] - x[1]).slice(0, 2).map(x => x[0]);
  };
  runQuiz({ title: 'Listen & choose', items: pickN(D.SENTENCES, o.count || 4), kind: 'listen-read', key: it => it.text, doneTitle: 'Great listening!', onFinish: showReadMenu, ...o,
    q: (bar, it) => ask(bar, {
      wide: true,
      prompt: () => say(`Listen. ${it.text}`, 0.85),
      top: h('div', { class: 'big-q' }, '👂 Which sentence did you hear?'),
      options: shuffle([it, ...similar(it)]).map(s => ({ cls: 'word-chip read sent-opt', label: s.text, ok: s === it,
        right: () => say(`Yes! ${it.text}`), wrong: () => say(`That one says: ${s.text}. Listen again: ${it.text}`, 0.9) })),
    }) });
}

// Story time: Appu reads a short story line by line, then asks picture questions about it.
async function gameStory(o = {}) {
  const st = o.story || pick(D.STORIES);
  const fill = t => t.replace(/\{name\}/g, S.name || 'Sam');
  const id = newScreen();
  const bar = frame({ title: fill(st.title), pips: st.qs.length, onHome: o.onHome });
  const lines = st.lines.map(l => h('p', { class: 'story-line read' }, fill(l)));
  const readStory = async () => {
    for (const ln of lines) {
      if (!alive(id) || !ln.isConnected) return;
      ln.classList.add('speaking'); await say(ln.textContent, 0.85); ln.classList.remove('speaking');
    }
  };
  bar.setRepeat(readStory);
  const goBtn = h('button', { class: 'big-btn' }, 'Questions ▶');
  bar.body.replaceChildren(h('div', { class: 'story' }, h('div', { class: 'story-pic' }, st.e), h('div', { class: 'story-text' }, lines), goBtn));
  const ready = new Promise(r => { goBtn.onclick = r; });
  await readStory();
  if (!alive(id)) return;
  await ready;
  let first = 0;
  for (let i = 0; i < st.qs.length; i++) {
    const qn = st.qs[i];
    bar.setPip(i, 'now');
    const mini = h('button', { class: 'story-mini read', onclick: () => say(st.lines.map(fill).join(' '), 0.85) }, st.lines.map(fill).join(' '));
    const ok = await ask(bar, {
      prompt: () => say(fill(qn.q)),
      top: h('div', { class: 'qa-top' }, mini, h('div', { class: 'big-q' }, fill(qn.q))),
      options: shuffle(qn.options).map(op => ({ cls: op.e ? 'pic-card small' : 'word-chip read big',
        label: op.e ? [picLabel(op.e), h('span', { class: 'pic-word read' }, op.label)] : op.label, ok: op.label === qn.answer,
        right: () => say(`Yes! ${op.label}.`), wrong: () => say('Not that one. Tap the story to hear it again.') })),
    });
    if (!alive(id)) return;
    if (ok) first++;
    stat('story', st.title, ok); bar.setPip(i, ok ? 'done' : 'done soft');
    await wait(300);
  }
  await celebrate({ title: 'Story star!', stars: roundStars(first, st.qs.length), text: `You listened so well, ${kid()}!` });
  if (alive(id)) (o.onFinish || showReadMenu)();
}

const READ_ACTS = [
  { icon: '📖', name: 'Read & match', sub: 'sentence → picture', play: o => gameRead({ mode: 'match', count: 4, ...o }) },
  { icon: '🧱', name: 'Build the sentence', sub: 'put the words in order', play: o => gameRead({ mode: 'build', count: 4, ...o }) },
  { icon: '🕳️', name: 'Missing word', sub: 'The sun is ___.', play: gameCloze },
  { icon: '🤪', name: 'True or silly?', sub: 'A pig can fly.', play: gameTruth },
  { icon: '🖼️', name: 'Which sentence?', sub: 'picture → sentence', play: gameWhichSentence },
  { icon: '👂', name: 'Listen & choose', sub: 'hear it, find it', play: gameListenChoose },
  { icon: '📚', name: 'Story time', sub: 'listen, then answer', play: gameStory },
  { icon: '🎈', name: 'Pop the word', sub: 'sight words', play: o => gameSight({ count: 6, onFinish: showReadMenu, ...o }) },
];

function showReadMenu() {
  activityMenu({ title: 'Read sentences', note: 'Read and listen to short sentences and stories. Tap any word to hear it.',
    acts: READ_ACTS.map(a => ({ ...a, run: () => a.play({}) })) });
}
