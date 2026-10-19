import assert from "node:assert/strict";
import test from "node:test";
import { MISSIONS, mathMission, experimentFor, readDiscoverySave } from "../app/discovery-model.ts";

test("all maths answers are reachable and practice changes the numbers", () => {
  for (const id of ["build", "subtract", "groups"]) for (const tier of [0, 1, 2]) {
    const targets = new Set();
    for (let round = 0; round < 4; round++) {
      const puzzle = mathMission(id, tier, round);
      assert.ok(puzzle.target >= 0 && puzzle.target <= 99);
      assert.equal(puzzle.target, id === "subtract" ? puzzle.a - puzzle.b : id === "groups" ? puzzle.a * puzzle.b : puzzle.a + puzzle.b);
      if (id === "groups") assert.equal(puzzle.target % puzzle.b, 0);
      targets.add(puzzle.target);
    }
    assert.ok(targets.size > 1);
  }
});

test("science challenges have distinct predictions and valid explanations", () => {
  for (const mission of ["magnets", "water", "shadows"]) for (const tier of [0, 1, 2]) {
    const experiment = experimentFor(mission, tier);
    assert.equal(new Set(experiment.options).size, 3);
    assert.equal(new Set(experiment.reasons).size, 3);
    assert.ok(experiment.options[experiment.answer]);
    assert.ok(experiment.reasons[experiment.reason]);
    assert.ok(experiment.observation && experiment.clue && experiment.followup);
  }
  assert.match(experimentFor("magnets", 1).reasons[2], /not all/);
  assert.equal(experimentFor("water", 2).options[0], "Water vapour in the air");
});

test("saved progress rejects damaged data and counts unique mission tiers", () => {
  assert.deepEqual(readDiscoverySave("not json"), { best: {}, completed: 0 });
  assert.deepEqual(readDiscoverySave(null), { best: {}, completed: 0 });
  const save = readDiscoverySave(JSON.stringify({ completed: 999, best: { "build-0": 3, "water-2": 3, "groups-1": -1, "magnets-2": "3", "fake-0": 3 } }));
  assert.deepEqual(save, { best: { "build-0": 3, "water-2": 3 }, completed: 2 });
  const best = Object.fromEntries(MISSIONS.flatMap((mission) => [0, 1, 2].map((tier) => [`${mission.id}-${tier}`, 3])));
  assert.equal(readDiscoverySave(JSON.stringify({ best })).completed, 18);
});
