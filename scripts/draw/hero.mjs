// The hero: a mountain range whose every ridge comes from my GitHub contribution calendar.
// Horizontal axis = time. Depth = day of the week. Height = how much I shipped.
// Hidden lines are removed with the classic floating-horizon algorithm, so the
// drawing is pure strokes on a transparent background and suits any GitHub theme.
import { calm, frame, polyline, simplify, text } from '../lib/ink.mjs';

const MS_DAY = 86400000;

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 1-D value noise, repeatable from one run to the next.
function noise1d(seed, length) {
  const rand = mulberry(seed);
  const lattice = Array.from({ length }, () => rand() * 2 - 1);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = lattice[((i % length) + length) % length];
    const b = lattice[((i + 1) % length + length) % length];
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}

// Turns daily counts into the rows of a smoothed height field (one row per depth step).
function heightField(days, rowCount) {
  const start = Date.parse(days[0].date + 'T00:00:00Z');
  const weeks = Math.floor((Date.parse(days.at(-1).date + 'T00:00:00Z') - start) / MS_DAY / 7) + 1;
  const grid = Array.from({ length: weeks }, () => new Float64Array(7));
  for (const { date, count } of days) {
    const age = (Date.parse(date + 'T00:00:00Z') - start) / MS_DAY;
    grid[Math.floor(age / 7)][age % 7] = Math.sqrt(count);
  }

  const sigmaDay = 1.6;
  const sigmaWeek = 2.7;
  const reach = Math.ceil(sigmaWeek * 3);
  const kernel = Array.from({ length: reach * 2 + 1 }, (_, i) => Math.exp(-((i - reach) ** 2) / (2 * sigmaWeek ** 2)));

  const rows = [];
  for (let r = 0; r < rowCount; r++) {
    const depth = -2.6 + (r / (rowCount - 1)) * 11.2; // runs past Sunday and Saturday so the range closes on both sides
    const across = new Float64Array(weeks);
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) across[w] += grid[w][d] * Math.exp(-((depth - d) ** 2) / (2 * sigmaDay ** 2));
    }
    const smooth = new Float64Array(weeks);
    for (let w = 0; w < weeks; w++) {
      for (let k = -reach; k <= reach; k++) {
        const v = across[w + k];
        if (v) smooth[w] += v * kernel[k + reach];
      }
    }
    rows.push(smooth);
  }

  let peak = 0;
  for (const row of rows) for (const v of row) peak = Math.max(peak, v);
  for (const row of rows) for (let i = 0; i < row.length; i++) row[i] /= peak;

  const sample = (row, t) => {
    if (t < 0) return 0;
    const i = Math.min(Math.floor(t), row.length - 1);
    const j = Math.min(i + 1, row.length - 1);
    const f = t - i;
    const s = f * f * (3 - 2 * f);
    return row[i] * (1 - s) + row[j] * s;
  };
  return { rows, weeks, sample, start };
}

