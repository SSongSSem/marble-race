// 화면 없이 여러 판을 돌려 '모두 완주하는가'를 확인한다.
// 물리를 고칠 때마다 이걸 먼저 돌린다 — 구슬이 갇혀 레이스가 안 끝나는 사고가 잦았다.
const h = require('./harness.js');

const NAMES = Array.from({ length: 20 }, (_, i) => `${i + 1}번`);
const MAX_FRAMES = 60 * 60 * 3;                // 3분치 프레임이면 넉넉하다

function runRace() {
  h.buildMap();
  h.setMarbles(NAMES);
  h.launch();
  const s = h.state();
  let frames = 0;
  let maxStall = 0;
  // 선두가 바뀐 횟수. 초반 뒤엉킴은 흔하니 '후반부(코스 뒤 30%)'를 따로 센다 —
  // 사용자가 보고 싶어 하는 대역전극은 거의 이 구간에서 나온다.
  let leader = null, leadChanges = 0, lateChanges = 0;
  while (s.finished.length < NAMES.length && frames < MAX_FRAMES) {
    h.step(1);
    frames++;
    let best = null;
    for (const m of s.marbles) {
      if (m.finished) continue;
      if (m.stall > maxStall) maxStall = m.stall;
      if (!best || m.y > best.y) best = m;
    }
    // 결승 통과자가 나오기 전까지만 센다 (뒤에서는 순위가 이미 굳는다)
    if (best && s.finished.length === 0) {
      if (leader && best !== leader) {
        leadChanges++;
        if (best.y > s.finishY - s.worldH * 0.3) lateChanges++;
      }
      leader = best;
    }
  }
  return {
    done: s.finished.length === NAMES.length,
    frames,
    seconds: +(frames / 60).toFixed(1),
    winner: s.finished[0] ? s.finished[0].name : null,
    leadChanges,
    lateChanges,
    // 1등과 2등의 도착 간격 (프레임). 작을수록 아슬아슬했다는 뜻
    photo: s.finished.length > 1 ? true : false,
    maxStall: Math.round(maxStall),
    worldH: Math.round(s.worldH)
  };
}

const N = Number(process.argv[2] || 30);
const rs = [];
for (let i = 0; i < N; i++) rs.push(runRace());

const fail = rs.filter(r => !r.done);
const secs = rs.map(r => r.seconds).sort((a, b) => a - b);
const wins = {};
for (const r of rs) if (r.winner) wins[r.winner] = (wins[r.winner] || 0) + 1;

console.log(`${N}판`);
console.log(`  완주 실패        ${fail.length}판` + (fail.length ? '  ← 고쳐야 한다' : ''));
console.log(`  레이스 길이      최소 ${secs[0]}초 / 중앙 ${secs[Math.floor(N / 2)]}초 / 최대 ${secs[N - 1]}초`);
console.log(`  최장 정체        ${Math.max(...rs.map(r => r.maxStall))}프레임 (구조 발동은 420)`);
console.log(`  서로 다른 우승자 ${Object.keys(wins).length}명 / ${NAMES.length}명`);
const top = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
console.log(`  최다 우승        ${top[0]} ${top[1]}회`);
const avgLc = (rs.reduce((a, r) => a + r.leadChanges, 0) / N).toFixed(1);
const avgLate = (rs.reduce((a, r) => a + r.lateChanges, 0) / N).toFixed(1);
const dull = rs.filter(r => r.lateChanges === 0).length;
console.log(`  선두 교체        평균 ${avgLc}회`);
console.log(`  후반부 교체      평균 ${avgLate}회  ← 대역전극`);
console.log(`  막판 뒤집기 없음 ${dull}판 / ${N}판`);
process.exit(fail.length ? 1 : 0);
