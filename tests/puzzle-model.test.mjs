import assert from "node:assert/strict";
import test from "node:test";
import { FAMILIES, MAX_LEVEL, generatePuzzle, tokenKey, shortestPath, walk, readPuzzleSave, recordResult, emptySave, pickLevel, finishGame, makeRng, planGame, STICKERS } from "../app/puzzles/model.ts";

const SEEDS = Array.from({ length: 60 }, (_, i) => i * 7919 + 13);

test("every family generates a valid, unambiguous puzzle at every level", () => {
  for (const { id } of FAMILIES) for (let level = 1; level <= MAX_LEVEL; level++) for (const seed of SEEDS) {
    const p = generatePuzzle(id, level, seed);
    assert.equal(p.family, id);
    assert.ok(p.prompt.length > 3 && p.explain.length > 3, `${id} ${level} text`);
    if (p.interaction === "choice") {
      assert.ok(p.options.length >= 3 && p.options.length <= 4, `${id} L${level} has ${p.options.length} options`);
      assert.ok(p.answer >= 0 && p.answer < p.options.length, `${id} L${level} answer index`);
      assert.equal(new Set(p.options.map(tokenKey)).size, p.options.length, `${id} L${level} duplicate options`);
      if (p.display.type === "scene") {
        const target = p.display.target.glyph;
        const count = p.display.items.filter((i) => i.token.glyph === target).length;
        assert.equal(p.options[p.answer].value, count);
      }
      if (p.display.type === "sum") {
        const want = p.display.right === null ? p.display.total - p.display.left : p.display.left + p.display.right;
        assert.equal(p.options[p.answer].value, want);
      }
      if (p.display.type === "row") {
        assert.equal(p.display.items.filter((t) => t === null).length, 1);
      }
      if (id === "odd" && p.options[0].kind === "group") {
        const counts = p.options.map((o) => o.count);
        const answerCount = counts[p.answer];
        assert.equal(counts.filter((c) => c === answerCount).length, 1, "odd group must be unique");
        assert.equal(new Set(counts).size, 2);
      }
    } else if (p.interaction === "order") {
      assert.deepEqual([...p.order].sort(), p.cards.map((_, i) => i));
      assert.ok(p.order.some((v, i) => v !== i), "cards must start shuffled");
    } else {
      const length = shortestPath(p.size, p.rocks, p.start, p.goal);
      assert.ok(length !== null && length >= 2, `maze L${level} solvable`);
      assert.equal(p.program, level >= 5);
    }
  }
});

test("difficulty grows with level", () => {
  const avgCount = (level) => SEEDS.reduce((s, seed) => { const p = generatePuzzle("count", level, seed); return s + p.options[p.answer].value; }, 0) / SEEDS.length;
  assert.ok(avgCount(1) < avgCount(5) && avgCount(5) < avgCount(9));
  const size = (level) => generatePuzzle("maze", level, 1).size;
  assert.ok(size(1) < size(4) && size(4) < size(8));
  const sumMax = Math.max(...SEEDS.map((seed) => { const p = generatePuzzle("sums", 1, seed); return p.options[p.answer].value; }));
  assert.ok(sumMax <= 5, "level 1 sums stay within 5");
});

test("answer position is not predictable", () => {
  const slots = new Set(SEEDS.map((seed) => generatePuzzle("odd", 2, seed).answer));
  assert.equal(slots.size, 4);
});

test("maze walking stops at rocks and edges", () => {
  const maze = { size: 3, rocks: [[1, 0]], start: [2, 0], goal: [0, 2] };
  assert.equal(walk(maze, ["up"]).bumped, true);
  assert.equal(walk(maze, ["left"]).bumped, true);
  const ok = walk(maze, ["right", "up", "up", "right"]);
  assert.equal(ok.reached, true);
  assert.equal(ok.path.length, 5);
});

test("adaptive levels: 3 first-try wins level up, 2 misses level down", () => {
  let save = emptySave();
  for (let i = 0; i < 3; i++) save = recordResult(save, "patterns", 0);
  assert.equal(save.levels.patterns, 2);
  save = recordResult(save, "patterns", 1);
  assert.equal(save.levels.patterns, 2);
  save = recordResult(save, "patterns", 2);
  assert.equal(save.levels.patterns, 1);
  save = recordResult(save, "patterns", 3);
  assert.equal(save.levels.patterns, 1, "never below 1");
  assert.deepEqual(save.stats.patterns, { played: 6, firstTry: 3 });
  assert.equal(pickLevel(5, 0.1), 4);
  assert.equal(pickLevel(5, 0.5), 5);
  assert.equal(pickLevel(10, 0.95), 10);
});

