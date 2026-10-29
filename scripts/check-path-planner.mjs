import assert from "node:assert/strict";
import { planOptions } from "../backend/dist/platform/path-planner.js";
const pref = {
  goal: "CAREER",
  level: "BEGINNER",
  occupation: "OFFICE",
  format: "MIXED",
  weeklySeconds: 3600,
  horizonWeeks: 4,
  count: 4,
};
const create = (id, kind, core, prerequisites, extra = {}) => ({
  id,
  title: `Bài ${id}`,
  order: id,
  seconds: 900,
  measuredVideo: false,
  difficulty: 1,
  kind,
  core,
  prerequisites,
  outcomes: [],
  skills: [],
  goals: [],
  sources: [],
  completed: false,
  ...extra,
});
const nodes = [
  create(1, "CONCEPT", true, []),
  create(2, "CONCEPT", true, [1]),
  create(3, "PRACTICE", false, [1, 2], { modelScore: 0.1 }),
  create(4, "PRACTICE", false, [1, 2], { modelScore: 0.9 }),
  create(5, "REVIEW", false, [1, 2]),
  create(6, "PROJECT", false, [1, 2]),
  create(7, "VIDEO", false, []),
];
let checks = 0;
function check(label, condition) {
  assert.ok(condition, label);
  console.log("PASS", label);
  checks++;
}
const plans = planOptions(nodes, pref, false);
check(
  "four distinct alternatives",
  plans.length === 4 &&
    new Set(plans.map((p) => p.steps.map((s) => s.lessonId).join(","))).size ===
      4,
);
check(
  "model changes eligible frontier ranking",
  planOptions(nodes, pref, true)
    .find((p) => p.id === "balanced")
    .steps.findIndex((s) => s.lessonId === 4) <
    planOptions(nodes, pref, true)
      .find((p) => p.id === "balanced")
      .steps.findIndex((s) => s.lessonId === 3),
);
check(
  "without model tie resolves by curriculum order",
  plans
    .find((p) => p.id === "balanced")
    .steps.findIndex((s) => s.lessonId === 3) <
    plans
      .find((p) => p.id === "balanced")
      .steps.findIndex((s) => s.lessonId === 4),
);
check(
  "model cannot move lesson before prerequisite",
  planOptions(nodes, pref, true).every((p) => {
    const done = new Set();
    return p.steps.every((s) => {
      const valid = s.prerequisites.every((id) => done.has(id));
      done.add(s.lessonId);
      return valid;
    });
  }),
);
check(
  "budget does not delete prerequisite",
  planOptions(
    nodes,
    { ...pref, weeklySeconds: 1800, horizonWeeks: 1 },
    false,
  ).every(
    (p) =>
      p.steps.some((s) => s.lessonId === 1) &&
      p.steps.some((s) => s.lessonId === 2) &&
      !p.fitsBudget,
  ),
);
check(
  "completed prerequisites satisfied but omitted",
  planOptions(
    nodes.map((l) => ({ ...l, completed: l.id <= 2 })),
    pref,
    false,
  ).every((p) => p.steps.every((s) => s.lessonId > 2)),
);
check(
  "duplicate options not padded",
  planOptions(nodes.slice(0, 2), pref, false).length === 1,
);
check(
  "two options requested",
  planOptions(nodes, { ...pref, count: 2 }, false).length === 2,
);
assert.throws(
  () =>
    planOptions(
      [create(1, "CONCEPT", true, [2]), create(2, "CONCEPT", true, [1])],
      pref,
      false,
    ),
  /vòng lặp/,
);
check("cycle rejected", true);
assert.throws(
  () => planOptions([create(1, "CONCEPT", true, [99])], pref, false),
  /tiên quyết/,
);
check("missing prerequisite rejected", true);
console.log(`Verified ${checks} planner invariants.`);
