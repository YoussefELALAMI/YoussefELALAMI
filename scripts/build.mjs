// Fetches live GitHub data and redraws everything in assets/.
//   npm ci && npm run build
// Any failed request stops the run before a file is written, so the page keeps its last good drawing.
import { mkdirSync, writeFileSync } from 'node:fs';
import { contributionDays, leetcodeProblems } from './lib/github.mjs';
import { adaptive, themes } from './lib/ink.mjs';
import { LOGIN, spans } from './profile.mjs';
import { drawHero, drawHeroMobile } from './draw/hero.mjs';
import { drawTrace, drawTraceMobile } from './draw/trace.mjs';
import { drawChallenges, drawGuessmoji, drawObservability, drawPlantagon, drawRoleLens, drawRoleLensMobile } from './draw/cards.mjs';
import { drawMap, drawMapMobile } from './draw/map.mjs';
import { drawButton, drawFooter, drawFooterMobile, drawHeading, drawHeadingMobile } from './draw/small.mjs';

const out = new URL('../assets/', import.meta.url);
mkdirSync(out, { recursive: true });

const now = new Date();
const calendar = await contributionDays(LOGIN, 2021, now);
const firstActive = calendar.findIndex((d) => d.count > 0);
const days = calendar.slice(Math.max(0, firstActive - 7 - new Date(calendar[firstActive].date).getUTCDay()));
const stats = { contributions: days.reduce((sum, d) => sum + d.count, 0) };
const problems = leetcodeProblems(LOGIN);
console.log(`${stats.contributions} contributions, ${problems.length} problems`);

const drawings = {
  hero: (t) => drawHero({ days, stats, now }, t),
  trace: (t) => drawTrace({ spans, problems, now }, t),
  'work-heading': (t) => drawHeading('Selected work', 'THE STATUS ON EACH CARD IS WHERE THE CODE REALLY IS TODAY', t),
  rolelens: (t) => drawRoleLens(t),
  guessmoji: (t) => drawGuessmoji(t),
  plantagon: (t) => drawPlantagon(t),
  observability: (t) => drawObservability(t),
  challenges: (t) => drawChallenges(problems, t),
  map: (t) => drawMap(t),
  footer: (t) => drawFooter({ days }, t),
  'button-linkedin': (t) => drawButton('LinkedIn', t),
  'button-email': (t) => drawButton('Email', t),
};

// Phone layouts: one adaptive file each, served by a plain max-width <source>.
const phone = {
  hero: () => drawHeroMobile({ days, stats, now }, adaptive),
  trace: () => drawTraceMobile({ spans, problems, now }, adaptive),
  'work-heading': () => drawHeadingMobile('Selected work', ['THE STATUS ON EACH CARD IS WHERE', 'THE CODE REALLY IS TODAY'], adaptive),
  rolelens: () => drawRoleLensMobile(adaptive),
  guessmoji: () => drawGuessmoji(adaptive, true),
  plantagon: () => drawPlantagon(adaptive, true),
  observability: () => drawObservability(adaptive, true),
  challenges: () => drawChallenges(problems, adaptive, true),
  map: () => drawMapMobile(adaptive),
  footer: () => drawFooterMobile({ days }, adaptive),
};

let total = 0;
const save = (file, svg) => {
  writeFileSync(new URL(file, out), svg);
  total += svg.length;
  return svg.length;
};
for (const [name, draw] of Object.entries(drawings)) {
  let size = 0;
  for (const theme of Object.values(themes)) size = save(`${name}-${theme.name}.svg`, draw(theme));
  const mobile = phone[name] ? save(`${name}-mobile.svg`, phone[name]()) : 0;
  console.log(name.padEnd(18), `${(size / 1024).toFixed(1).padStart(6)} KB`, mobile ? `  phone ${(mobile / 1024).toFixed(1)} KB` : '');
}
console.log(`total ${(total / 1024).toFixed(0)} KB`);
