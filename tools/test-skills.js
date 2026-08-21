// 스킬이 실제로 유리하게 작동하는지, 그리고 스킬을 켜도 완주가 깨지지 않는지 본다.
// 스킬 없는 구슬의 평균 등수는 정의상 중앙(10.5위) 근처여야 하고,
// 스킬 붙은 구슬은 그보다 앞이어야 한다.
const h = require('./harness.js');

const NAMES = Array.from({ length: 20 }, (_, i) => `${i + 1}번`);
const MAX_FRAMES = 60 * 60 * 3;

// 1~6번에게 스킬을 하나씩. 나머지 14명은 맨몸.
const map = {};
h.SKILLS.forEach((sk, i) => { map[NAMES[i]] = [sk.id]; });
h.setSkillMap(map);
h.setSkillMode(true);

const N = Number(process.argv[2] || 200);
const sum = {}, wins = {};
NAMES.forEach(n => { sum[n] = 0; wins[n] = 0; });
let fail = 0;

for (let r = 0; r < N; r++) {
  h.buildMap();
  h.setMarbles(NAMES);
  h.launch();
  const s = h.state();
  let f = 0;
  while (s.finished.length < NAMES.length && f < MAX_FRAMES) { h.step(1); f++; }
  if (s.finished.length < NAMES.length) { fail++; continue; }
  s.finished.forEach((m, i) => { sum[m.name] += i + 1; });
  wins[s.finished[0].name]++;
}

const done = N - fail;
console.log(`${N}판 (완주 실패 ${fail}판)`);
console.log('  스킬 붙은 구슬 — 평균 등수 / 우승');
h.SKILLS.forEach((sk, i) => {
  const n = NAMES[i];
  console.log(`    ${sk.name.padEnd(3)} ${n.padEnd(4)}  ${(sum[n] / done).toFixed(2)}위  ${wins[n]}회`);
});
const plain = NAMES.slice(h.SKILLS.length);
const pAvg = plain.reduce((a, n) => a + sum[n] / done, 0) / plain.length;
const pWin = plain.reduce((a, n) => a + wins[n], 0);
console.log(`  맨몸 ${plain.length}명           ${pAvg.toFixed(2)}위  ${pWin}회 (평균 ${(pWin / plain.length).toFixed(1)}회)`);
process.exit(fail ? 1 : 0);
