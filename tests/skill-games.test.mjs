import assert from "node:assert/strict";
import test from "node:test";
import { MAX_LEVEL } from "../app/puzzles/model.ts";
import { emptyTrack, readTrack, recordTrack, rankFor } from "../app/tracks.ts";
import { BAND, BAND_RANKS, NUMBER_RANKS, bandSetup, bandTune, numberSetup, numberRound, readMemorySave, recordSpan } from "../app/memory/model.ts";
import { CARRY_RANKS, carryColumns, carryPattern, carryProblem } from "../app/quiz/carry.ts";

const SEEDS = Array.from({ length: 80 }, (_, i) => i * 7919 + 13);
const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

// ---------- shared adaptive track + ranks ----------
test("tracks: 3 first-try wins level up, 2 misses level down, stars add up", () => {
  let t = emptyTrack();
  for (let i = 0; i < 3; i++) t = recordTrack(t, 0);
  assert.equal(t.level, 2);
  assert.equal(t.stars, 9);
  t = recordTrack(t, 1);
  assert.equal(t.level, 2, "one miss keeps the level");
  t = recordTrack(t, 2);
  assert.equal(t.level, 1);
  t = recordTrack(t, 3);
  assert.equal(t.level, 1, "never below 1");
  assert.equal(t.played, 6);
  assert.equal(t.firstTry, 3);
  assert.equal(t.stars, 9 + 2 + 1 + 1);
  let top = { ...emptyTrack(), level: MAX_LEVEL };
  for (let i = 0; i < 3; i++) top = recordTrack(top, 0);
  assert.equal(top.level, MAX_LEVEL, "never above the top level");
});

test("ranks come from stars, so a hard day (level going down) never takes a rank away", () => {
  let t = emptyTrack();
  for (let i = 0; i < 4; i++) t = recordTrack(t, 0);
  const earned = rankFor(BAND_RANKS, t.stars).index;
  assert.ok(earned >= 1, "a good first game earns the second rank");
  t = recordTrack(t, 2);
  t = recordTrack(t, 2);
  assert.equal(t.level, 1);
  assert.ok(rankFor(BAND_RANKS, t.stars).index >= earned, "missing rounds still adds stars, never removes a rank");
});

test("ranks: every ladder starts at 0 stars, climbs, and says how far the next rank is", () => {
  for (const ladder of [BAND_RANKS, NUMBER_RANKS, CARRY_RANKS]) {
    assert.equal(ladder[0].stars, 0);
    for (let i = 1; i < ladder.length; i++) assert.ok(ladder[i].stars > ladder[i - 1].stars);
    // One 5-round game earns 5–15 stars: the second rank must be reachable in a single game.
    assert.ok(ladder[1].stars <= 12, "second rank within one game");
    const first = rankFor(ladder, 0);
    assert.equal(first.index, 0);
    assert.equal(first.next, ladder[1]);
    assert.equal(first.starsToNext, ladder[1].stars);
    const almost = rankFor(ladder, ladder[1].stars - 1);
    assert.equal(almost.index, 0);
    assert.equal(almost.starsToNext, 1);
    assert.equal(rankFor(ladder, ladder[1].stars).index, 1);
    const top = rankFor(ladder, 10_000);
    assert.equal(top.index, ladder.length - 1);
    assert.equal(top.next, null);
    assert.equal(top.starsToNext, 0);
  }
});

test("tracks: damaged saves are cleaned instead of crashing", () => {
  assert.deepEqual(readTrack(null), emptyTrack());
  assert.deepEqual(readTrack("nope"), emptyTrack());
  const t = readTrack({ level: 99, run: 7, played: 5, firstTry: 9, stars: -1 });
  assert.equal(t.level, MAX_LEVEL);
  assert.equal(t.run, 0);
  assert.equal(t.played, 5);
  assert.equal(t.firstTry, 5, "first-try count is capped at games played");
  assert.equal(t.stars, 0);
  const save = readMemorySave("{not json");
  assert.deepEqual(save.band, emptyTrack());
  assert.equal(save.bestTune, 0);
  const kept = readMemorySave(JSON.stringify({ band: { level: 4, peak: 6, run: 2, played: 10, firstTry: 6, stars: 22 }, bestTune: 5, bestForward: 4, bestBackward: "x" }));
  assert.equal(kept.band.level, 4);
  assert.equal(kept.band.stars, 22, "older saves (with a peak level) keep their stars");
  assert.equal(kept.bestTune, 5);
  assert.equal(kept.bestBackward, 0);
});

