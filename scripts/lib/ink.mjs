// Typography and palette shared by every drawing.
// Text is converted to outlines, because an SVG inside a GitHub <img> cannot load fonts.
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fontFile = (pkg, file) =>
  fileURLToPath(new URL(`../../node_modules/@fontsource/${pkg}/files/${file}.woff`, import.meta.url));

const load = (pkg, file) => {
  const bytes = readFileSync(fontFile(pkg, file));
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};

export const fonts = {
  serif: load('instrument-serif', 'instrument-serif-latin-400-normal'),
  italic: load('instrument-serif', 'instrument-serif-latin-400-italic'),
  sans: load('geist-sans', 'geist-sans-latin-400-normal'),
  sansMedium: load('geist-sans', 'geist-sans-latin-500-normal'),
  mono: load('geist-mono', 'geist-mono-latin-400-normal'),
  monoMedium: load('geist-mono', 'geist-mono-latin-500-normal'),
};

// The accent is international orange, the colour of flight recorders:
// the original observability hardware, and a nod to Toulouse and Airbus.
export const themes = {
  dark: {
    name: 'dark',
    ink: '#F2F4F7',
    text: '#C9D1D9',
    muted: '#8B949E',
    faint: '#484F58',
    hair: '#262C34',
    panel: '#161B22',
    accent: '#FF5A1F',
    amber: '#F5A524',
    cool: '#7C8DA5',
    coolDeep: '#4A5768',
    onBar: '#0D1117',
    page: '#0D1117',
    ramp: ['#2F3845', '#3B4656', '#55617A', '#A27A5A', '#E0853A', '#FF6B2B', '#FF4D0D', '#FFC2A0'],
  },
  light: {
    name: 'light',
    ink: '#14181D',
    text: '#2F363D',
    muted: '#59636E',
    faint: '#AEB7C2',
    hair: '#E3E7EC',
    panel: '#F6F8FA',
    accent: '#D13F0C',
    amber: '#A86400',
    cool: '#64748B',
    coolDeep: '#94A1B3',
    onBar: '#FFFFFF',
    page: '#FFFFFF',
    ramp: ['#DDE2E8', '#CDD4DC', '#AEB8C4', '#B9A48C', '#DD8743', '#EB5F1E', '#D13F0C', '#B5300A'],
  },
};

// Phone layouts share one file for both themes. GitHub leaves a plain max-width <source> alone,
// but rewrites any media query that mentions the colour scheme, so these images pick their own
// colours and bring their own background: always legible, whatever the visitor's settings.
const ROLES = ['ink', 'text', 'muted', 'faint', 'hair', 'panel', 'accent', 'amber', 'cool', 'coolDeep', 'onBar', 'page'];
const cssVars = (t) =>
  ROLES.map((r) => `--${r}:${t[r]};`).join('') + t.ramp.map((c, i) => `--r${i}:${c};`).join('');

export const adaptive = {
  name: 'adaptive',
  ...Object.fromEntries(ROLES.map((r) => [r, `var(--${r})`])),
  ramp: themes.dark.ramp.map((_, i) => `var(--r${i})`),
};
const adaptiveCss = `:root{${cssVars(themes.light)}} @media (prefers-color-scheme: dark){:root{${cssVars(themes.dark)}}}`;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function measure(str, { font = 'mono', size = 14, track = 0 } = {}) {
  return fonts[font].getAdvanceWidth(str, size, { kerning: true, letterSpacing: track });
}

// Each glyph is stored once per file and reused, which keeps label-heavy drawings small.
const glyphs = new Map();

function outline(glyph, font) {
  const join = (nums) => nums.map((n, i) => (i && n >= 0 ? ' ' : '') + n).join('');
  let d = '';
  let cx = 0;
  let cy = 0;
  for (const c of glyph.getPath(0, 0, font.unitsPerEm).commands) {
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    if (c.type === 'M') d += `M${join([x, y])}`;
    else if (c.type === 'L') d += `l${join([x - cx, y - cy])}`;
    else if (c.type === 'Q') d += `q${join([Math.round(c.x1) - cx, Math.round(c.y1) - cy, x - cx, y - cy])}`;
    else if (c.type === 'C') d += `c${join([Math.round(c.x1) - cx, Math.round(c.y1) - cy, Math.round(c.x2) - cx, Math.round(c.y2) - cy, x - cx, y - cy])}`;
    else if (c.type === 'Z') {
      d += 'z';
      continue;
    }
    cx = x;
    cy = y;
  }
  return d;
}

