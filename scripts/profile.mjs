// The facts on the page. When life changes, edit this file and push: the Action redraws everything.
export const LOGIN = 'YoussefELALAMI';

// Each span is one row of the career trace.
// `live` keeps a span running up to today: remove it and add `to` when something ends.
export const spans = [
  { service: 'education', label: 'iut-longwy/dut', from: '2020-09', to: '2022-06', note: 'DUT, electrical engineering and industrial computing' },
  { service: 'education', label: 'dalarna/erasmus', depth: 1, from: '2022-01', to: '2022-04', note: 'Erasmus semester in Sweden' },
  { service: 'education', label: 'enseeiht/m-eng', from: '2022-09', to: '2025-09', note: 'M.Eng. software engineering' },
  { service: 'work', label: 'capgemini/airbus-pdm', depth: 1, from: '2024-06', to: '2025-10', note: 'Full-stack apprentice, Airbus product data' },
  { service: 'work', label: 'sopra-steria/aife-ppf', from: '2026-01', live: true, note: "Software engineer, France's national e-invoicing platform" },
  { service: 'project', label: 'plantagon', from: '2024-12-05', to: '2025-03-29', note: 'Plant monitoring on Raspberry Pi, team of four' },
  { service: 'project', label: 'guessmoji', from: '2025-05-30', to: '2025-08-07', note: 'AI emoji riddles: Flask, Angular, OpenAI' },
  { service: 'project', label: 'coding-challenges', from: '2025-08-10', live: true, note: '{problems} LeetCode problems, mostly in Java' },
  { service: 'project', label: 'hiretrack-ats', from: '2025-10-26', to: '2026-01-02', note: 'Recruitment backend: Spring Boot, JWT' },
  { service: 'project', label: 'observability-platform', from: '2026-02-18', to: '2026-04-05', note: 'Log ingestion API, early stage' },
  { service: 'project', label: 'role-lens', from: '2026-10-17', live: true, note: 'CV-to-job matching, building now' },
];
