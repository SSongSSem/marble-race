// 맵 고르기가 생기면서 '한 종류만 켠 맵' 같은 극단적 조합이 가능해졌다.
// 트램펄린만 있는 맵처럼 구슬이 못 내려가는 경우가 없는지 종류별로 확인한다.
const h = require('./harness.js');
const NAMES = Array.from({ length: 20 }, (_, i) => `${i + 1}번`);
const MAX_FRAMES = 60 * 60 * 3;

function race() {
  h.buildMap(); h.setMarbles(NAMES); h.launch();
  const s = h.state();
  let f = 0;
  while (s.finished.length < NAMES.length && f < MAX_FRAMES) { h.step(1); f++; }
  return { done: s.finished.length === NAMES.length, sec: +(f / 60).toFixed(1) };
}

const N = Number(process.argv[2] || 8);
let bad = 0;
console.log(`구간 종류별 단독 맵 (각 ${N}판)`);
for (const k of h.KIND_ORDER) {
  h.setKinds([k]); h.setLen('mid');
  const rs = Array.from({ length: N }, race);
  const f = rs.filter(r => !r.done).length;
  const secs = rs.map(r => r.sec).sort((a, b) => a - b);
  bad += f;
  console.log(`  ${k.padEnd(9)} ${f ? '완주 실패 ' + f + '판  ← ' : '전부 완주  '}` +
              `${secs[0]}~${secs[secs.length - 1]}초`);
}

h.setKinds(h.KIND_ORDER.slice());
console.log('길이 설정');
for (const len of ['short', 'mid', 'long']) {
  h.setLen(len);
  const rs = Array.from({ length: N * 2 }, race);
  const f = rs.filter(r => !r.done).length;
  const secs = rs.map(r => r.sec).sort((a, b) => a - b);
  bad += f;
  console.log(`  ${len.padEnd(9)} ${f ? '완주 실패 ' + f + '판  ← ' : '전부 완주  '}` +
              `${secs[0]}~${secs[secs.length - 1]}초 (중앙 ${secs[Math.floor(secs.length / 2)]}초)`);
}
process.exit(bad ? 1 : 0);
