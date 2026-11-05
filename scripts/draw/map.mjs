// The stack as a service map: what I reach for, and how the pieces talk to each other.
import { calm, frame, text } from '../lib/ink.mjs';
import { icons } from '../lib/icons.mjs';

const TITLE = 'The stack as a service map. Client: React, Angular, TypeScript. Services: Java, Spring Boot, Python, Flask. Events and data: Kafka, Spark, OpenAI API. State: PostgreSQL, Redis, MinIO. Delivery: Git, GitLab CI, Jenkins, Docker, OpenShift, Argo CD. Tested with JUnit, Mockito, Cucumber, Testcontainers, Vitest, pytest.';

const PIPELINE = [
  ['git', 'Git'],
  ['gitlab', 'GitLab CI'],
  ['jenkins', 'Jenkins'],
  ['docker', 'Docker'],
  ['openshift', 'OpenShift'],
  ['argo', 'Argo CD'],
];

function logo(name, cx, cy, size, fill) {
  const k = size / 24;
  return `<path transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${k.toFixed(3)})" d="${icons[name].path}" fill="${fill}"/>`;
}

// Generic "model" mark for the LLM node.
const star = (cx, cy, s, fill) =>
  `<path d="M${cx} ${cy - s}C${cx + s * 0.16} ${cy - s * 0.3} ${cx + s * 0.3} ${cy - s * 0.16} ${cx + s} ${cy}C${cx + s * 0.3} ${cy + s * 0.16} ${cx + s * 0.16} ${cy + s * 0.3} ${cx} ${cy + s}C${cx - s * 0.16} ${cy + s * 0.3} ${cx - s * 0.3} ${cy + s * 0.16} ${cx - s} ${cy}C${cx - s * 0.3} ${cy - s * 0.16} ${cx - s * 0.16} ${cy - s * 0.3} ${cx} ${cy - s}Z" fill="${fill}"/>`;

