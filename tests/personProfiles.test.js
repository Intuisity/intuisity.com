const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const source = fs.readFileSync("src/data/personProfiles.ts", "utf8");
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 });
const moduleShim = { exports: {} };
new Function("require", "module", "exports", compiled)(require, moduleShim, moduleShim.exports);

const { personProfiles } = moduleShim.exports;
const oldGenericDecoys = new Set(["Court musician", "Mapmaker", "Medical herbalist", "Trade route organizer", "Textile artisan"]);

assert.equal(personProfiles.length, 300);
for (const profile of personProfiles) {
  assert.equal(profile.correctAttributes.length, 3);
  assert.equal(profile.attributes.length, 6);
  assert.equal(new Set(profile.attributes).size, 6, `${profile.name} should have six distinct choices`);
  assert.equal(profile.attributes.some((attribute) => oldGenericDecoys.has(attribute)), false);
}

const hypatia = personProfiles.find((profile) => profile.id === "hypatia");
const hypatiaDecoys = hypatia.attributes.filter((attribute) => !hypatia.correctAttributes.includes(attribute));
assert.ok(hypatiaDecoys.includes("Methodical experimenter"));
assert.ok(hypatiaDecoys.some((attribute) => /optics|algebra|stars|variables|fission|theory/i.test(attribute)));

console.log("Person profile tests passed");
