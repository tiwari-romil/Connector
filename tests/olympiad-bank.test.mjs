import assert from "node:assert/strict";
import test from "node:test";
import { QUESTIONS, TYPES, MOCK_TESTS, HIDDEN_LETTER_CHECK, optionLabel } from "../app/olympiad/bank.ts";

test("bank has 200 questions across all 25 sample types and three levels", () => {
  assert.equal(QUESTIONS.length, 200);
  assert.equal(TYPES.length, 25);
  for (const t of TYPES) assert.ok(QUESTIONS.some((q) => q.type === t.id), t.id);
  for (const level of ["easy", "medium", "champ"]) assert.ok(QUESTIONS.filter((q) => q.level === level).length >= 50, level);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 200);
});

test("every question has four distinct options and a valid answer", () => {
  for (const q of QUESTIONS) {
    assert.equal(q.options.length, 4, q.id);
    assert.ok(q.answer >= 0 && q.answer < 4, q.id);
    const keys = q.options.map((o) => (typeof o === "string" ? o : o.svg + o.label));
    assert.equal(new Set(keys).size, 4, `${q.id} has duplicate options`);
    assert.ok(q.why.length > 10, q.id);
    if (q.type !== "oddTurn") assert.equal(new Set(q.options.map((o) => (typeof o === "string" ? o : o.svg))).size, 4, `${q.id} looks the same twice`);
    assert.ok(optionLabel(q.options[q.answer]).length > 0);
  }
});

test("answers are spread over A–D", () => {
  const counts = [0, 0, 0, 0];
  for (const q of QUESTIONS) counts[q.answer]++;
  for (const c of counts) assert.ok(c >= 35, `positions ${counts}`);
});

test("hidden letter puzzles: only the answer contains the letter", () => {
  for (const c of HIDDEN_LETTER_CHECK) {
    assert.ok(c.target.every((s) => c.answer.includes(s)));
    for (const w of c.wrong) assert.ok(!c.target.every((s) => w.includes(s)));
  }
});

test("eight mock tests of 25 use every question exactly once", () => {
  assert.equal(MOCK_TESTS.length, 8);
  for (const t of MOCK_TESTS) assert.equal(t.length, 25);
  assert.equal(new Set(MOCK_TESTS.flat()).size, 200);
});