const packet = (path, dur, begin, fill, r = 4.2) =>
  `<circle r="${r}" fill="${fill}"><animateMotion dur="${dur}s" begin="-${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;

export function drawMap(theme) {
  const { ink, text: body, muted, faint, hair, accent } = theme;
  const W = 1200;
  const H = 796;
  const X = { client: 54, services: 432, events: 782, state: 1136 };
  const Y = [242, 374, 506];

  const nodes = {
    react: { x: X.client, y: Y[0], icon: 'react', label: 'React', core: true },
    angular: { x: X.client, y: Y[1], icon: 'angular', label: 'Angular' },
    typescript: { x: X.client, y: Y[2], icon: 'typescript', label: 'TypeScript' },
    spring: { x: X.services, y: Y[0], r: 54, icon: 'spring', label: 'Spring Boot', core: true },
    flask: { x: X.services, y: Y[2], icon: 'flask', label: 'Flask' },
    kafka: { x: X.events, y: Y[0], r: 50, icon: 'kafka', label: 'Kafka', core: true },
    spark: { x: X.events, y: Y[1], icon: 'spark', label: 'Spark' },
    openai: { x: X.events, y: Y[2], icon: null, label: 'OpenAI API' },
    postgres: { x: X.state, y: Y[0], r: 50, icon: 'postgres', label: 'PostgreSQL', core: true },
    redis: { x: X.state, y: Y[1], icon: 'redis', label: 'Redis' },
    minio: { x: X.state, y: Y[2], icon: 'minio', label: 'MinIO' },
  };
  // The language each framework runs on sits beside it, like a sidecar.
  const sidecars = [
    { x: X.services + 92, y: Y[0] - 76, r: 28, icon: 'java', label: 'Java', core: true, host: 'spring' },
    { x: X.services + 62, y: Y[2] - 70, r: 26, icon: 'python', label: 'Python', host: 'flask' },
  ];

  let out = text('The stack, as a service map', 0, 72, { font: 'serif', size: 68, fill: ink, track: -0.008 });
  for (const [x, label] of [[X.client, 'CLIENT'], [X.services - 40, 'SERVICES'], [X.events, 'EVENTS AND DATA'], [X.state, 'STATE']]) {
    out += text(label, x, 138, { size: 16, fill: muted, anchor: 'middle', track: 0.14 });
  }

  const edge = (d, live) => `<path d="${d}" stroke="${live ? accent : faint}" stroke-opacity="${live ? 0.6 : 1}" stroke-width="1.8" stroke-linecap="round"/>`;
  const dotted = (d) => `<path d="${d}" stroke="${faint}" stroke-width="1.8" stroke-dasharray="2 7" stroke-linecap="round"/>`;

  // Busy routes carry traffic. Redis and MinIO share one trunk, which runs under Spark.
  const reactSpring = `M${X.client + 43} ${Y[0]}H${X.services - 63}`;
  const springKafka = `M${X.services + 63} ${Y[0]}H${X.events - 59}`;
  const kafkaPostgres = `M${X.events + 59} ${Y[0]}H${X.state - 59}`;
  const flaskOpenai = `M${X.services + 43} ${Y[2]}H${X.events - 43}`;
  const trunk = `M${X.services + 42} ${Y[0] + 42}C${X.services + 122} ${Y[1] + 24} ${X.services + 200} ${Y[1] + 84} ${X.events - 90} ${Y[1] + 84}H${X.events + 120}`;
  const toMinio = `${trunk}C${X.state - 120} ${Y[1] + 84} ${X.state - 76} ${Y[2] - 26} ${X.state - 38} ${Y[2] - 12}`;
  const toRedis = `${trunk}C${X.state - 120} ${Y[1] + 84} ${X.state - 82} ${Y[1] + 48} ${X.state - 37} ${Y[1] + 13}`;
  const angularSpring = `M${X.client + 40} ${Y[1] - 16}C${X.client + 150} ${Y[1] - 60} ${X.services - 150} ${Y[0] + 80} ${X.services - 52} ${Y[0] + 24}`;
  const angularFlask = `M${X.client + 40} ${Y[1] + 16}C${X.client + 150} ${Y[1] + 60} ${X.services - 150} ${Y[2] - 50} ${X.services - 42} ${Y[2] - 8}`;
  const sparkPostgres = `M${X.events + 39} ${Y[1] - 14}C${X.events + 130} ${Y[1] - 46} ${X.state - 120} ${Y[0] + 72} ${X.state - 44} ${Y[0] + 28}`;

  out += edge(reactSpring, true) + edge(springKafka, true) + edge(kafkaPostgres, true) + edge(flaskOpenai, true);
  out += edge(angularSpring, false) + edge(angularFlask, false) + edge(sparkPostgres, false);
  out += edge(toMinio, false) + edge(toRedis, false);
  out += dotted(`M${X.client} ${Y[0] + 74}V${Y[1] - 44}`) + dotted(`M${X.client} ${Y[1] + 72}V${Y[2] - 44}`);

  for (const n of Object.values(nodes)) {
    const r = n.r ?? 36;
    out += `<circle cx="${n.x}" cy="${n.y}" r="${r}" stroke="${n.core ? accent : faint}" stroke-width="${n.core ? 2.4 : 1.8}"/>`;
    const size = r * 1.04;
    out += n.icon ? logo(n.icon, n.x, n.y, size, n.core ? ink : body) : star(n.x, n.y, r * 0.52, body);
    out += text(n.label, n.x, n.y + r + 28, { size: 18, fill: n.core ? ink : body, anchor: 'middle' });
  }
  for (const s of sidecars) {
    const host = nodes[s.host];
    const hostR = host.r ?? 36;
    const angle = Math.atan2(s.y - host.y, s.x - host.x);
    const from = [host.x + Math.cos(angle) * (hostR + 5), host.y + Math.sin(angle) * (hostR + 5)];
    const to = [s.x - Math.cos(angle) * (s.r + 5), s.y - Math.sin(angle) * (s.r + 5)];
    out += dotted(`M${from[0].toFixed(1)} ${from[1].toFixed(1)}L${to[0].toFixed(1)} ${to[1].toFixed(1)}`);
    out += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" stroke="${s.core ? accent : faint}" stroke-width="${s.core ? 2.4 : 1.8}"/>`;
    out += logo(s.icon, s.x, s.y, s.r * 1.1, s.core ? ink : body);
    out += text(s.label, s.x + s.r + 12, s.y + 6, { size: 18, fill: s.core ? ink : body });
  }

  // Delivery: from a commit to a running service.
  const pipeY = 672;
  const startX = 32;
  const endX = 1160;
  const stepX = (endX - startX) / (PIPELINE.length - 1);
  out += text('DELIVERY', 2, pipeY - 56, { size: 16, fill: muted, track: 0.14 });
  out += `<path d="M${2 + 112} ${pipeY - 62}H${W - 2}" stroke="${hair}" stroke-width="1.4"/>`;
  let segments = '';
  PIPELINE.forEach(([icon, label], i) => {
    const x = startX + i * stepX;
    out += `<circle cx="${x}" cy="${pipeY}" r="30" stroke="${faint}" stroke-width="1.8"/>`;
    out += logo(icon, x, pipeY, 30, body);
    out += text(label, x, pipeY + 56, { size: 18, fill: body, anchor: 'middle' });
    if (i < PIPELINE.length - 1) {
      segments += `M${x + 37} ${pipeY}H${x + stepX - 37}`;
    }
  });
  out += `<path d="${segments}" stroke="${accent}" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>`;

  out += text('TESTED WITH  JUNIT  /  MOCKITO  /  CUCUMBER  /  TESTCONTAINERS  /  VITEST  /  PYTEST', W / 2, H - 14, { size: 16, fill: muted, anchor: 'middle', track: 0.08 });

  const packets = [
    [reactSpring, 2.4, 0], [reactSpring, 2.4, 1.2],
    [springKafka, 2.6, 0.4], [springKafka, 2.6, 1.7],
    [kafkaPostgres, 2.4, 0.8], [kafkaPostgres, 2.4, 2],
    [flaskOpenai, 2.8, 1], [flaskOpenai, 2.8, 2.4],
    [`M${startX + 37} ${pipeY}H${endX - 37}`, 7.5, 2],
  ].map(([path, dur, begin]) => packet(path, dur, begin, accent)).join('');
  out += `<g class="motion">${packets}</g>`;

  return frame({ width: W, height: H, title: TITLE, css: calm, body: out, theme });
}

