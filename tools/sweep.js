// endRush 세기를 바꿔 가며 대역전극이 얼마나 나오는지 비교한다.
// 판마다 편차가 커서 40판으로는 구분이 안 됐다.
const fs = require('fs'), path = require('path'), Module = require('module');
const HTML = path.join(__dirname, '..', 'index.html');

function load(zone, str, thr) {
  let src = fs.readFileSync(HTML, 'utf8');
  src = src.replace(/worldH \* [\d.]+\)\) \/ \(worldH \* [\d.]+\)/,
                    `worldH * ${zone})) / (worldH * ${zone})`);
  src = src.replace(/\(0\.16 \+ endRush \* [\d.]+\)/, `(0.16 + endRush * ${str})`);
  src = src.replace(/if \(behind > \d+\) \{/, `if (behind > ${thr}) {`);
  src = src.replace(/var pull = Math\.min\(1, \(behind - \d+\) \/ 800\);/,
                    `var pull = Math.min(1, (behind - ${thr}) / 800);`);
  const tmp = path.join(__dirname, '_sweep.html');
  fs.writeFileSync(tmp, src);
  delete require.cache[require.resolve('./harness.js')];
  process.env.SWEEP_HTML = tmp;
  const hsrc = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8')
    .replace("path.join(__dirname, '..', 'index.html')", "process.env.SWEEP_HTML");
  const m = new Module('sw');
  m._compile(hsrc, path.join(__dirname, 'sw.js'));
  return m.exports;
}

const NAMES = Array.from({ length: 20 }, (_, i) => `${i + 1}번`);
const N = Number(process.argv[2] || 100);

function measure(h, len) {
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
    secs.push(f / 60); late += lc; if (lc === 0) dull++;
  }
  secs.sort((a, b) => a - b);
  return { fail, late: (late / N).toFixed(1), dull, sec: secs[Math.floor(secs.length / 2)].toFixed(0) };
}

const CFGS = [[0.32, 0.75, 200], [0.40, 1.05, 150], [0.40, 1.60, 150], [0.50, 2.20, 120]];
console.log(`각 ${N}판`);
for (const [z, st, th] of CFGS) {
  const h = load(z, st, th);
  const a = measure(h, 'mid'), b = measure(h, 'long');
  console.log(`구간${z} 세기${st} 문턱${th} | ` +
    `보통 교체${a.late} 밋밋${a.dull} ${a.sec}초 실패${a.fail} | ` +
    `길게 교체${b.late} 밋밋${b.dull} ${b.sec}초 실패${b.fail}`);
}
fs.unlinkSync(path.join(__dirname, '_sweep.html'));