// One line of text, as outlines.
export function text(str, x, y, { font = 'mono', size = 14, fill, anchor = 'start', track = 0, opacity, attrs = '' } = {}) {
  const f = fonts[font];
  const width = measure(str, { font, size, track });
  const left = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
  const k = size / f.unitsPerEm;
  let uses = '';
  f.forEachGlyph(str, 0, 0, size, { kerning: true, letterSpacing: track }, (glyph, gx) => {
    const id = `${font}${glyph.index}`;
    if (!glyphs.has(id)) glyphs.set(id, outline(glyph, f));
    if (glyphs.get(id)) uses += `<use href="#${id}" x="${Math.round(gx / k)}"/>`;
  });
  const op = opacity == null ? '' : ` opacity="${opacity}"`;
  const round = (v) => Math.round(v * 100) / 100;
  return `<g transform="translate(${round(left)} ${round(y)})scale(${round(k * 1e5) / 1e5})" fill="${fill}"${op}${attrs ? ' ' + attrs : ''}>${uses}</g>`;
}

// A short arrow drawn by hand (the Latin font subsets have no arrow glyphs).
export function arrow(x, y, size, stroke, { up = false, width = 1.4 } = {}) {
  const s = size;
  const d = up
    ? `M${x} ${y}L${x + s} ${y - s}M${x + s * 0.28} ${y - s}H${x + s}V${y - s * 0.28}`
    : `M${x} ${y}H${x + s}M${x + s * 0.62} ${y - s * 0.38}L${x + s} ${y}L${x + s * 0.62} ${y + s * 0.38}`;
  return `<path d="${d}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function frame({ width, height, title, css = '', body, theme }) {
  const defs = [...glyphs].filter(([, d]) => d).map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('');
  glyphs.clear();
  const isAdaptive = theme?.name === 'adaptive';
  const style = (isAdaptive ? adaptiveCss + ' ' : '') + css.replace(/\s*\n\s*/g, ' ').trim();
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>` +
    (style ? `<style>${style}</style>` : '') +
    (defs ? `<defs>${defs}</defs>` : '') +
    (isAdaptive ? `<rect width="${width}" height="${height}" fill="${theme.page}"/>` : '') +
    body +
    `</svg>\n`
  );
}

// Everything that moves stops for visitors who asked for reduced motion.
export const calm = `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } .motion { display: none; } }`;

// Compact polyline encoder: absolute start, then relative steps rounded to 0.1.
export function polyline(points) {
  const r = (v) => Math.round(v * 10) / 10;
  const num = (v) => {
    const s = String(v);
    return s.replace(/^0\./, '.').replace(/^-0\./, '-.');
  };
  let [px, py] = [r(points[0][0]), r(points[0][1])];
  let d = `M${px} ${py}l`;
  let first = true;
  for (let i = 1; i < points.length; i++) {
    const x = r(points[i][0]);
    const y = r(points[i][1]);
    const dx = r(x - px);
    const dy = r(y - py);
    if (dx === 0 && dy === 0) continue;
    const a = num(dx);
    const b = num(dy);
    d += (first ? '' : a.startsWith('-') ? '' : ' ') + a + (b.startsWith('-') ? '' : ' ') + b;
    first = false;
    px = x;
    py = y;
  }
  return d;
}

// Ramer–Douglas–Peucker: keeps the shape of a line, drops the points it doesn't need.
export function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let worst = -1;
    let at = -1;
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs(dy * (points[i][0] - ax) - dx * (points[i][1] - ay)) / len;
      if (dist > worst) {
        worst = dist;
        at = i;
      }
    }
    if (worst > tolerance) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