function terrain(days, theme, view) {
  const { width, step, rowCount, left, right, cx, scaleAt, baseAt, liftAt, widths } = view;
  const { rows, weeks, sample, start } = heightField(days, rowCount);

  const fine = noise1d(11, 512);
  const coarse = noise1d(29, 512);

  const buckets = new Map();
  const horizon = new Float64Array(Math.ceil(width / step) + 2).fill(Infinity);
  const toScreen = (t, z) => cx + (left + (t / (weeks - 1)) * (right - left) - cx) * scaleAt(z);

  for (let r = 0; r < rowCount; r++) {
    const z = r / (rowCount - 1);
    const row = rows[r];
    const scale = scaleAt(z);
    const base = baseAt(z);
    const lift = liftAt(z);
    const band = z < 0.34 ? 0 : z < 0.68 ? 1 : 2;

    let run = null;
    let runLevel = -1;
    const flush = () => {
      if (run && run.length > 1) {
        const key = `${runLevel}:${band}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(simplify(run, 0.24));
      }
      run = null;
    };

    for (let c = 0; c < horizon.length; c++) {
      const sx = c * step;
      const world = cx + (sx - cx) / scale;
      const t = ((world - left) / (right - left)) * (weeks - 1);
      if (t < 0 || t > weeks - 1) {
        flush();
        continue;
      }
      const shaped = Math.pow(sample(row, t), 0.92);
      const u = t * 1.6 + r * 7.3;
      const rock = fine(u) * 0.55 + fine(u * 2.3 + 40) * 0.3 + fine(u * 5.1 + 90) * 0.15;
      const swell = coarse(t * 0.09 + r * 0.21);
      const y = base - shaped * lift - rock * (0.8 + shaped * 13) - swell * (1.6 + (1 - z) * 1.4);

      if (y < horizon[c] - 0.3) {
        const level = Math.min(7, Math.floor(Math.pow(shaped, 0.74) * 8));
        const point = [sx, y];
        if (!run) {
          run = [point];
          runLevel = level;
        } else if (level !== runLevel) {
          run.push(point);
          flush();
          run = [point];
          runLevel = level;
        } else {
          run.push(point);
        }
        horizon[c] = y;
      } else {
        flush();
      }
    }
    flush();
  }

  const fade = [1, 0.82, 0.58];
  let paths = '';
  for (const [key, lines] of [...buckets].sort()) {
    const [level, band] = key.split(':').map(Number);
    paths += `<path d="${lines.map(polyline).join('')}" stroke="${theme.ramp[level]}" stroke-width="${widths[band]}" stroke-opacity="${fade[band]}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return { paths, toScreen, weeks, start };
}

const motionCss = (width) => `
.range { animation: sweep 3.4s cubic-bezier(.3,.65,.2,1) both; }
@keyframes sweep { from { clip-path: inset(-20% 100% -20% -2%); } to { clip-path: inset(-20% -2% -20% -2%); } }
.scan { opacity: 0; animation: scan 3.4s cubic-bezier(.3,.65,.2,1) both; }
@keyframes scan { 0% { transform: translateX(0); opacity: 0; } 6% { opacity: .9; } 86% { opacity: .75; } 100% { transform: translateX(${width}px); opacity: 0; } }
.ink { animation: rise 1s .1s cubic-bezier(.2,.7,.2,1) both; }
.note { animation: appear 1.2s 1.6s ease both; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes appear { from { opacity: 0; } to { opacity: 1; } }
.now { animation: appear .5s 3.2s ease both; }
.pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s 3.4s ease-out infinite; opacity: 0; }
@keyframes pulse { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(4.6); opacity: 0; } }
${calm}`;

const yearTick = (year, start) => (Date.UTC(year, 0, 1) - start) / MS_DAY / 7;
const TITLE = 'Youssef El Alami, full-stack software engineer. A line-drawn mountain range generated from his GitHub contribution history, rising from 2021 to today.';

export function drawHero({ days, stats, now }, theme) {
  const W = 1200;
  const H = 572;
  const baseAt = (z) => 496 - Math.pow(z, 1.12) * 122;
  const view = {
    width: W,
    step: 1.5,
    rowCount: 40,
    left: -30,
    right: W - 26,
    cx: W * 0.62,
    scaleAt: (z) => 1 - 0.13 * z,
    baseAt,
    liftAt: (z) => 372 * (1 - 0.3 * z),
    widths: [1.35, 1.1, 0.95],
  };
  const { paths, toScreen, weeks, start } = terrain(days, theme, view);
  const { ink, muted, faint, accent } = theme;
  const firstYear = days.find((d) => d.count > 0).date.slice(0, 4);

  // Time axis under the nearest ridge.
  const axisY = 514;
  let axis = '';
  for (let year = new Date(start).getUTCFullYear() + 1; year <= now.getUTCFullYear(); year++) {
    const x = toScreen(yearTick(year, start), 0);
    axis += `<path d="M${x.toFixed(1)} ${axisY - 9}v5" stroke="${faint}" stroke-width="1"/>`;
    axis += text(String(year), x, axisY + 12, { size: 14, fill: muted, anchor: 'middle', track: 0.04 });
  }

  // "Now": the end of the nearest row, where the next commit will land.
  const nowX = toScreen(weeks - 1, 0);
  const nowY = baseAt(0) + 2;
  axis += `<path d="M${nowX.toFixed(1)} ${nowY + 8}V${axisY - 4}" stroke="${accent}" stroke-width="1"/>`;
  axis += text('NOW', nowX, axisY + 12, { font: 'monoMedium', size: 14, fill: accent, anchor: 'end', track: 0.08 });

  const body = `
<g class="ink">
${text('Youssef', -2, 154, { font: 'serif', size: 158, fill: ink, track: -0.012 })}
${text('El Alami', -2, 288, { font: 'serif', size: 158, fill: ink, track: -0.012 })}
${text('FULL-STACK SOFTWARE ENGINEER', 2, 340, { font: 'monoMedium', size: 18, fill: accent, track: 0.16 })}
</g>
<g class="note">
${text('TOULOUSE, FRANCE', W - 2, 46, { size: 16, fill: muted, anchor: 'end', track: 0.14 })}
${text('43.60 N   1.44 E', W - 2, 70, { size: 15, fill: muted, anchor: 'end', track: 0.1 })}
</g>
<defs>
<linearGradient id="below" gradientUnits="userSpaceOnUse" x1="0" y1="348" x2="0" y2="392"><stop stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="beside" gradientUnits="userSpaceOnUse" x1="440" y1="0" x2="500" y2="0"><stop stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
<mask id="clear" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect y="0" width="500" height="392" fill="url(#below)"/><rect x="440" y="0" width="60" height="392" fill="url(#beside)"/></mask>
</defs>
<g mask="url(#clear)"><g class="range">${paths}</g></g>
<g class="note">${axis}
${text(`THIS RANGE IS MY COMMIT HISTORY. ${stats.contributions} CONTRIBUTIONS SINCE ${firstYear}, REDRAWN EVERY MONDAY.`, 2, 558, { size: 14, fill: muted, track: 0.08 })}
</g>
<g class="motion"><rect class="scan" x="0" y="96" width="2" height="412" fill="${accent}"/></g>
<circle class="now" cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="4" fill="${accent}"/>
<circle class="pulse motion" cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="4" stroke="${accent}" stroke-width="1.5"/>
`;

  return frame({ width: W, height: H, title: TITLE, css: motionCss(W), body, theme });
}

// Phone layout: larger type above a narrower range.
export function drawHeroMobile({ days, stats, now }, theme) {
  const W = 700;
  const H = 800;
  const baseAt = (z) => 708 - Math.pow(z, 1.12) * 92;
  const view = {
    width: W,
    step: 1.25,
    rowCount: 30,
    left: -18,
    right: W - 18,
    cx: W * 0.62,
    scaleAt: (z) => 1 - 0.13 * z,
    baseAt,
    liftAt: (z) => 300 * (1 - 0.3 * z),
    widths: [1.8, 1.5, 1.3],
  };
  const { paths, toScreen, weeks, start } = terrain(days, theme, view);
  const { ink, muted, faint, accent } = theme;
  const firstYear = days.find((d) => d.count > 0).date.slice(0, 4);

  const axisY = 730;
  let axis = '';
  for (let year = new Date(start).getUTCFullYear() + 1; year <= now.getUTCFullYear(); year++) {
    const x = toScreen(yearTick(year, start), 0);
    axis += `<path d="M${x.toFixed(1)} ${axisY - 9}v5" stroke="${faint}" stroke-width="1.4"/>`;
    axis += text(`'${String(year).slice(2)}`, x, axisY + 16, { size: 20, fill: muted, anchor: 'middle' });
  }
  const nowX = toScreen(weeks - 1, 0);
  const nowY = baseAt(0) + 2;
  axis += text('NOW', nowX, axisY + 16, { font: 'monoMedium', size: 20, fill: accent, anchor: 'end', track: 0.06 });

  const body = `
<g class="ink">
${text('Youssef', -2, 168, { font: 'serif', size: 186, fill: ink, track: -0.012 })}
${text('El Alami', -2, 322, { font: 'serif', size: 186, fill: ink, track: -0.012 })}
${text('FULL-STACK SOFTWARE ENGINEER', 2, 378, { font: 'monoMedium', size: 25, fill: accent, track: 0.1 })}
${text('TOULOUSE, FRANCE', 2, 414, { size: 22, fill: muted, track: 0.12 })}
</g>
<g class="range">${paths}</g>
<g class="note">${axis}
${text('THIS RANGE IS MY COMMIT HISTORY.', 2, 770, { size: 18, fill: muted, track: 0.05 })}
</g>
<g class="motion"><rect class="scan" x="0" y="400" width="2.4" height="324" fill="${accent}"/></g>
<circle class="now" cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="5" fill="${accent}"/>
<circle class="pulse motion" cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="5" stroke="${accent}" stroke-width="2"/>
`;
  return frame({ width: W, height: H, title: TITLE, css: motionCss(W), body, theme });
}
