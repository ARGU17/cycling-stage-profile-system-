#!/usr/bin/env node
/* Headless state-engine validation for v0.26. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");

class FakeElement {
  constructor(id = "") { this.id = id; this._html = ""; this.textContent = ""; this.style = {}; }
  set innerHTML(value) { this._html = String(value); }
  get innerHTML() { return this._html; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  insertAdjacentHTML(_position, html) { this._html += String(html); }
  appendChild() {}
  remove() {}
  addEventListener() {}
}

const app = new FakeElement("app");
const storage = new Map();
const context = {
  console, Math, Date, JSON, Promise, Set, Map, Array, Object, Number, String, Boolean, RegExp, Error, Intl,
  parseInt, parseFloat, isNaN, setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: callback => setTimeout(callback, 0),
  cancelAnimationFrame: clearTimeout,
  performance: { now: () => Date.now() },
  structuredClone: value => JSON.parse(JSON.stringify(value)),
  document: {
    getElementById: id => id === "app" ? app : null,
    createElement: () => new FakeElement(),
    body: new FakeElement("body"),
    querySelector: () => null,
    querySelectorAll: () => []
  },
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  },
  location: { origin: "http://localhost", href: "http://localhost/" },
  navigator: { userAgent: "v026-node-test" }
};
context.window = context;
context.window.addEventListener = () => {};
context.window.removeEventListener = () => {};
context.window.postMessage = () => {};
vm.createContext(context);

const scripts = [
  "data.js", "v024-data.js", "gpx-stage-data.js", "gpx-engine.js", "game.js",
  "v024-expansion.js", "gpx-integration.js", "v024-plus-fix.js",
  "stage-lab-integration.js", "v026-season-skip.js"
];
for (const script of scripts) {
  vm.runInContext(fs.readFileSync(path.join(root, script), "utf8"), context, { filename: script });
}

const evaluate = code => vm.runInContext(code, context);
const waitUntil = async (expression, timeout = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (evaluate(expression)) return true;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  return false;
};

(async () => {
  evaluate(`setMode("season"); const state = ensureV026SeasonState(); state.playRaceIds = [SEASON_RACE_IDS[1]]; state.presetId = "custom"; selectTeam("uae");`);
  if (!await waitUntil(`!Game.v026Season.fastForward.running`)) throw new Error("La simulación no terminó dentro del tiempo límite");
  const result = evaluate(`({
    selectedRaceId: Game.selectedRaceId,
    expectedRaceId: SEASON_RACE_IDS[1],
    history: Game.raceHistory,
    simulated: Game.v026Season.simulatedRaceIds,
    error: Game.v026Season.fastForward.error,
    stageLabActive: Game.stageLab.screenActive
  })`);
  if (result.error) throw new Error(result.error);
  if (result.selectedRaceId !== result.expectedRaceId) throw new Error("No avanzó a la siguiente carrera manual");
  if (!result.history[0]?.autoSimulated) throw new Error("La carrera omitida no quedó registrada como simulada");
  if (!result.stageLabActive) throw new Error("Stage Lab no se abrió para la siguiente carrera manual");
  console.log("v0.26 season skip test: PASS");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
