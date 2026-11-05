// Everything the drawings know about the outside world comes from here.
// A failed request throws, so a bad run never overwrites the artwork with empty data.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const token = () => {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
};

const headers = () => ({
  Authorization: `Bearer ${token()}`,
  'User-Agent': 'profile-telemetry',
  Accept: 'application/vnd.github+json',
});

async function graphql(query) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${json.errors[0].message}`);
  return json.data;
}

export async function contributionDays(login, fromYear, now) {
  const days = [];
  for (let year = fromYear; year <= now.getUTCFullYear(); year++) {
    const data = await graphql(`{
      user(login: "${login}") {
        contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
          contributionCalendar { weeks { contributionDays { date contributionCount } } }
        }
      }
    }`);
    for (const week of data.user.contributionsCollection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) days.push({ date: day.date, count: day.contributionCount });
    }
  }
  const unique = new Map(days.map((d) => [d.date, d]));
  const today = now.toISOString().slice(0, 10);
  return [...unique.values()].filter((d) => d.date <= today).sort((a, b) => (a.date < b.date ? -1 : 1));
}

// LeetHub writes one folder per problem, with the difficulty in its README.
export function leetcodeProblems(login) {
  const dir = mkdtempSync(join(tmpdir(), 'cc-'));
  try {
    execFileSync('git', ['clone', '--quiet', '--depth', '1', `https://github.com/${login}/coding-challenges`, dir]);
    const problems = [];
    for (const name of readdirSync(dir).sort()) {
      if (!/^\d{4}-/.test(name)) continue;
      const readme = join(dir, name, 'README.md');
      const body = existsSync(readme) ? readFileSync(readme, 'utf8') : '';
      const level = /<h3>(Easy|Medium|Hard)<\/h3>/.exec(body)?.[1] ?? 'Easy';
      problems.push({ name, level });
    }
    return problems;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
