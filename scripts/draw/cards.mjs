// The project cards. Each one is a separate image so it can link to its repository.
// The status on a card says where the code really is today.
import { arrow, calm, frame, measure, text } from '../lib/ink.mjs';

function wrap(str, maxWidth, style) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next, style) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const paragraph = (str, x, y, maxWidth, leading, style) =>
  wrap(str, maxWidth, style)
    .map((line, i) => text(line, x, y + i * leading, style))
    .join('');

const common = `
.pulse { transform-box: fill-box; transform-origin: center; opacity: 0; animation: pulse 2.6s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(.9); opacity: .9; } 100% { transform: scale(3.2); opacity: 0; } }
${calm}`;

const CARD_W = 820;
const CARD_H = 580;
// The margins inside the canvas are what separate the cards in the grid.
const INSET_X = 12;
const INSET_Y = 4;
const PAD = 46;

function status(label, x, y, colour, live, scale = 1) {
  const r = 6.5 * scale;
  let out = `<circle cx="${x + r}" cy="${y - r + 1}" r="${r}" fill="${colour}"/>`;
  if (live) out += `<circle class="pulse motion" cx="${x + r}" cy="${y - r + 1}" r="${r}" stroke="${colour}" stroke-width="${1.6 * scale}"/>`;
  out += text(label, x + r * 2 + 11, y, { font: 'monoMedium', size: 20 * scale, fill: colour, track: 0.1 });
  return out;
}

// `tile` is the phone version: half the width of a phone, so only the art and big type survive.
function card({ title, titleLines, stateLabel, stateColour, live, desc, stack, art, css = '', alt }, theme, tile = false) {
  const { ink, text: body, muted, hair } = theme;
  if (tile) {
    const H = 650;
    const lines = titleLines ?? [title];
    const titles = lines
      .map((line, i) => text(line, PAD - 4, H - 46 - (lines.length - 1 - i) * 112, { font: 'serif', size: 116, fill: ink, track: -0.006 }))
      .join('');
    const tileBody = `<g transform="translate(${INSET_X} ${INSET_Y})">
<rect x="1.5" y="1.5" width="${CARD_W - 3}" height="${H - 3}" rx="40" stroke="${hair}" stroke-width="3"/>
${status(stateLabel, PAD, 88, stateColour, live, 1.9)}
<g transform="translate(0 44)">${art}</g>
${titles}
</g>`;
    return frame({ width: CARD_W + INSET_X * 2, height: H + INSET_Y * 2, title: alt, css: css + common, body: tileBody, theme });
  }
  const body2 = `<g transform="translate(${INSET_X} ${INSET_Y})">
<rect x="1" y="1" width="${CARD_W - 2}" height="${CARD_H - 2}" rx="28" stroke="${hair}" stroke-width="2"/>
${status(stateLabel, PAD, 66, stateColour, live)}
${arrow(CARD_W - PAD - 22, 66, 22, muted, { up: true, width: 2.4 })}
<g>${art}</g>
${text(title, PAD, 372, { font: 'serif', size: 68, fill: ink, track: -0.006 })}
${paragraph(desc, PAD, 418, CARD_W - PAD * 2, 38, { font: 'sans', size: 27, fill: body })}
${text(stack, PAD, CARD_H - 34, { size: 20, fill: muted, track: 0.02 })}
</g>`;
  return frame({ width: CARD_W + INSET_X * 2, height: CARD_H + INSET_Y * 2, title: alt, css: css + common, body: body2, theme });
}

