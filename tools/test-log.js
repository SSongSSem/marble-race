// 스킬이 터질 때 기록(logSkill)까지 실제로 불리는지 확인한다.
// DOM 스텁이 전부 삼켜 버려서 눈에 안 보이므로, skilllog 요소만 진짜로 기록하는
// 물건으로 바꿔치기해서 몇 건이 쌓이는지 센다.
const rows = [];
const recorder = {
  children: { get length() { return rows.length; } },
  firstChild: null, lastChild: null,
  insertBefore(node) { rows.push(node.__text || '?'); return node; },
  removeChild() {},
  set innerHTML(v) { rows.length = 0; },
  get innerHTML() { return ''; }
};

const path = require('path');
const Module = require('module');
const fs = require('fs');

// harness 를 그대로 쓰되, getElementById('skilllog') 만 가로챈다
const harnessSrc = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8')
  .replace("getElementById: () => sink,", `getElementById: (id) => {
    if (id === 'skilllog') return global.__logbox;
    return sink;
  },`)
  .replace("createElement: () => sink,", `createElement: () => {
    var el = {
      __text: '', className: '', title: '', style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute() {}, removeAttribute() {}, addEventListener() {},
      appendChild() {}, removeChild() {}, remove() {},
      querySelector(sel) {
        var self = el;
        return { set textContent(v) { if (sel === '.who') self.__text = v; },
                 get textContent() { return ''; }, style: {} };
      },
      set innerHTML(v) {}, get innerHTML() { return ''; },
      set textContent(v) {}, get textContent() { return ''; }
    };
    return el;
  },`);
global.__logbox = recorder;
const m = new Module('h2');
m._compile(harnessSrc, path.join(__dirname, 'harness2.js'));
const h = m.exports;

const NAMES = Array.from({ length: 20 }, (_, i) => `${i + 1}번`);
const map = {};
h.SKILLS.forEach((sk, i) => { map[NAMES[i]] = [sk.id]; });
h.setSkillMap(map);
h.setSkillMode(true);

let races = 0, total = 0;
for (let r = 0; r < 12; r++) {
  rows.length = 0;
  h.buildMap(); h.setMarbles(NAMES); h.launch();
  const s = h.state();
  let f = 0;
  while (s.finished.length < NAMES.length && f < 10800) { h.step(1); f++; }
  races++; total += rows.length;
  if (r === 0) console.log('  첫 판 기록 예시:', rows.slice(0, 6).join(' / ') || '(없음)');
}
console.log(`${races}판에서 기록된 스킬 발동 ${total}건 (판당 평균 ${(total / races).toFixed(1)}건)`);
process.exit(total > 0 ? 0 : 1);
