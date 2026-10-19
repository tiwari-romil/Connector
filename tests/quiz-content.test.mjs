import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, MATH_LEVELS, SCIENCE_LEVELS, emptyProgress, mathChoicesFor, readQuizProgress, recordWin, scienceChoicesFor } from "../app/quiz/content.ts";

test("maths levels climb gently, and tens-and-ones sums never need carrying", () => {
  assert.equal(MATH_LEVELS.length, 70);
  MATH_LEVELS.slice(0, 15).forEach((l) => assert.ok(l.a + l.b <= 5));
  MATH_LEVELS.slice(15, 30).forEach((l) => assert.ok(l.a + l.b <= 10));
  MATH_LEVELS.slice(45).forEach((l) => assert.ok((l.a % 10) + (l.b % 10) <= 9, `${l.a} + ${l.b} carries`));
});

test("every quiz question offers four different choices including the answer", () => {
  MATH_LEVELS.forEach((level, i) => {
    for (const visit of [0, 1, 7]) {
      const choices = mathChoicesFor(level, i, visit);
      assert.equal(new Set(choices).size, 4);
      assert.ok(choices.includes(String(level.a + level.b)));
    }
  });
  SCIENCE_LEVELS.forEach((level, i) => {
    const choices = scienceChoicesFor(level, i, 0);
    assert.equal(new Set(choices).size, 4);
    assert.ok(choices.includes(level.answer));
  });
});

test("replaying a level cannot farm stars", () => {
  let p = recordWin(emptyProgress(), 0, 1, LEVEL_COUNT.math);
  assert.equal(p.stars, 1);
  assert.equal(p.unlocked, 2);
  p = recordWin(p, 0, 1, LEVEL_COUNT.math);
  assert.equal(p.stars, 1, "same score again adds nothing");
  p = recordWin(p, 0, 3, LEVEL_COUNT.math);
  assert.equal(p.stars, 3, "a better score adds only the difference");
  const last = LEVEL_COUNT.math - 1;
  p = recordWin(recordWin(p, last, 3, LEVEL_COUNT.math), last, 3, LEVEL_COUNT.math);
  assert.equal(p.stars, 6, "the last level counts once too");
  assert.equal(p.unlocked, LEVEL_COUNT.math);
});

test("saved progress is validated and the old maths save is migrated", () => {
  assert.deepEqual(readQuizProgress("not json").math, emptyProgress());
  const damaged = readQuizProgress(JSON.stringify({ math: { levelIndex: 50, unlocked: 3, stars: -4, best: [3, "x", 9] } }));
  assert.deepEqual(damaged.math, { levelIndex: 2, unlocked: 3, stars: 0, best: [3, 0, 3] });
  assert.deepEqual(damaged.science, emptyProgress());
  const legacy = readQuizProgress(null, JSON.stringify({ unlocked: 5, stars: 12 }));
  assert.equal(legacy.math.unlocked, 5);
  assert.equal(legacy.math.stars, 12);
});