// --- GuessMoji: a riddle you can actually solve -------------------------------------------------
export function drawGuessmoji(theme, tile) {
  const { accent, muted, ink } = theme;
  const emoji = (glyph, x) =>
    `<text x="${x}" y="212" fill="#000" font-size="104" text-anchor="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${glyph}</text>`;
  const art = `
${emoji('\u{1F6A2}', 140)}${emoji('\u{1F9CA}', 280)}${emoji('\u{1F494}', 420)}
${text('=', 526, 208, { font: 'serif', size: 86, fill: muted })}
<g class="ask">${text('?', 590, 214, { font: 'serif', size: 110, fill: accent })}</g>
<g class="answer">${text('Titanic', 582, 208, { font: 'italic', size: 74, fill: ink })}</g>`;
  const css = `
.ask { animation: ask 9s ease-in-out infinite; }
.answer { opacity: 0; animation: answer 9s ease-in-out infinite; }
@keyframes ask { 0%, 40% { opacity: 1; } 44%, 94% { opacity: 0; } 98%, 100% { opacity: 1; } }
@keyframes answer { 0%, 45% { opacity: 0; } 49%, 89% { opacity: 1; } 93%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .answer { display: none; } }`;
  return card({
    title: 'GuessMoji',
    stateLabel: 'FINISHED',
    stateColour: theme.cool,
    desc: 'A word game: decode the riddles the OpenAI API writes in emoji, by category and difficulty.',
    stack: 'Flask  /  Angular  /  OpenAI API  /  Docker',
    art,
    css,
    alt: 'GuessMoji: a word game where players decode riddles the OpenAI API writes in emoji. Flask, Angular, OpenAI API, Docker.',
  }, theme, tile);
}

// --- Plantagon: three sensors and a plant ---------------------------------------------------------
export function drawPlantagon(theme, tile) {
  const { accent, muted, cool, amber, hair } = theme;
  const wave = (y, amp, freq, phase, colour, label) => {
    let d = '';
    for (let x = 0; x <= 400; x += 6) {
      const v = Math.sin(x / freq + phase) * amp + Math.sin(x / (freq * 0.43) + phase * 2) * amp * 0.28;
      d += `${x ? 'L' : 'M'}${(330 + x).toFixed(0)} ${(y + v).toFixed(1)}`;
    }
    return `${text(label, 330, y - 30, { size: 17, fill: muted, track: 0.1 })}<path class="trace" d="${d}" stroke="${colour}" stroke-width="2.6" stroke-linejoin="round" pathLength="1"/>`;
  };
  const plant = `
<path d="M60 262H250" stroke="${hair}" stroke-width="2"/>
<path class="stem" pathLength="1" d="M155 262C155 215 150 190 156 146C158 128 162 118 168 104" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
<path class="leaf" style="animation-delay:.9s" d="M156 205C128 205 98 190 88 160C120 158 150 170 156 205Z" stroke="${accent}" stroke-width="2.6" stroke-linejoin="round"/>
<path class="leaf" style="animation-delay:1.2s" d="M156 172C178 170 214 156 226 122C196 120 164 136 156 172Z" stroke="${accent}" stroke-width="2.6" stroke-linejoin="round"/>
<path class="leaf" style="animation-delay:1.5s" d="M167 106C160 92 164 74 180 62C192 78 186 98 167 106Z" stroke="${accent}" stroke-width="2.6" stroke-linejoin="round"/>`;
  const art = `<g transform="translate(0 34)">${plant}
${wave(116, 11, 58, 0.4, amber, 'TEMPERATURE')}
${wave(186, 8, 92, 2.2, cool, 'SOIL MOISTURE')}
${wave(256, 12, 40, 1.1, accent, 'LIGHT')}</g>`;
  const css = `
.stem { stroke-dasharray: 1; animation: draw 1.6s ease both; }
.trace { stroke-dasharray: 1; animation: draw 2.4s .3s ease both; }
.leaf { transform-box: fill-box; transform-origin: center; animation: leaf .8s cubic-bezier(.2,.75,.2,1) both, sway 6s 2.4s ease-in-out infinite alternate; }
@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes leaf { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
@keyframes sway { from { transform: rotate(-1.6deg); } to { transform: rotate(1.6deg); } }`;
  return card({
    title: 'Plantagon',
    stateLabel: 'FINISHED, TEAM OF FOUR',
    stateColour: theme.cool,
    desc: 'A plant with a digital avatar: Raspberry Pi sensors stream temperature, soil moisture and light to a live dashboard.',
    stack: 'Raspberry Pi  /  Python  /  Node.js  /  React',
    art,
    css,
    alt: 'Plantagon: a four-person project. Raspberry Pi sensors stream temperature, soil moisture and light to a live React dashboard with a digital plant avatar.',
  }, theme, tile);
}