// ---------- Echo the Band ----------
test("band: every level makes a playable tune that only uses the pads on screen", () => {
  for (const level of LEVELS) for (const bonus of [0, 1, 2, 5]) for (const seed of SEEDS) {
    const setup = bandSetup(level, bonus);
    assert.ok(setup.pads >= 3 && setup.pads <= BAND.length);
    const tune = bandTune(setup, seed);
    assert.equal(tune.length, setup.length);
    assert.ok(tune.every((pad) => Number.isInteger(pad) && pad >= 0 && pad < setup.pads));
    assert.ok(new Set(tune).size >= 2, "a tune uses at least two animals");
    for (let i = 2; i < tune.length; i++) assert.ok(!(tune[i] === tune[i - 1] && tune[i] === tune[i - 2]), "no animal plays three times in a row");
  }
});

test("band: the tune grows with level and with a good run, up to two extra notes", () => {
  for (let level = 2; level <= MAX_LEVEL; level++) {
    const easier = bandSetup(level - 1, 0), harder = bandSetup(level, 0);
    assert.ok(harder.length >= easier.length && harder.pads >= easier.pads && harder.gapMs <= easier.gapMs);
    assert.ok(harder.length > easier.length || harder.pads > easier.pads || harder.gapMs < easier.gapMs, `level ${level} is harder than ${level - 1}`);
  }
  assert.equal(bandSetup(1, 0).length, 2);
  assert.equal(bandSetup(1, 1).length, 3);
  assert.equal(bandSetup(1, 2).length, 4);
  assert.equal(bandSetup(1, 9).length, 4, "bonus is capped at two notes");
});

test("band: the same seed always plays the same tune", () => {
  assert.deepEqual(bandTune(bandSetup(5, 0), 42), bandTune(bandSetup(5, 0), 42));
});

// ---------- Hold the Numbers ----------
test("numbers: rounds use different digits from 1 to 9, and backwards rounds reverse the answer", () => {
  for (const level of LEVELS) for (const seed of SEEDS) {
    const setup = numberSetup(level);
    const round = numberRound(setup, seed);
    assert.equal(round.shown.length, setup.length);
    assert.equal(new Set(round.shown).size, setup.length, "no repeated digits");
    assert.ok(round.shown.every((d) => Number.isInteger(d) && d >= 1 && d <= 9));
    assert.deepEqual(round.answer, setup.backwards ? [...round.shown].reverse() : round.shown);
    for (let i = 2; i < round.shown.length; i++) {
      const [a, b, c] = round.shown.slice(i - 2, i + 1);
      assert.ok(!(b - a === c - b && Math.abs(b - a) === 1), "no 1-2-3 style runs that are too easy");
    }
  }
});

test("numbers: each number is shown briefly, and a little more briefly at higher levels", () => {
  for (const level of LEVELS) {
    const { showMs } = numberSetup(level);
    assert.ok(showMs <= 800 && showMs >= 550, `level ${level} shows each number for ${showMs} ms`);
    if (level > 1) assert.ok(showMs < numberSetup(level - 1).showMs);
  }
});

test("numbers: starts with 2 forwards and reaches backwards rounds later", () => {
  assert.deepEqual({ ...numberSetup(1), showMs: 0 }, { length: 2, backwards: false, showMs: 0 });
  assert.ok(LEVELS.slice(0, 3).every((l) => !numberSetup(l).backwards), "first levels are forwards only");
  assert.ok(LEVELS.some((l) => numberSetup(l).backwards));
  const forwards = LEVELS.map(numberSetup).filter((s) => !s.backwards).map((s) => s.length);
  const backwards = LEVELS.map(numberSetup).filter((s) => s.backwards).map((s) => s.length);
  for (const list of [forwards, backwards]) for (let i = 1; i < list.length; i++) assert.ok(list[i] > list[i - 1]);
});

