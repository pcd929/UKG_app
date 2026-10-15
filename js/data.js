'use strict';
/* Content + letter geometry for Appu's Garden.
   Frame units: x 0..100 per letter; y 20 = sky line (capitals / tall letters), 50 = middle line
   (x-height), 80 = grass line (baseline), 110 = ground line (descenders).
   Segments: l(x1,y1,x2,y2) line; a(cx,cy,rx,ry,a0,a1) arc in degrees with y pointing down, so
   a1 > a0 runs clockwise on screen; d(x,y) is a dot to tap. One stroke = one pen-down. */
const DATA = (() => {
  const STEP = 1.5;
  const l = (x1, y1, x2, y2) => ['l', x1, y1, x2, y2];
  const a = (cx, cy, rx, ry, a0, a1) => ['a', cx, cy, rx, ry, a0, a1];
  const d = (x, y) => ['d', x, y];
  const p = (...c) => { const s = []; for (let i = 0; i + 3 < c.length; i += 2) s.push(l(c[i], c[i + 1], c[i + 2], c[i + 3])); return s; };
  const s = (...parts) => parts.flatMap(q => (typeof q[0] === 'string' ? [q] : q));

  // Print letters, school stroke order (down strokes first, "magic c" for a d g q).
  const GLYPHS = {
    a: [s(a(50, 65, 15, 15, 330, 30)), s(l(65, 50, 65, 80))],
    b: [s(l(35, 20, 35, 80)), s(a(50, 65, 15, 15, 180, 540))],
    c: [s(a(50, 65, 15, 15, 320, 40))],
    d: [s(a(50, 65, 15, 15, 330, 30)), s(l(65, 20, 65, 80))],
    e: [s(l(35, 65, 65, 65), a(50, 65, 15, 15, 360, 40))],
    f: [s(a(57, 30, 10, 10, 330, 180), l(47, 30, 47, 80)), s(l(37, 50, 58, 50))],
    g: [s(a(50, 65, 15, 15, 330, 30)), s(l(65, 50, 65, 100), a(55, 100, 10, 10, 0, 165))],
    h: [s(l(35, 20, 35, 80)), s(a(50, 65, 15, 15, 180, 360), l(65, 65, 65, 80))],
    i: [s(l(50, 50, 50, 80)), s(d(50, 36))],
    j: [s(l(57, 50, 57, 100), a(47, 100, 10, 10, 0, 165)), s(d(57, 36))],
    k: [s(l(35, 20, 35, 80)), s(p(63, 48, 36, 66, 63, 80))],
    l: [s(l(50, 20, 50, 80))],
    m: [s(l(28, 50, 28, 80)), s(a(39, 61, 11, 11, 180, 360), l(50, 61, 50, 80)), s(a(61, 61, 11, 11, 180, 360), l(72, 61, 72, 80))],
    n: [s(l(35, 50, 35, 80)), s(a(50, 65, 15, 15, 180, 360), l(65, 65, 65, 80))],
    o: [s(a(50, 65, 15, 15, 290, -70))],
    p: [s(l(35, 50, 35, 110)), s(a(50, 65, 15, 15, 180, 540))],
    q: [s(a(50, 65, 15, 15, 330, 30)), s(l(65, 50, 65, 110))],
    r: [s(l(37, 50, 37, 80)), s(a(52, 65, 15, 15, 180, 305))],
    s: [s(a(50, 57.5, 12, 7.5, 330, 90), a(50, 72.5, 12, 7.5, 270, 510))],
    t: [s(l(50, 31, 50, 80)), s(l(38, 50, 62, 50))],
    u: [s(l(35, 50, 35, 65), a(50, 65, 15, 15, 180, 0)), s(l(65, 50, 65, 80))],
    v: [s(p(35, 50, 50, 80, 65, 50))],
    w: [s(p(26, 50, 38, 80, 50, 56, 62, 80, 74, 50))],
    x: [s(l(37, 50, 63, 80)), s(l(63, 50, 37, 80))],
    y: [s(l(37, 50, 51, 79)), s(l(64, 50, 42, 110))],
    z: [s(p(36, 50, 64, 50, 36, 80, 64, 80))],

    A: [s(l(50, 20, 31, 80)), s(l(50, 20, 69, 80)), s(l(38, 60, 62, 60))],
    B: [s(l(35, 20, 35, 80)), s(l(35, 20, 50, 20), a(50, 34.5, 14, 14.5, 270, 450), l(50, 49, 35, 49)),
        s(l(35, 49, 52, 49), a(52, 64.5, 15, 15.5, 270, 450), l(52, 80, 35, 80))],
    C: [s(a(52, 50, 20, 30, 320, 40))],
    D: [s(l(35, 20, 35, 80)), s(l(35, 20, 45, 20), a(45, 50, 20, 30, 270, 450), l(45, 80, 35, 80))],
    E: [s(l(36, 20, 36, 80)), s(l(36, 20, 64, 20)), s(l(36, 50, 60, 50)), s(l(36, 80, 64, 80))],
    F: [s(l(36, 20, 36, 80)), s(l(36, 20, 64, 20)), s(l(36, 50, 60, 50))],
    G: [s(a(52, 50, 20, 30, 320, 0), l(72, 50, 56, 50))],
    H: [s(l(33, 20, 33, 80)), s(l(67, 20, 67, 80)), s(l(33, 50, 67, 50))],
    I: [s(l(50, 20, 50, 80)), s(l(38, 20, 62, 20)), s(l(38, 80, 62, 80))],
    J: [s(l(60, 20, 60, 62), a(46, 62, 14, 18, 0, 180))],
    K: [s(l(35, 20, 35, 80)), s(p(66, 20, 35, 53, 66, 80))],
    L: [s(p(36, 20, 36, 80, 64, 80))],
    M: [s(l(30, 20, 30, 80)), s(p(30, 20, 50, 62, 70, 20, 70, 80))],
    N: [s(l(33, 20, 33, 80)), s(p(33, 20, 67, 80, 67, 20))],
    O: [s(a(50, 50, 20, 30, 270, -90))],
    P: [s(l(35, 20, 35, 80)), s(l(35, 20, 50, 20), a(50, 35, 15, 15, 270, 450), l(50, 50, 35, 50))],
    Q: [s(a(50, 50, 20, 30, 270, -90)), s(l(55, 64, 72, 84))],
    R: [s(l(35, 20, 35, 80)), s(l(35, 20, 50, 20), a(50, 35, 15, 15, 270, 450), l(50, 50, 35, 50)), s(l(46, 50, 66, 80))],
    S: [s(a(50, 35, 17, 15, 330, 90), a(50, 65, 17, 15, 270, 510))],
    T: [s(l(32, 20, 68, 20)), s(l(50, 20, 50, 80))],
    U: [s(l(33, 20, 33, 60), a(50, 60, 17, 20, 180, 0), l(67, 60, 67, 20))],
    V: [s(p(32, 20, 50, 80, 68, 20))],
    W: [s(p(25, 20, 37, 80, 50, 38, 63, 80, 75, 20))],
    X: [s(l(34, 20, 66, 80)), s(l(66, 20, 34, 80))],
    Y: [s(l(33, 20, 50, 50)), s(l(67, 20, 50, 50)), s(l(50, 50, 50, 80))],
    Z: [s(p(33, 20, 67, 20, 33, 80, 67, 80))],
    '-': [s(l(40, 65, 60, 65))],
  };

  function compileStroke(segs) {
    const pts = [];
    let dot = false;
    for (const g of segs) {
      const q = [];
      if (g[0] === 'd') { dot = true; q.push([g[1], g[2]]); }
      else if (g[0] === 'l') {
        const [, x1, y1, x2, y2] = g;
        const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / STEP));
        for (let i = 0; i <= n; i++) q.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]);
      } else {
        const [, cx, cy, rx, ry, a0, a1] = g;
        const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * Math.PI / 180 * (rx + ry) / 2 / STEP));
        for (let i = 0; i <= n; i++) {
          const t = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
          q.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
        }
      }
      const last = pts[pts.length - 1];
      if (last && q.length && Math.hypot(last[0] - q[0][0], last[1] - q[0][1]) < 0.01) q.shift();
      pts.push(...q);
    }
    return { pts, dot };
  }

  // Lay glyphs side by side (a word), centred in a frame at least 100 units wide.
  function compose(keys, gap = 12) {
    let cursor = 0;
    const placed = keys.map(k => {
      const g = GLYPHS[k].map(compileStroke);
      let mn = Infinity, mx = -Infinity;
      g.forEach(st => st.pts.forEach(([x]) => { mn = Math.min(mn, x); mx = Math.max(mx, x); }));
      const item = { g, dx: cursor - mn };
      cursor += (mx - mn) + gap;
      return item;
    });
    const W = cursor - gap;
    const frameW = Math.max(W + 40, 100);
    const off = (frameW - W) / 2;
    const strokes = [];
    placed.forEach(({ g, dx }, gi) => g.forEach((st, si) => strokes.push({
      pts: st.pts.map(([x, y]) => [x + dx + off, y]), dot: st.dot, num: si + 1, glyph: gi,
    })));
    return { strokes, frameW };
  }

  // Pre-writing warm-ups: the strokes every letter is built from.
  const xs = (n, x0, dx) => Array.from({ length: n }, (_, i) => x0 + i * dx);
  const PATTERN_DEFS = [
    { id: 'rain', name: 'Rain', icon: '🌧️', W: 260, say: 'Make the rain fall! Draw from the cloud straight down to the grass.',
      strokes: xs(5, 50, 40).map(x => [l(x, 24, x, 80)]),
      decor: [[70, 11, '☁️'], [130, 11, '☁️'], [190, 11, '☁️'], ...xs(5, 50, 40).map(x => [x, 95, '🌷'])] },
    { id: 'roads', name: 'Roads', icon: '🚗', W: 270, say: 'Drive the car along the road, from left to right.',
      strokes: [35, 65, 95].map(y => [l(40, y, 228, y)]),
      decor: [[22, 35, '🚗'], [22, 65, '🚗'], [22, 95, '🚗'], [248, 35, '🏠'], [248, 65, '🏠'], [248, 95, '🏠']] },
    { id: 'slides', name: 'Slides', icon: '🐧', W: 260, say: 'Slide down the slides, from the top to the bottom.',
      strokes: xs(4, 40, 50).map(x => [l(x, 24, x + 40, 80)]),
      decor: xs(4, 40, 50).map(x => [x - 2, 13, '🐧']) },
    { id: 'mountains', name: 'Mountains', icon: '⛰️', W: 280, say: 'Climb up and down the mountains. Do not lift your finger!',
      strokes: [p(20, 80, 50, 28, 80, 80, 110, 28, 140, 80, 170, 28, 200, 80, 230, 28, 260, 80)],
      decor: [[9, 72, '🐐'], [272, 72, '🚩']] },
    { id: 'waves', name: 'Waves', icon: '🌊', W: 280, say: 'Swim over the waves, up and down, up and down.',
      strokes: [xs(8, 35, 30).map((cx, i) => (i % 2 ? a(cx, 65, 15, 15, 180, 0) : a(cx, 65, 15, 15, 180, 360)))],
      decor: [[9, 65, '🐟'], [272, 65, '🐚']] },
    { id: 'hops', name: 'Bunny hops', icon: '🐰', W: 265, say: 'Hop, hop, hop! Take the bunny to the carrot.',
      strokes: [xs(7, 40, 30).map(cx => a(cx, 80, 15, 26, 180, 360))],
      decor: [[12, 72, '🐰'], [252, 74, '🥕']] },
    { id: 'bubbles', name: 'Bubbles', icon: '🐠', W: 280, say: 'Blow round bubbles. Start at the top and go round, like the letter c.',
      strokes: xs(4, 50, 60).map(cx => [a(cx, 62, 20, 20, 270, -90)]),
      decor: [[14, 96, '🐠'], [266, 96, '🐠']] },
  ];
  const PATTERNS = PATTERN_DEFS.map(pd => ({
    id: pd.id, name: pd.name, icon: pd.icon, say: pd.say,
    decor: pd.decor.map(([x, y, e]) => ({ x, y, e })),
    shape: { frameW: pd.W, strokes: pd.strokes.map((sg, i) => ({ ...compileStroke(sg), num: i + 1, glyph: 0 })) },
  }));

  // Jolly Phonics letter order (groups 1-3 are all single letters; the rest pulled from groups 4-7).
  const JOLLY_GROUPS = [
    ['s', 'a', 't', 'i', 'p', 'n'],
    ['c', 'k', 'e', 'h', 'r', 'm', 'd'],
    ['g', 'o', 'u', 'l', 'f', 'b'],
    ['j', 'z', 'w', 'v', 'y', 'x', 'q'],
  ];
  const JOLLY_ORDER = JOLLY_GROUPS.flat();

  // Beginning-sound picture bank: [word, emoji]. Kept to emoji that render on Windows 10+ and Android 10+.
  const SOUND_WORDS = {
    s: [['sun', '☀️'], ['snake', '🐍'], ['sock', '🧦'], ['spoon', '🥄']],
    a: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊'], ['ambulance', '🚑'], ['axe', '🪓']],
    t: [['tiger', '🐯'], ['tent', '⛺'], ['tomato', '🍅'], ['tooth', '🦷'], ['turtle', '🐢'], ['taxi', '🚕']],
    i: [['insect', '🐞'], ['iguana', '🦎'], ['ink', '🖋️']],
    p: [['pig', '🐷'], ['pen', '🖊️'], ['pizza', '🍕'], ['panda', '🐼'], ['penguin', '🐧'], ['parrot', '🦜']],
    n: [['nose', '👃'], ['nut', '🥜'], ['net', '🥅'], ['noodles', '🍜'], ['necktie', '👔']],
    c: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂'], ['cow', '🐮'], ['carrot', '🥕'], ['camel', '🐫']],
    k: [['kite', '🪁'], ['key', '🔑'], ['king', '🤴'], ['kangaroo', '🦘'], ['koala', '🐨']],
    e: [['egg', '🥚'], ['elephant', '🐘'], ['elf', '🧝'], ['envelope', '✉️']],
    h: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠'], ['hen', '🐔'], ['hand', '✋'], ['hammer', '🔨']],
    r: [['rabbit', '🐰'], ['rainbow', '🌈'], ['ring', '💍'], ['robot', '🤖'], ['rocket', '🚀'], ['rose', '🌹']],
    m: [['monkey', '🐵'], ['moon', '🌙'], ['mouse', '🐭'], ['milk', '🥛'], ['mango', '🥭'], ['mushroom', '🍄']],
    d: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁'], ['door', '🚪'], ['dolphin', '🐬'], ['dinosaur', '🦕']],
    g: [['goat', '🐐'], ['grapes', '🍇'], ['gift', '🎁'], ['guitar', '🎸'], ['gorilla', '🦍']],
    o: [['octopus', '🐙'], ['orange', '🍊'], ['ox', '🐂'], ['otter', '🦦']],
    u: [['umbrella', '☂️'], ['up', '⬆️'], ['upside down', '🙃']],
    l: [['lion', '🦁'], ['leaf', '🍃'], ['lemon', '🍋'], ['lock', '🔒'], ['ladder', '🪜'], ['lollipop', '🍭']],
    f: [['fish', '🐟'], ['fox', '🦊'], ['frog', '🐸'], ['flower', '🌸'], ['fire', '🔥'], ['fork', '🍴']],
    b: [['ball', '⚽'], ['banana', '🍌'], ['bus', '🚌'], ['bee', '🐝'], ['bear', '🐻'], ['balloon', '🎈']],
    j: [['jeep', '🚙'], ['juice', '🧃'], ['jacket', '🧥'], ['jigsaw', '🧩']],
    z: [['zebra', '🦓'], ['zip', '🤐']],
    w: [['watch', '⌚'], ['whale', '🐳'], ['window', '🪟'], ['worm', '🪱'], ['web', '🕸️'], ['watermelon', '🍉']],
    v: [['van', '🚐'], ['violin', '🎻'], ['volcano', '🌋'], ['vest', '🦺']],
    y: [['yo-yo', '🪀'], ['yarn', '🧶'], ['yawn', '🥱']],
    q: [['queen', '👸'], ['question', '❓']],
    sh: [['ship', '🚢'], ['shoe', '👟'], ['shell', '🐚'], ['sheep', '🐑'], ['shark', '🦈'], ['shirt', '👕']],
    ch: [['chick', '🐥'], ['cheese', '🧀'], ['chair', '🪑'], ['cherry', '🍒'], ['chocolate', '🍫']],
    th: [['thumb', '👍'], ['three', '3️⃣'], ['thread', '🧵']],
  };
  const SOUND_KEYS = [...JOLLY_ORDER.filter(k => SOUND_WORDS[k]), 'sh', 'ch', 'th'];
  const LETTER_WORD = Object.fromEntries(JOLLY_ORDER.map(k => [k, SOUND_WORDS[k] ? SOUND_WORDS[k][0] : ['fox', '🦊']]));

  const w = (g, e) => ({ w: g.replace(/-/g, ''), g: g.split('-'), e });
  const WORDS = {
    cvc: [ // short a, e, i, o, u; the vowel is always g[1]
      w('c-a-t', '🐱'), w('b-a-t', '🦇'), w('h-a-t', '🎩'), w('r-a-t', '🐀'), w('m-a-p', '🗺️'), w('c-a-p', '🧢'),
      w('n-a-p', '😴'), w('t-a-p', '🚰'), w('v-a-n', '🚐'), w('c-a-n', '🥫'), w('p-a-n', '🍳'), w('m-a-n', '👨'),
      w('b-a-g', '👜'), w('t-a-g', '🏷️'), w('s-a-d', '😢'), w('m-a-d', '😠'), w('c-a-b', '🚕'),
      w('h-e-n', '🐔'), w('p-e-n', '🖊️'), w('t-e-n', '🔟'), w('n-e-t', '🥅'), w('j-e-t', '✈️'), w('w-e-t', '💧'),
      w('b-e-d', '🛏️'), w('r-e-d', '🔴'), w('w-e-b', '🕸️'), w('l-e-g', '🦵'), w('g-e-m', '💎'), w('y-e-s', '✅'),
      w('p-i-g', '🐷'), w('d-i-g', '⛏️'), w('p-i-n', '📌'), w('b-i-n', '🗑️'), w('w-i-n', '🏆'), w('z-i-p', '🤐'),
      w('l-i-p', '👄'), w('s-i-x', '6️⃣'), w('k-i-d', '🧒'),
      w('d-o-g', '🐶'), w('l-o-g', '🪵'), w('f-o-x', '🦊'), w('b-o-x', '📦'), w('p-o-t', '🍲'), w('h-o-t', '🔥'),
      w('d-o-t', '⚫'), w('c-o-b', '🌽'), w('s-o-b', '😭'), w('r-o-d', '🎣'),
      w('s-u-n', '☀️'), w('r-u-n', '🏃'), w('f-u-n', '🎉'), w('b-u-g', '🐛'), w('m-u-g', '☕'), w('h-u-g', '🤗'),
      w('n-u-t', '🥜'), w('h-u-t', '🛖'), w('c-u-t', '✂️'), w('b-u-s', '🚌'), w('t-u-b', '🛁'), w('c-u-p', '🥤'),
    ],
    digraph: [
      w('sh-i-p', '🚢'), w('f-i-sh', '🐟'), w('sh-e-ll', '🐚'), w('sh-o-p', '🏪'), w('ch-i-p', '🍟'),
      w('ch-i-ck', '🐥'), w('b-a-th', '🛁'), w('d-u-ck', '🦆'), w('s-o-ck', '🧦'), w('r-o-ck', '🪨'), w('l-o-ck', '🔒'),
    ],
    blend: [
      w('f-r-o-g', '🐸'), w('d-r-u-m', '🥁'), w('f-l-a-g', '🚩'), w('c-r-a-b', '🦀'), w('s-w-i-m', '🏊'),
      w('p-l-u-g', '🔌'), w('t-e-n-t', '⛺'), w('m-i-l-k', '🥛'), w('h-a-n-d', '✋'), w('g-i-f-t', '🎁'),
      w('s-l-e-d', '🛷'), w('c-l-a-p', '👏'), w('s-t-o-p', '🛑'), w('g-r-i-n', '😁'),
    ],
  };

  // Words whose spelling has more letters than sounds, for "Count the sounds".
  const SOUND_COUNT_EXTRA = [w('u-p', '⬆️'), w('e-gg', '🥚'), w('b-ee', '🐝'), w('sh-oe', '👟'), w('k-ey', '🔑'),
    w('c-ow', '🐮'), w('m-oo-n', '🌙'), w('b-oa-t', '⛵'), w('r-ai-n', '🌧️'), w('t-ee-th', '🦷')];

  // Letters children mix up, used as distractors in Letter hunt and Big & small.
  const LOOKALIKE = { b: 'dpq', d: 'bpq', p: 'qbd', q: 'pdg', m: 'nw', n: 'muh', u: 'nv', w: 'mv', i: 'lj', l: 'it', t: 'fl',
    f: 't', h: 'nk', a: 'oe', e: 'ac', c: 'oe', o: 'ca', s: 'z', z: 's', g: 'qy', y: 'gv', v: 'wy', k: 'h', r: 'n', j: 'i', x: 'k' };

  // Dolch pre-primer / primer sight words, roughly in the order UKG classes meet them.
  const SIGHT = ['I', 'a', 'the', 'is', 'it', 'in', 'on', 'to', 'and', 'my', 'me', 'we', 'he', 'she', 'see', 'go',
    'no', 'can', 'you', 'look', 'up', 'am', 'at', 'like', 'this', 'here', 'big', 'little', 'said', 'was', 'are',
    'of', 'for', 'come', 'play', 'run', 'jump', 'red', 'yes'];

  const SENTENCES = [
    ['I see a cat.', '🐱'], ['The dog can run.', '🐶'], ['A pig is in the mud.', '🐷'], ['The sun is hot.', '☀️'],
    ['I can see a red bus.', '🚌'], ['This is my hat.', '🎩'], ['A frog can jump.', '🐸'], ['The fish can swim.', '🐟'],
    ['Look at the big fox.', '🦊'], ['We go in a jet.', '✈️'], ['A bug is on my leg.', '🐛'], ['Dad has a big van.', '🚐'],
    ['The duck is in the pond.', '🦆'], ['The moon is up.', '🌙'], ['Here is a box.', '📦'], ['The ship is big.', '🚢'],
    ['A crab is red.', '🦀'], ['I like the drum.', '🥁'], ['The chick is little.', '🐥'], ['The hen is on the bed.', '🐔'],
    ['A bee is on a red rose.', '🐝'], ['Mum has a big cake.', '🎂'], ['I can kick the ball.', '⚽'], ['A man is in a cab.', '🚕'],
    ['I can see six eggs.', '🥚'], ['The pen is in my bag.', '👜'], ['A bat can fly.', '🦇'], ['The kid can hop.', '🧒'],
  ].map(([text, e]) => ({ text, e }));

  // Fill the gap: [sentence with ___, answer, options, picture].
  const CLOZE = [
    ['The sun is ___.', 'hot', ['hot', 'sad', 'wet'], '☀️'], ['A frog can ___.', 'jump', ['jump', 'red', 'cup'], '🐸'],
    ['I see a big ___.', 'bus', ['bus', 'run', 'is'], '🚌'], ['The cat is on the ___.', 'bed', ['bed', 'jet', 'hen'], '🐱🛏️'],
    ['The apple is ___.', 'red', ['red', 'blue', 'hot'], '🍎'], ['A fish can ___.', 'swim', ['swim', 'sing', 'sit'], '🐟'],
    ['I have a ___ on my head.', 'hat', ['hat', 'cup', 'bug'], '🎩'], ['The dog is in the ___.', 'box', ['box', 'sun', 'pen'], '🐶📦'],
    ['A ___ can fly.', 'jet', ['jet', 'pig', 'log'], '✈️'], ['I drink milk in a ___.', 'cup', ['cup', 'bag', 'net'], '🥛'],
    ['The bug is on a ___.', 'log', ['log', 'van', 'pin'], '🐛🪵'], ['Dad can ___ fast.', 'run', ['run', 'hat', 'ten'], '🏃'],
    ['I can see ___ pigs.', 'six', ['six', 'two', 'ten'], '🐷🐷🐷🐷🐷🐷'], ['The moon is in the ___.', 'sky', ['sky', 'mud', 'box'], '🌙'],
    ['A duck says ___.', 'quack', ['quack', 'moo', 'woof'], '🦆'], ['A cow says ___.', 'moo', ['moo', 'quack', 'meow'], '🐮'],
    ['A pen is in the ___.', 'bag', ['bag', 'sun', 'web'], '🖊️👜'], ['The man is in a ___.', 'cab', ['cab', 'cup', 'cat'], '👨🚕'],
  ].map(([text, answer, options, e]) => ({ text, answer, options, e }));

  // True or silly: [sentence, picture, true?].
  const TRUTH = [
    ['A fish can swim.', '🐟', true], ['A bird can fly.', '🐦', true], ['The sun is hot.', '☀️', true], ['A dog can run.', '🐶', true],
    ['A duck can swim.', '🦆', true], ['Ice is cold.', '🧊', true], ['A frog can hop.', '🐸', true], ['The moon is up in the sky.', '🌙', true],
    ['A cat has a tail.', '🐱', true], ['A cow gives us milk.', '🐮', true], ['A bee can buzz.', '🐝', true], ['An apple is red.', '🍎', true],
    ['A pig can fly.', '🐷', false], ['A fish can run.', '🐟', false], ['The sun is cold.', '☀️', false], ['A cat can read a book.', '🐱', false],
    ['A bus can swim.', '🚌', false], ['A hen has six legs.', '🐔', false], ['A dog can sing a song.', '🐶', false], ['An egg can jump.', '🥚', false],
    ['The moon is a cake.', '🌙', false], ['A frog can drive a car.', '🐸', false], ['A banana is blue.', '🍌', false], ['A rock can talk.', '🪨', false],
  ].map(([text, e, ok]) => ({ text, e, ok }));

  // Short stories read aloud, then picture questions; the first option is the answer. {name} becomes the child's name.
  const o = (e, label) => ({ e, label });
  const STORIES = [
    { title: 'The red cat', e: '🐱', lines: ['{name} has a cat.', 'The cat is big and red.', 'The cat can jump on the bed.'],
      qs: [['What does {name} have?', [o('🐱', 'cat'), o('🐶', 'dog'), o('🐷', 'pig')]],
        ['What colour is the cat?', [o('🔴', 'red'), o('🔵', 'blue'), o('🟢', 'green')]],
        ['Where does the cat jump?', [o('🛏️', 'bed'), o('🚌', 'bus'), o('🌳', 'tree')]]] },
    { title: 'At the park', e: '🏞️', lines: ['Riya goes to the park.', 'She sees a duck in the pond.', 'The duck says quack!'],
      qs: [['Where does Riya go?', [o('🏞️', 'park'), o('🏫', 'school'), o('🏪', 'shop')]],
        ['What does Riya see?', [o('🦆', 'duck'), o('🐸', 'frog'), o('🐟', 'fish')]],
        ['What does the duck say?', [o('', 'quack'), o('', 'moo'), o('', 'woof')]]] },
    { title: 'The big red bus', e: '🚌', lines: ['Dad and I get on a big red bus.', 'The bus goes up the hill.', 'We get off at the shop.'],
      qs: [['What do they get on?', [o('🚌', 'bus'), o('🚂', 'train'), o('✈️', 'jet')]],
        ['What colour is the bus?', [o('🔴', 'red'), o('🟡', 'yellow'), o('🔵', 'blue')]],
        ['Where do they get off?', [o('🏪', 'shop'), o('🏠', 'home'), o('🏫', 'school')]]] },
    { title: 'The frog and the bug', e: '🐸', lines: ['A frog sits on a log.', 'A bug flies past.', 'The frog eats the bug. Yum!'],
      qs: [['Where does the frog sit?', [o('🪵', 'log'), o('🪨', 'rock'), o('🛏️', 'bed')]],
        ['What flies past?', [o('🐛', 'bug'), o('🐦', 'bird'), o('✈️', 'jet')]],
        ['What does the frog eat?', [o('🐛', 'bug'), o('🍕', 'pizza'), o('🍌', 'banana')]]] },
    { title: "Appu's birthday", e: '🎂', lines: ["It is Appu's birthday.", 'Mum makes a big cake.', 'Appu gets a red ball and six balloons.'],
      qs: [['What does Mum make?', [o('🎂', 'cake'), o('🍕', 'pizza'), o('🍪', 'biscuit')]],
        ['What does Appu get?', [o('⚽', 'ball'), o('🪁', 'kite'), o('🚗', 'car')]],
        ['How many balloons?', [o('', 'six'), o('', 'two'), o('', 'ten')]]] },
    { title: 'Rain, rain', e: '🌧️', lines: ['It is a wet day.', 'The rain falls on my hat.', 'I jump in the mud. Mum is not happy!'],
      qs: [['What falls on the hat?', [o('🌧️', 'rain'), o('🍎', 'apple'), o('⚽', 'ball')]],
        ['Where do I jump?', [o('🟫', 'mud'), o('🛏️', 'bed'), o('🚌', 'bus')]],
        ['Is Mum happy?', [o('😟', 'no'), o('😀', 'yes')]]] },
    { title: 'The fox and the hen', e: '🦊', lines: ['A fox sees a hen.', 'The hen runs into the hut.', 'The fox is sad.'],
      qs: [['What does the fox see?', [o('🐔', 'hen'), o('🦆', 'duck'), o('🐷', 'pig')]],
        ['Where does the hen run?', [o('🛖', 'hut'), o('🚌', 'bus'), o('🏪', 'shop')]],
        ['How is the fox?', [o('😢', 'sad'), o('😀', 'happy'), o('😠', 'cross')]]] },
    { title: '{name} can write', e: '✏️', lines: ['{name} has a pen.', 'He writes a big A and a cat.', 'Mum gives him a star!'],
      qs: [['What does {name} have?', [o('🖊️', 'pen'), o('🥄', 'spoon'), o('🧦', 'sock')]],
        ['What does he write?', [o('🐱', 'cat'), o('🐶', 'dog'), o('🐷', 'pig')]],
        ['What does Mum give him?', [o('⭐', 'star'), o('🍬', 'sweet'), o('🎈', 'balloon')]]] },
  ].map(st => ({ ...st, qs: st.qs.map(([q, options]) => ({ q, options, answer: options[0].label })) }));

  const STICKERS = ['🦁', '🐯', '🐼', '🐨', '🐸', '🐵', '🦊', '🐰', '🐻', '🦄', '🐲', '🦖', '🐙', '🦋', '🐬',
    '🦈', '🦉', '🦚', '🦜', '🐢', '🦒', '🦓', '🐘', '🦩', '🐳', '🚀', '🚂', '🚒', '🏎️', '🚁'];

  return { GLYPHS, compose, PATTERNS, JOLLY_GROUPS, JOLLY_ORDER, SOUND_WORDS, SOUND_KEYS, LETTER_WORD, WORDS, SOUND_COUNT_EXTRA, LOOKALIKE,
    SIGHT, SENTENCES, CLOZE, TRUTH, STORIES, STICKERS };
})();