// --- Observability: solid lines are built, dashed lines are next ---------------------------------
export function drawObservability(theme, tile) {
  const { accent, muted, faint, ink } = theme;
  const stops = [
    { x: 90, name: 'REST API', built: true },
    { x: 300, name: 'Redis', sub: 'idempotency', built: true },
    { x: 510, name: 'Kafka', built: false },
    { x: 720, name: 'Alerts', built: false },
  ];
  const y = 190;
  let art = '';
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const solid = a.built && b.built;
    art += `<path d="M${a.x + 42} ${y}H${b.x - 42}" stroke="${solid ? accent : faint}" stroke-width="2.6" ${solid ? '' : 'stroke-dasharray="3 10" stroke-linecap="round"'}/>`;
  }
  for (const s of stops) {
    art += `<circle cx="${s.x}" cy="${y}" r="36" stroke="${s.built ? accent : faint}" stroke-width="2.6" ${s.built ? '' : 'stroke-dasharray="3 9" stroke-linecap="round"'}/>`;
    art += `<circle cx="${s.x}" cy="${y}" r="7" fill="${s.built ? accent : faint}"/>`;
    art += text(s.name, s.x, y + 74, { size: 20, fill: s.built ? ink : muted, anchor: 'middle' });
  }
  art += `<path class="packet motion" d="M${stops[0].x + 42} ${y}H${stops[1].x - 42}" stroke="${accent}" stroke-width="7" stroke-linecap="round" pathLength="1"/>`;
  art += text('BUILT', 195, y - 48, { size: 16, fill: accent, anchor: 'middle', track: 0.1 });
  art += text('NEXT', 510, y - 56, { size: 16, fill: muted, anchor: 'middle', track: 0.1 });

  const css = `
.packet { stroke-dasharray: .02 1; animation: packet 2s linear infinite; }
@keyframes packet { from { stroke-dashoffset: .02; } to { stroke-dashoffset: -1; } }`;
  return card({
    title: 'Mini Observability',
    titleLines: ['Mini', 'Observability'],
    stateLabel: 'EARLY STAGE',
    stateColour: theme.amber,
    desc: 'A log ingestion API with Redis idempotency and a versioned PostgreSQL schema. Kafka, metrics and alerting are next.',
    stack: 'Java  /  Spring Boot  /  Redis  /  PostgreSQL',
    art,
    css,
    alt: 'Mini Observability Platform, early stage: a log ingestion API with Redis idempotency and a PostgreSQL schema. Kafka, metrics and alerting are next.',
  }, theme, tile);
}

// --- Coding challenges: one cell per solved problem, from the repository -------------------------
export function drawChallenges(problems, theme, tile) {
  const { accent, coolDeep, muted } = theme;
  const medium = problems.filter((p) => p.level === 'Medium').length;
  const easy = problems.filter((p) => p.level === 'Easy').length;
  const hard = problems.filter((p) => p.level === 'Hard').length;
  const cols = Math.max(25, Math.ceil(problems.length / 5));
  const gap = Math.min(4, (CARD_W - PAD * 2) / cols * 0.14);
  const size = (CARD_W - PAD * 2 - gap * (cols - 1)) / cols;
  const fill = { Easy: coolDeep, Medium: accent, Hard: theme.ink };
  let cells = '';
  problems.forEach((p, i) => {
    const x = PAD + (i % cols) * (size + gap);
    const y = 96 + Math.floor(i / cols) * (size + gap);
    cells += `<rect class="cell" style="animation-delay:${(i * 0.012).toFixed(3)}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.2).toFixed(1)}" fill="${fill[p.level]}"/>`;
  });
  const rows = Math.ceil(problems.length / cols);
  const legendY = 96 + rows * (size + gap) + 26;
  let legend = '';
  let lx = PAD;
  for (const [label, colour, n] of [['MEDIUM', accent, medium], ['EASY', coolDeep, easy], ...(hard ? [['HARD', theme.ink, hard]] : [])]) {
    legend += `<rect x="${lx}" y="${legendY - 15}" width="15" height="15" rx="3.5" fill="${colour}"/>`;
    const word = `${n} ${label}`;
    legend += text(word, lx + 24, legendY, { size: 18, fill: muted, track: 0.08 });
    lx += 24 + measure(word, { size: 18, track: 0.08 }) + 30;
  }
  const css = `
.cell { transform-box: fill-box; transform-origin: center; animation: pop .35s cubic-bezier(.2,.9,.3,1.3) both; }
@keyframes pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: scale(1); } }`;
  return card({
    title: 'Coding Challenges',
    titleLines: ['Coding', 'Challenges'],
    stateLabel: `${problems.length} SOLVED`,
    stateColour: accent,
    live: true,
    desc: `Algorithms practice, mostly in Java, synced from LeetCode. Each cell is a solved problem, counted from the repository.`,
    stack: 'Java  /  Python  /  LeetHub',
    art: cells + legend,
    css,
    alt: `Coding Challenges: ${problems.length} LeetCode problems solved, ${medium} medium and ${easy} easy, mostly in Java.`,
  }, theme, tile);
}