test("numbers and band: best spans only grow, and only when solved without help", () => {
  let save = readMemorySave(null);
  save = recordSpan(save, "band", 4, false, 0);
  assert.equal(save.bestTune, 4);
  save = recordSpan(save, "band", 3, false, 1);
  assert.equal(save.bestTune, 4, "a shorter tune doesn't lower the best");
  save = recordSpan(save, "band", 6, false, 2);
  assert.equal(save.bestTune, 4, "a tune finished with help doesn't count");
  save = recordSpan(save, "numbers", 3, true, 0);
  assert.equal(save.bestBackward, 3);
  assert.equal(save.bestForward, 0);
});

// ---------- Carry Club ----------
test("carry: columns add up to the real answer", () => {
  for (const [a, b] of [[27, 5], [345, 824], [478, 256], [999, 1], [10, 0], [678, 456]]) {
    const columns = carryColumns(a, b);
    const total = columns.reduce((sum, column, place) => sum + column.digit * 10 ** place, 0) + columns.at(-1).carryOut * 10 ** columns.length;
    assert.equal(total, a + b, `${a} + ${b}`);
    columns.forEach((column, place) => {
      assert.equal(column.place, place);
      assert.equal(column.total, (column.top ?? 0) + (column.bottom ?? 0) + column.carryIn);
      assert.equal(column.digit, column.total % 10);
      assert.equal(column.carryOut, column.total >= 10 ? 1 : 0);
      assert.equal(column.carryIn, place === 0 ? 0 : columns[place - 1].carryOut);
    });
  }
  assert.deepEqual(carryPattern(478, 256), [1, 1, 0]);
  assert.deepEqual(carryPattern(345, 824), [0, 0, 1]);
  assert.equal(carryColumns(27, 5)[1].bottom, null, "a missing digit is empty, not zero");
});

test("carry: each level makes the kind of sum it promises", () => {
  const twoCarries = (p) => p.reduce((s, c) => s + c, 0) === 2;
  const expect = {
    1: (a, b, p) => a >= 10 && a < 100 && b < 10 && p.join() === "1,0",
    2: (a, b, p) => a >= 10 && a < 100 && b >= 10 && b < 100 && p.join() === "1,0",
    3: (a, b, p) => a >= 10 && a < 100 && b >= 10 && b < 100 && p.join() === "0,1",
    4: (a, b, p) => a >= 100 && b >= 100 && p.join() === "0,0,0",
    5: (a, b, p) => a >= 100 && b >= 100 && p.join() === "1,0,0",
    6: (a, b, p) => a >= 100 && b >= 100 && p.join() === "0,1,0",
    7: (a, b, p) => a >= 100 && b >= 100 && p.join() === "0,0,1",
    8: (a, b, p) => a >= 100 && b >= 100 && p.join() === "1,1,0",
    9: (a, b, p) => a >= 100 && b >= 100 && twoCarries(p) && p.join() !== "1,1,0",
    10: (a, b, p) => a >= 100 && b >= 100 && p.join() === "1,1,1",
  };
  for (const level of LEVELS) for (const seed of SEEDS) {
    const { a, b } = carryProblem(level, seed);
    assert.ok(a < 1000 && b < 1000);
    assert.ok(expect[level](a, b, carryPattern(a, b)), `level ${level}: ${a} + ${b}`);
  }
});

test("carry: sums change from seed to seed", () => {
  for (const level of LEVELS) {
    const sums = new Set(SEEDS.map((seed) => { const { a, b } = carryProblem(level, seed); return `${a}+${b}`; }));
    assert.ok(sums.size > 20, `level ${level} has variety`);
  }
});