// Phone layout: the same request path, top to bottom.
export function drawMapMobile(theme) {
  const { ink, text: body, muted, faint, hair, accent } = theme;
  const W = 700;
  const layers = [
    ['CLIENT', [['react', 'React', true], ['angular', 'Angular'], ['typescript', 'TypeScript']]],
    ['SERVICES', [['java', 'Java', true], ['spring', 'Spring Boot', true], ['python', 'Python'], ['flask', 'Flask']]],
    ['EVENTS AND DATA', [['kafka', 'Kafka', true], ['spark', 'Spark'], [null, 'OpenAI API']]],
    ['STATE', [['postgres', 'PostgreSQL', true], ['redis', 'Redis'], ['minio', 'MinIO']]],
  ];
  const delivery = [PIPELINE.slice(0, 3), PIPELINE.slice(3)];
  const R = 44;
  const LAYER = 214;
  let y = 150;
  let out = text('The stack, as a', 0, 66, { font: 'serif', size: 70, fill: ink, track: -0.008 });
  out += text('service map', 0, 130, { font: 'serif', size: 70, fill: ink, track: -0.008 });
  y = 192;

  const spine = W - 10;
  const nodesLeft = 2;
  const usable = spine - 40 - nodesLeft;
  let spinePath = '';

  layers.forEach(([name, items], layer) => {
    out += text(name, 2, y, { size: 22, fill: muted, track: 0.12 });
    const cy = y + 72;
    items.forEach(([icon, label, core], i) => {
      const cx = nodesLeft + usable * ((i + 0.5) / items.length);
      out += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${R}" stroke="${core ? accent : faint}" stroke-width="${core ? 3 : 2.2}"/>`;
      out += icon ? logo(icon, cx, cy, R * 1.06, core ? ink : body) : star(cx, cy, R * 0.54, body);
      out += text(label, cx, cy + R + 36, { size: label.length > 9 ? 22 : 24, fill: core ? ink : body, anchor: 'middle' });
    });
    if (layer < layers.length - 1) spinePath += `${layer ? '' : `M${spine} ${y + 20}`}V${y + LAYER + 20}`;
    out += `<circle cx="${spine}" cy="${y + 20}" r="6" fill="${accent}"/>`;
    y += LAYER;
  });
  out += `<path d="${spinePath}" stroke="${accent}" stroke-opacity=".6" stroke-width="2.4"/>`;
  const packets = packet(spinePath, 5, 0, accent, 6) + packet(spinePath, 5, 2.5, accent, 6);

  // Delivery
  y += 2;
  out += `<path d="M2 ${y - 40}H${W - 2}" stroke="${hair}" stroke-width="2"/>`;
  out += text('DELIVERY', 2, y, { size: 22, fill: muted, track: 0.12 });
  y += 62;
  for (const row of delivery) {
    row.forEach(([icon, label], i) => {
      const cx = nodesLeft + (W - 4) * ((i + 0.5) / row.length);
      out += `<circle cx="${cx.toFixed(1)}" cy="${y}" r="38" stroke="${faint}" stroke-width="2.2"/>`;
      out += logo(icon, cx, y, 38, body);
      out += text(label, cx, y + 68, { size: 24, fill: body, anchor: 'middle' });
    });
    y += 136;
  }
  out += text('TESTED WITH', W / 2, y - 18, { size: 21, fill: muted, anchor: 'middle', track: 0.12 });
  out += text('JUnit / Mockito / Cucumber', W / 2, y + 16, { size: 22, fill: body, anchor: 'middle' });
  out += text('Testcontainers / Vitest / pytest', W / 2, y + 48, { size: 22, fill: body, anchor: 'middle' });
  out += `<g class="motion">${packets}</g>`;

  return frame({ width: W, height: y + 72, title: TITLE, css: calm, body: out, theme });
}
