// The small pieces: section headings, contact buttons, and the closing line.
import { arrow, calm, frame, measure, polyline, simplify, text } from '../lib/ink.mjs';

export function drawHeading(title, sub, theme) {
  const { ink, muted } = theme;
  const body = text(title, 0, 72, { font: 'serif', size: 68, fill: ink, track: -0.008 }) +
    (sub ? text(sub, 2, 112, { size: 16.5, fill: muted, track: 0.08 }) : '');
  return frame({ width: 1200, height: sub ? 132 : 96, title, body, theme });
}

export function drawHeadingMobile(title, subLines, theme) {
  const { ink, muted } = theme;
  let body = text(title, 0, 78, { font: 'serif', size: 84, fill: ink, track: -0.008 });
  subLines.forEach((line, i) => {
    body += text(line, 2, 126 + i * 30, { size: 21, fill: muted, track: 0.06 });
  });
  return frame({ width: 700, height: 126 + subLines.length * 30 - 2, title, body, theme });
}

export function drawButton(label, theme) {
  const { ink, faint, accent } = theme;
  const size = 40;
  const w = Math.round(measure(label, { font: 'serif', size }) + 118);
  const h = 92;
  const body = `
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${(h - 3) / 2}" stroke="${faint}" stroke-width="3"/>
${text(label, 42, 60, { font: 'serif', size, fill: ink })}
${arrow(w - 58, 58, 20, accent, { up: true, width: 3 })}`;
  return frame({ width: w, height: h, title: label, body, theme });
}

// The closing line: the last twelve months as a single ridge, ending where the next commit will go.
function lastYearLine(days, width, height, left) {
  const year = days.slice(-371);
  const raw = year.map((d) => Math.sqrt(d.count));
  const sigma = 3.2;
  const reach = Math.ceil(sigma * 3);
  const smooth = raw.map((_, i) => {
    let sum = 0;
    for (let k = -reach; k <= reach; k++) {
      const v = raw[i + k];
      if (v) sum += v * Math.exp(-(k * k) / (2 * sigma * sigma));
    }
    return sum;
  });
  const peak = Math.max(...smooth, 1);
  return smooth.map((v, i) => [left + (i / (smooth.length - 1)) * width, height - (v / peak) * (height - 16)]);
}

const footerCss = `
.pulse { transform-box: fill-box; transform-origin: center; opacity: 0; animation: pulse 2.6s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(.9); opacity: .9; } 100% { transform: scale(3.2); opacity: 0; } }
${calm}`;

export function drawFooter({ days }, theme) {
  const { ink, muted, faint, accent } = theme;
  const W = 1200;
  const H = 214;
  const points = lastYearLine(days, W - 24, 86, 2);
  const end = points.at(-1);
  const body = `
<path d="${polyline(simplify(points, 0.12))}" stroke="${faint}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="5.5" fill="${accent}"/>
<circle class="pulse motion" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="5.5" stroke="${accent}" stroke-width="1.8"/>
${text('Read this far? Say hello.', W / 2, 166, { font: 'serif', size: 68, fill: ink, anchor: 'middle', track: -0.008 })}
${text('MY LAST TWELVE MONTHS, AS ONE LINE', W / 2, 204, { size: 15, fill: muted, anchor: 'middle', track: 0.12 })}
`;
  return frame({ width: W, height: H, title: 'Read this far? Say hello.', css: footerCss, body, theme });
}

export function drawFooterMobile({ days }, theme) {
  const { ink, muted, faint, accent } = theme;
  const W = 700;
  const H = 320;
  const points = lastYearLine(days, W - 26, 92, 2);
  const end = points.at(-1);
  const body = `
<path d="${polyline(simplify(points, 0.12))}" stroke="${faint}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="7" fill="${accent}"/>
<circle class="pulse motion" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="7" stroke="${accent}" stroke-width="2.4"/>
${text('Read this far?', W / 2, 186, { font: 'serif', size: 84, fill: ink, anchor: 'middle', track: -0.008 })}
${text('Say hello.', W / 2, 266, { font: 'serif', size: 84, fill: ink, anchor: 'middle', track: -0.008 })}
${text('MY LAST TWELVE MONTHS, AS ONE LINE', W / 2, 308, { size: 20, fill: muted, anchor: 'middle', track: 0.06 })}
`;
  return frame({ width: W, height: H, title: 'Read this far? Say hello.', css: footerCss, body, theme });
}
