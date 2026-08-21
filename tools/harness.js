// index.html 의 시뮬레이션을 브라우저 없이 돌리는 하네스.
// 물리를 고치면 구슬이 완주하지 못하는 사고가 나기 쉬워서, 화면 없이 여러 판을
// 빠르게 돌려 확인하려고 만들었다. DOM·오디오·rAF 는 전부 흡수용 스텁으로 대신한다.
const fs = require('fs');
const path = require('path');
const Module = require('module');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let src = blocks[blocks.length - 1];          // 앱 본체는 마지막 script

// 무엇을 하든 삼켜 버리는 프록시. querySelector 결과·캔버스 컨텍스트에 두루 쓴다.
const sink = new Proxy(function () {}, {
  get: (t, k) => {
    if (k === 'length') return 0;
    if (k === 'style' || k === 'dataset') return {};
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains: () => false };
    if (k === 'children' || k === 'options') return [];
    if (k === 'textContent' || k === 'innerHTML' || k === 'value') return t.__v || '';
    if (k === Symbol.toPrimitive) return () => '';
    if (k === 'then') return undefined;        // await 로 오인되지 않게
    return sink;
  },
  set: (t, k, v) => { t.__v = v; return true; },
  apply: () => sink,
  construct: () => sink
});

global.window = new Proxy({}, { get: (t, k) => (k in t ? t[k] : sink), set: (t, k, v) => (t[k] = v, true) });
global.document = {
  getElementById: () => sink, querySelector: () => sink, querySelectorAll: () => [],
  createElement: () => sink, addEventListener() {}, removeEventListener() {},
  body: sink, head: sink, documentElement: sink
};
global.localStorage = {
  _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; }
};
global.navigator = { clipboard: { writeText: async () => {} }, userAgent: 'node' };
global.location = { href: 'https://example.invalid/', search: '', hash: '' };
global.requestAnimationFrame = () => 0;        // loop() 이 스스로 돌지 않게
global.cancelAnimationFrame = () => {};
global.setTimeout = () => 0; global.setInterval = () => 0;
global.clearTimeout = () => {}; global.clearInterval = () => {};
global.AudioContext = function () { return sink; };
global.webkitAudioContext = global.AudioContext;
global.matchMedia = () => ({ matches: false, addEventListener() {} });
global.innerWidth = 1280; global.innerHeight = 800; global.devicePixelRatio = 1;
global.Image = function () { return sink; };
global.URL = { createObjectURL: () => '', revokeObjectURL() {} };
global.Blob = function () {};
global.alert = () => {}; global.confirm = () => true; global.prompt = () => null;

// 마지막 초기화 호출을 걷어 내고, 대신 테스트용 진입점을 IIFE 안에 심는다.
src = src.replace(/\n\s*buildMap\(\);\s*\n\s*load\(\);[\s\S]*?loop\(\);\s*\n/, '\n');
src = src.replace(/\}\)\(\);\s*$/, `
  // ── 하네스 전용 ────────────────────────────────────────────
  module.exports = {
    W: W, LOBBY_FLOOR_Y: LOBBY_FLOOR_Y,
    buildMap: buildMap,
    setSkillMode: function (v) { skillMode = v; },
    KIND_ORDER: KIND_ORDER,
    setKinds: function (list) {
      KIND_ORDER.forEach(function (k) { kindsOn[k] = list.indexOf(k) >= 0; });
    },
    setLen: function (v) { mapLen = v; },
    setSkillMap: function (o) { skillMap = o; },
    SKILLS: SKILLS,
    step: step,
    setMarbles: function (names) {
      marbles = names.map(function (n, i) {
        return { name: n, color: COLORS[i % COLORS.length], x: 0, y: 0, vx: 0, vy: 0,
                 r: 9, finished: false, still: 0, bestY: -9999, stall: 0,
                 trail: [], hit: 0, hx: 0, hy: 0, boost: 0 };
      });
      return marbles;
    },
    // startRace() 의 카운트다운을 뺀 판. 곧바로 달리는 상태로 만든다.
    launch: function () {
      finishedList = [];
      parts = [];
      marbles.forEach(function (m) {
        m.finished = false; m.still = 0; m.boost = 0; m.hit = 0;
        m.bestY = -9999; m.stall = 0; m.trail = [];
        armSkills(m);
        m.r = (m.sk && m.sk.feather) ? MARBLE_R * 0.86 : MARBLE_R;
        m.x = rand(40, W - 40);
        m.y = rand(30, LOBBY_FLOOR_Y - 30);
        m.vx = rand(-1.5, 1.5); m.vy = 0;
      });
      raceFrames = 0;
      racing = true;
    },
    state: function () {
      return { marbles: marbles, segs: segs, pegs: pegs, spinners: spinners,
               finishY: finishY, worldH: worldH, finished: finishedList, racing: racing };
    }
  };
})();
`);

const m = new Module('marblerace');
m._compile(src, path.join(__dirname, 'marblerace.js'));
module.exports = m.exports;
