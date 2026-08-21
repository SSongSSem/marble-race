// '대역전극'이 실제로 늘었는지 잰다. 선두가 코스 뒤 30% 안에서 바뀐 횟수를 센다.
const h = require('./harness.js');
const NAMES = Array.from({ length: 20 }, (_, i) => `${i + 1}번`);
const N = Number(process.argv[2] || 40);

for (const len of ['mid', 'long']) {
  h.setLen(len);
  let late = 0, dull = 0, fail = 0, secs = [];
  for (let r = 0; r < N; r++) {
    h.buildMap(); h.setMarbles(NAMES); h.launch();
    const s = h.state();
    let f = 0, leader = null, lc = 0;
    while (s.finished.length < NAMES.length && f < 10800) {
      h.step(1); f++;
      let best = null;
      for (const m of s.marbles) { if (m.finished) continue; if (!best || m.y > best.y) best = m; }
      if (best && s.finished.length === 0) {
        if (leader && best !== leader && best.y > s.finishY - s.worldH * 0.3) lc++;
        leader = best;
      }
    }
    if (s.finished.length < NAMES.length) { fail++; continue; }
    secs.push(f / 60);
    late += lc;
    if (lc === 0) dull++;
  }
  secs.sort((a, b) => a - b);
  console.log(`${len.padEnd(5)} 완주실패 ${fail}판 | 후반부 교체 평균 ${(late / N).toFixed(1)}회 | ` +
              `막판 뒤집기 없음 ${dull}/${N}판 | 길이 중앙 ${secs[Math.floor(secs.length / 2)].toFixed(1)}초`);
}
