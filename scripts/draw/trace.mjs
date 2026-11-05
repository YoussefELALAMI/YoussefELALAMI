// My career, drawn the way an APM tool draws a request: one root span, child spans, a waterfall.
import { createHash } from 'node:crypto';
import { calm, frame, measure, text } from '../lib/ink.mjs';

const W = 1200;
const LABEL_X = 2;
const CHART_X0 = 352;
const CHART_X1 = 1178;
const ROW = 42;
const AXIS_Y = 158;
const FIRST_ROW = 196;
const BAR = 20;

const date = (s) => {
  const [y, m = 1, d = 1] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

function resolve(spans, problems, now) {
  return spans.map((span) => ({
    ...span,
    from: date(span.from),
    to: span.live ? now.getTime() : date(span.to),
    note: span.note.replace('{problems}', problems.length),
  }));
}

function wrapLine(str, maxWidth, style) {
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

export function drawTrace({ spans, problems, now }, theme) {
  const { ink, text: body, muted, faint, hair, accent, amber, cool } = theme;
  const onBar = theme.onBar;
  const colour = { education: cool, work: accent, project: amber };

  const rows = resolve(spans, problems, now);

  const start = Math.min(...rows.map((r) => r.from));
  const end = now.getTime();
  const X = (t) => CHART_X0 + ((t - start) / (end - start)) * (CHART_X1 - CHART_X0);
  const months = Math.round((end - start) / (30.44 * 86400000));
  const duration = `${Math.floor(months / 12)}Y ${months % 12}MO`;
  const height = FIRST_ROW + (rows.length + 1) * ROW + 6;

  // Header
  const traceId = createHash('sha1').update('youssef-el-alami').digest('hex').slice(0, 8).toUpperCase();
  let out = text('Career, as a distributed trace', LABEL_X, 72, { font: 'serif', size: 68, fill: ink, track: -0.008 });
  out += text(`TRACE ${traceId}   SPANS ${rows.length + 1}   ERRORS 0   ${duration} AND COUNTING`, LABEL_X, 114, { size: 16.5, fill: muted, track: 0.08 });

  // Legend
  let legendX = CHART_X1;
  for (const [key, name] of [['project', 'SIDE PROJECTS'], ['work', 'WORK'], ['education', 'EDUCATION']]) {
    const w = measure(name, { size: 16.5, track: 0.08 });
    out += text(name, legendX - w, 114, { size: 16.5, fill: muted, track: 0.08 });
    out += `<rect x="${(legendX - w - 21).toFixed(1)}" y="101" width="13" height="13" rx="3" fill="${colour[key]}"/>`;
    legendX -= w + 45;
  }

  // Time axis
  const firstYear = new Date(start).getUTCFullYear() + 1;
  for (let y = firstYear; y <= now.getUTCFullYear(); y++) {
    const x = X(Date.UTC(y, 0, 1));
    out += `<path d="M${x.toFixed(1)} ${AXIS_Y + 9}V${height - 8}" stroke="${hair}" stroke-width="1.4"/>`;
    out += text(String(y), x, AXIS_Y, { size: 16.5, fill: muted, anchor: 'middle', track: 0.05 });
  }
  out += text('NOW', CHART_X1, AXIS_Y, { font: 'monoMedium', size: 16.5, fill: accent, anchor: 'end', track: 0.08 });
  out += `<path d="M${CHART_X1} ${AXIS_Y + 9}V${height - 8}" stroke="${accent}" stroke-width="1.4" stroke-dasharray="3 6" stroke-linecap="round"/>`;

  // Root span
  const rootY = FIRST_ROW;
  out += text('youssef-el-alami', LABEL_X, rootY + 6, { font: 'monoMedium', size: 20, fill: ink });
  out += `<rect x="${CHART_X0}" y="${rootY - 2}" width="${CHART_X1 - CHART_X0}" height="4" rx="2" fill="${faint}"/>`;

  // Tree trunk
  const treeX = LABEL_X + 7;
  const lastTop = rows.reduce((last, r, i) => (r.depth ? last : i), 0);
  out += `<path d="M${treeX} ${rootY + 15}V${FIRST_ROW + (lastTop + 1) * ROW}" stroke="${faint}" stroke-width="1.4"/>`;

  rows.forEach((row, i) => {
    const y = FIRST_ROW + (i + 1) * ROW;
    const depth = row.depth ?? 0;
    const labelX = LABEL_X + 25 + depth * 24;

    // Tree branch
    if (depth) {
      out += `<path d="M${treeX + 22} ${y - 26}V${y - 6}H${labelX - 6}" stroke="${faint}" stroke-width="1.4"/>`;
    } else {
      out += `<path d="M${treeX} ${y - 6}H${labelX - 6}" stroke="${faint}" stroke-width="1.4"/>`;
    }
    out += text(row.label, labelX, y, { size: 20, fill: row.service === 'work' ? ink : body });

    // Bar
    const x = X(row.from);
    const width = Math.max(7, X(row.to) - x);
    const delay = (0.1 + i * 0.11).toFixed(2);
    const barTop = y - BAR + 4;
    out += `<rect class="bar" style="animation-delay:${delay}s" x="${x.toFixed(1)}" y="${barTop}" width="${width.toFixed(1)}" height="${BAR}" rx="4" fill="${colour[row.service]}"/>`;

    // Note: inside the bar when it fits, otherwise beside it, always within the chart
    const size = 17;
    const noteW = measure(row.note, { size });
    const fadeIn = `class="note" style="animation-delay:${(0.45 + i * 0.11).toFixed(2)}s"`;
    const colourNote = row.service === 'work' ? body : muted;
    if (noteW + 22 <= width) {
      out += text(row.note, x + 11, y, { size, fill: onBar, attrs: fadeIn });
    } else if (x + width + 12 + noteW <= CHART_X1 - 6) {
      out += text(row.note, x + width + 12, y, { size, fill: colourNote, attrs: fadeIn });
    } else {
      out += text(row.note, x - 12, y, { size, fill: colourNote, anchor: 'end', attrs: fadeIn });
    }

    // A span that is still open keeps pulsing
    if (row.live) {
      const capX = (x + width).toFixed(1);
      const capY = barTop + BAR / 2;
      out += `<circle class="pulse motion" cx="${capX}" cy="${capY}" r="6" stroke="${colour[row.service]}" stroke-width="2" style="animation-delay:${(i % 3) * 0.7}s"/>`;
    }
  });

  // A slow sweep along the time axis, so the chart feels live wherever you scroll to it
  out += `<rect class="sweep motion" x="${CHART_X0}" y="${AXIS_Y + 9}" width="1.6" height="${height - AXIS_Y - 17}" fill="${accent}"/>`;

  const css = `
.bar { transform-box: fill-box; transform-origin: left center; animation: grow .8s cubic-bezier(.2,.75,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.note { animation: appear .6s ease both; }
@keyframes appear { from { opacity: 0; } to { opacity: 1; } }
.pulse { transform-box: fill-box; transform-origin: center; opacity: 0; animation: pulse 2.6s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(.8); opacity: .9; } 100% { transform: scale(2.8); opacity: 0; } }
.sweep { opacity: 0; animation: sweep 11s 2.2s cubic-bezier(.45,.05,.55,.95) infinite; }
@keyframes sweep { 0% { transform: translateX(0); opacity: 0; } 4% { opacity: .55; } 44% { opacity: .55; } 48%, 100% { transform: translateX(${CHART_X1 - CHART_X0}px); opacity: 0; } }
${calm}`;

  const alt = rows.map((r) => `${r.label}: ${r.note}`).join('; ');
  return frame({ width: W, height, title: `Career timeline drawn as a distributed trace. ${alt}.`, css, body: out, theme });
}

// Phone layout: one span per block, with the label, the bar and the note on their own lines.
export function drawTraceMobile({ spans, problems, now }, theme) {
  const { ink, text: body, muted, hair, accent, amber, cool } = theme;
  const colour = { education: cool, work: accent, project: amber };
  const W = 700;
  const LEFT = 2;
  const RIGHT = W - 16;

  const rows = resolve(spans, problems, now);
  const start = Math.min(...rows.map((r) => r.from));
  const end = now.getTime();
  const X = (t) => LEFT + ((t - start) / (end - start)) * (RIGHT - LEFT);
  const months = Math.round((end - start) / (30.44 * 86400000));

  let out = text('Career, as a', 0, 66, { font: 'serif', size: 70, fill: ink, track: -0.008 });
  out += text('distributed trace', 0, 130, { font: 'serif', size: 70, fill: ink, track: -0.008 });
  out += text(`SPANS ${rows.length + 1}  ERRORS 0  ${Math.floor(months / 12)}Y ${months % 12}MO AND COUNTING`, LEFT, 176, { size: 21, fill: muted, track: 0.06 });

  let lx = LEFT;
  for (const [key, name] of [['education', 'EDUCATION'], ['work', 'WORK'], ['project', 'SIDE PROJECTS']]) {
    out += `<rect x="${lx}" y="196" width="17" height="17" rx="4" fill="${colour[key]}"/>`;
    out += text(name, lx + 26, 212, { size: 20, fill: muted, track: 0.06 });
    lx += 26 + measure(name, { size: 20, track: 0.06 }) + 30;
  }

  const firstYear = new Date(start).getUTCFullYear() + 1;
  let ticks = '';
  for (let y = firstYear; y <= now.getUTCFullYear(); y++) {
    out += text(`'${String(y).slice(2)}`, X(Date.UTC(y, 0, 1)), 262, { size: 20, fill: muted, anchor: 'middle' });
    ticks += `M${X(Date.UTC(y, 0, 1)).toFixed(1)} {T}v20`;
  }
  out += text('NOW', RIGHT, 262, { font: 'monoMedium', size: 20, fill: accent, anchor: 'end', track: 0.04 });

  let y = 306;
  rows.forEach((row, i) => {
    const indent = (row.depth ?? 0) * 26;
    if (indent) out += `<path d="M${LEFT + 6} ${y - 24}V${y - 7}H${LEFT + indent - 6}" stroke="${muted}" stroke-width="2"/>`;
    out += text(row.label, LEFT + indent, y, { size: 26, fill: row.service === 'work' ? ink : body });
    const trackY = y + 14;
    out += `<path d="M${LEFT} ${trackY + 10}H${RIGHT}" stroke="${hair}" stroke-width="2"/>`;
    out += `<path d="${ticks.replaceAll('{T}', trackY)}" stroke="${hair}" stroke-width="2"/>`;
    const x = X(row.from);
    const width = Math.max(10, X(row.to) - x);
    out += `<rect class="bar" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s" x="${x.toFixed(1)}" y="${trackY}" width="${width.toFixed(1)}" height="20" rx="4" fill="${colour[row.service]}"/>`;
    if (row.live) {
      out += `<circle class="pulse motion" cx="${(x + width).toFixed(1)}" cy="${trackY + 10}" r="7" stroke="${colour[row.service]}" stroke-width="2.4" style="animation-delay:${(i % 3) * 0.7}s"/>`;
    }
    const lines = wrapLine(row.note, RIGHT - LEFT, { font: 'sans', size: 25 });
    lines.forEach((line, n) => {
      out += text(line, LEFT, y + 68 + n * 32, { font: 'sans', size: 25, fill: row.service === 'work' ? body : muted });
    });
    y += 68 + (lines.length - 1) * 32 + 66;
  });

  const css = `
.bar { transform-box: fill-box; transform-origin: left center; animation: grow .8s cubic-bezier(.2,.75,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.pulse { transform-box: fill-box; transform-origin: center; opacity: 0; animation: pulse 2.6s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(.8); opacity: .9; } 100% { transform: scale(2.6); opacity: 0; } }
${calm}`;
  const alt = rows.map((r) => `${r.label}: ${r.note}`).join('; ');
  return frame({ width: W, height: y - 36, title: `Career timeline drawn as a distributed trace. ${alt}.`, css, body: out, theme });
}
