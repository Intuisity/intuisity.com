const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const source = fs.readFileSync("src/data/dailyLessons.ts", "utf8");
const compiled = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020
});
const moduleShim = { exports: {} };
new Function("require", "module", "exports", compiled)(require, moduleShim, moduleShim.exports);

const { dailyIntuitionLessons, getDailyPositivityChoices } = moduleShim.exports;

assert.equal(dailyIntuitionLessons.length, 50);
assert.equal(new Set(dailyIntuitionLessons.map((lesson) => lesson.title)).size, 50);
assert.equal(new Set(dailyIntuitionLessons.map((lesson) => lesson.practice)).size, 50);

const seen = new Set();
for (let dayIndex = 0; dayIndex < 25; dayIndex += 1) {
  const date = new Date(Date.UTC(2026, 0, 1 + dayIndex)).toISOString().slice(0, 10);
  const choices = getDailyPositivityChoices("person@example.com", date);
  assert.equal(choices.length, 2);
  assert.notEqual(choices[0].title, choices[1].title);
  choices.forEach((lesson) => {
    assert.equal(seen.has(lesson.practice), false);
    seen.add(lesson.practice);
  });
}

assert.equal(seen.size, 50);
assert.deepEqual(
  getDailyPositivityChoices("person@example.com", "2026-01-10"),
  getDailyPositivityChoices("person@example.com", "2026-01-10")
);
assert.notDeepEqual(
  getDailyPositivityChoices("person@example.com", "2026-01-10"),
  getDailyPositivityChoices("another@example.com", "2026-01-10")
);
assert.ok(dailyIntuitionLessons.every((lesson) => lesson.practice.length > 20));
assert.ok(dailyIntuitionLessons.every((lesson) => lesson.reflection.length > 20));

console.log("Daily lesson tests passed");