// --- RoleLens: the wide card ----------------------------------------------------------------------
const REQUIREMENTS = [
  ['Java and Spring Boot', 'covered'],
  ['REST APIs', 'covered'],
  ['PostgreSQL', 'covered'],
  ['Kafka', 'covered'],
  ['Kubernetes', 'partial'],
  ['Terraform', 'missing'],
];
const ROLELENS_TITLE = 'RoleLens, building now. See exactly where you stand. A Chrome extension and web app that shows how your CV matches each requirement of a job ad, what an ATS would miss, and rehearses the interview with you. CV upload and the ATS view work today; the match engine is next.';

// The requirement list a lens slides over, shared by both layouts.
function report(theme, { left, right, top, gap, nameSize, stateSize, lensX, lensR, handle, hairWidth, dot }) {
  const { ink, text: body, muted, hair, accent, amber } = theme;
  const stateColour = { covered: accent, partial: amber, missing: muted };
  let rows = '';
  let keyframes = '';
  const travel = (REQUIREMENTS.length - 1) * gap;
  REQUIREMENTS.forEach(([name, state], i) => {
    const y = top + i * gap;
    rows += `<path d="M${left} ${y + gap * 0.32}H${right}" stroke="${hair}" stroke-width="${hairWidth}"/>`;
    rows += text(name, left, y, { font: 'sans', size: nameSize, fill: body });
    const w = measure(state, { size: stateSize, track: 0.04 });
    const colour = stateColour[state];
    const cx = right - w - dot * 3;
    const cy = y - stateSize * 0.34;
    const mark = state === 'covered'
      ? `<circle cx="${cx}" cy="${cy}" r="${dot}" fill="${colour}"/>`
      : state === 'partial'
        ? `<circle cx="${cx}" cy="${cy}" r="${dot * 0.86}" stroke="${colour}" stroke-width="${dot * 0.3}"/><path d="M${cx} ${cy - dot * 0.86}a${dot * 0.86} ${dot * 0.86} 0 0 1 0 ${dot * 1.72}Z" fill="${colour}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${dot * 0.86}" stroke="${colour}" stroke-width="${dot * 0.3}"/>`;
    rows += `<g class="state s${i}">${mark}${text(state, right, y, { size: stateSize, fill: colour, anchor: 'end', track: 0.04 })}</g>`;
    const at = 4 + (i / (REQUIREMENTS.length - 1)) * 62;
    keyframes += `.s${i} { animation: s${i} 13s linear infinite; } @keyframes s${i} { 0%, ${at.toFixed(1)}% { opacity: .14; } ${(at + 2.5).toFixed(1)}%, 88% { opacity: 1; } 96%, 100% { opacity: .14; } }\n`;
  });
  const cy = top - nameSize * 0.3;
  const reach = lensR * 0.72;
  const lens = `
<g class="lens motion">
  <circle cx="${lensX}" cy="${cy}" r="${lensR}" fill="${accent}" fill-opacity=".07"/>
  <circle cx="${lensX}" cy="${cy}" r="${lensR}" stroke="${ink}" stroke-width="${handle * 0.48}"/>
  <path d="M${lensX + reach} ${cy + reach}L${lensX + reach + lensR * 0.6} ${cy + reach + lensR * 0.6}" stroke="${ink}" stroke-width="${handle}" stroke-linecap="round"/>
</g>`;
  const css = `
.lens { animation: lens 13s cubic-bezier(.45,.05,.55,.95) infinite; }
@keyframes lens { 0% { transform: translateY(0); opacity: 0; } 3% { opacity: 1; } 68% { transform: translateY(${travel}px); opacity: 1; } 76%, 100% { transform: translateY(${travel}px); opacity: 0; } }
${keyframes}
@media (prefers-reduced-motion: reduce) { .state { opacity: 1 !important; } }
${common}`;
  return { svg: rows + lens, css };
}