test("saves are validated and Brain Gym streaks count consecutive days", () => {
  assert.deepEqual(readPuzzleSave("{broken"), emptySave());
  const read = readPuzzleSave(JSON.stringify({ levels: { maze: 99, odd: 3, fake: 2 }, stickers: ["🦄", "🦄", "<script>"], games: -1 }));
  assert.equal(read.levels.maze, 10);
  assert.equal(read.levels.odd, 3);
  assert.deepEqual(read.stickers, ["🦄"]);
  assert.equal(read.games, 0);
  let { save, sticker } = finishGame(emptySave(), "2026-10-10", makeRng(1), true);
  assert.ok(STICKERS.includes(sticker));
  assert.deepEqual(save.gym, { last: "2026-10-10", streak: 1 });
  ({ save } = finishGame(save, "2026-10-11", makeRng(2), true));
  assert.equal(save.gym.streak, 2);
  ({ save } = finishGame(save, "2026-10-11", makeRng(3), true));
  assert.equal(save.gym.streak, 2, "same day does not double count");
  ({ save } = finishGame(save, "2026-10-14", makeRng(4), true));
  assert.equal(save.gym.streak, 1);
  assert.equal(new Set(save.stickers).size, save.stickers.length);
  assert.equal(new Set(planGame("gym", makeRng(5))).size, 5);
});

test("maze solver finds a shortest path that reaches the goal", async () => {
  const { solveMaze } = await import("../app/puzzles/model.ts");
  for (const seed of SEEDS) for (const level of [1, 5, 10]) {
    const p = generatePuzzle("maze", level, seed);
    const moves = solveMaze(p);
    assert.equal(moves.length, shortestPath(p.size, p.rocks, p.start, p.goal));
    assert.equal(walk(p, moves).reached, true);
  }
});

test("new islands: sudoku, position and balance answers are logically forced", () => {
  for (const seed of SEEDS) for (let level = 1; level <= MAX_LEVEL; level++) {
    const s = generatePuzzle("sudoku", level, seed);
    const { size, cells } = s.display;
    const q = cells.indexOf("?");
    const r = Math.floor(q / size), c = q % size;
    const seen = new Set(cells.filter((t, i) => t && t !== "?" && (Math.floor(i / size) === r || i % size === c)).map((t) => t.glyph));
    const missing = s.options.filter((o) => !seen.has(o.glyph));
    assert.equal(missing.length, 1, `sudoku L${level} must have exactly one candidate`);
    assert.equal(missing[0].glyph, s.options[s.answer].glyph);

    const p = generatePuzzle("position", level, seed);
    const glyphs = p.display.cells.map((t) => t?.glyph ?? null);
    const ans = p.options[p.answer].glyph;
    const at = glyphs.indexOf(ans);
    const name = (g) => p.display.cells.find((t) => t?.glyph === g)?.name;
    const near = { above: at + 3, under: at - 3, left: at + 1, right: at - 1 };
    const rel = p.prompt.includes("above") ? "above" : p.prompt.includes("under") ? "under" : p.prompt.includes("left") ? "left" : p.prompt.includes("right") ? "right" : "between";
    if (rel === "between") assert.ok(p.prompt.includes(name(glyphs[at - 1])) && p.prompt.includes(name(glyphs[at + 1])) && at % 3 === 1);
    else { assert.ok(p.prompt.includes(`the ${name(glyphs[near[rel]])}?`), `${rel} reference`); if (rel === "left" || rel === "right") assert.equal(Math.floor(at / 3), Math.floor(near[rel] / 3)); }

    const b = generatePuzzle("balance", level, seed);
    if (b.display.type === "scales" && b.display.scales.length === 2 && b.display.scales[0].tilt !== 0) {
      const heavy = new Set(), light = new Set();
      for (const sc of b.display.scales) { const [h, l] = sc.tilt === -1 ? [sc.left[0], sc.right[0]] : [sc.right[0], sc.left[0]]; heavy.add(h.glyph); light.add(l.glyph); }
      const all = b.options.map((o) => o.glyph);
      const ranked = [all.find((g) => heavy.has(g) && !light.has(g)), null, all.find((g) => light.has(g) && !heavy.has(g))];
      assert.equal(b.options[b.answer].glyph, b.prompt.includes("heaviest") ? ranked[0] : ranked[2]);
    }
  }
});

test("boss puzzle is one level up and fox names are cleaned", async () => {
  const { levelFor, cleanName, GAME_LENGTH } = await import("../app/puzzles/model.ts");
  const save = emptySave();
  save.levels.maze = 4;
  assert.deepEqual(levelFor(save, "maze", GAME_LENGTH - 1, true, 0.5), { level: 5, boss: true });
  assert.deepEqual(levelFor(save, "maze", GAME_LENGTH - 1, false, 0.5), { level: 4, boss: false });
  assert.equal(cleanName("<b>Rusty!!</b> the great fox"), "bRustyb the");
  assert.equal(cleanName(42), "");
  assert.equal(readPuzzleSave(JSON.stringify({ foxName: "Tiku" })).foxName, "Tiku");
});