export function drawRoleLens(theme) {
  const { ink, text: body, muted, hair, accent } = theme;
  const W = 1200;
  const H = 490;
  const left = 690;
  const right = W - 44;
  const { svg, css } = report(theme, { left, right, top: 124, gap: 56, nameSize: 22, stateSize: 17, lensX: left + 232, lensR: 50, handle: 5, hairWidth: 1.4, dot: 6.5 });

  const out = `
<rect x="8.5" y="5" width="${W - 17}" height="${H - 10}" rx="20" stroke="${hair}" stroke-width="1.5"/>
<circle cx="50.5" cy="60" r="6.5" fill="${accent}"/>
<circle class="pulse motion" cx="50.5" cy="60" r="6.5" stroke="${accent}" stroke-width="1.6"/>
${text('BUILDING NOW', 68, 66, { font: 'monoMedium', size: 18, fill: accent, track: 0.1 })}
${text('RoleLens', 42, 170, { font: 'serif', size: 116, fill: ink, track: -0.012 })}
${text('See exactly where you stand.', 44, 226, { font: 'italic', size: 42, fill: accent })}
${paragraph('A Chrome extension and web app. On the job ad you are reading, it shows how your CV matches each requirement, what an ATS would miss, then rehearses the interview with you.', 44, 280, 600, 32, { font: 'sans', size: 22.5, fill: body })}
${text('CV upload and the ATS view work today. Match engine next.', 44, 416, { font: 'sans', size: 20, fill: muted })}
${text('Spring Boot  /  React  /  TypeScript  /  PostgreSQL', 44, H - 30, { size: 17.5, fill: muted, track: 0.02 })}
${arrow(W - 66, 62, 20, muted, { up: true, width: 2 })}
${text('THE REPORT I AM BUILDING', left, 66, { size: 16, fill: muted, track: 0.1 })}
${svg}
`;
  return frame({ width: W, height: H, title: ROLELENS_TITLE, css, body: out, theme });
}

export function drawRoleLensMobile(theme) {
  const { ink, text: body, muted, hair, accent } = theme;
  const W = 700;
  const PAD = 32;
  const top = 650;
  const gap = 66;
  const { svg, css } = report(theme, { left: PAD, right: W - PAD, top, gap, nameSize: 29, stateSize: 23, lensX: 390, lensR: 54, handle: 6, hairWidth: 2, dot: 9 });
  const H = top + gap * 6 + 56;
  const out = `
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="30" stroke="${hair}" stroke-width="2.4"/>
<circle cx="${PAD + 8}" cy="56" r="8" fill="${accent}"/>
<circle class="pulse motion" cx="${PAD + 8}" cy="56" r="8" stroke="${accent}" stroke-width="2"/>
${text('BUILDING NOW', PAD + 28, 64, { font: 'monoMedium', size: 23, fill: accent, track: 0.08 })}
${arrow(W - PAD - 26, 66, 26, muted, { up: true, width: 3 })}
${text('RoleLens', PAD - 3, 206, { font: 'serif', size: 148, fill: ink, track: -0.012 })}
${text('See exactly where you stand.', PAD, 272, { font: 'italic', size: 53, fill: accent })}
${paragraph('A Chrome extension and web app. On the job ad you are reading, it shows how your CV matches each requirement, what an ATS would miss, then rehearses the interview with you.', PAD, 332, W - PAD * 2, 39, { font: 'sans', size: 28, fill: body })}
${text('CV upload and the ATS view work today.', PAD, 490, { font: 'sans', size: 25, fill: muted })}
${text('Match engine next.', PAD, 522, { font: 'sans', size: 25, fill: muted })}
${text('THE REPORT I AM BUILDING', PAD, 592, { size: 21, fill: muted, track: 0.08 })}
${svg}
${text('Spring Boot / React / TypeScript / PostgreSQL', PAD, H - 28, { size: 22, fill: muted })}
`;
  return frame({ width: W, height: H, title: ROLELENS_TITLE, css, body: out, theme });
}
