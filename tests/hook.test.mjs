import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldNudge, buildOutput } from '../hooks/stepback-hook.mjs';

const nudges = [
  'Fix this bug',
  'We need another workaround, this keeps breaking',
  'Investigate this regression',
  'this broke',
  'this broke again',
  'login is broken',
  'it crashes on empty input',
  'the date picker does not work on Safari',
  "the export button doesn't work anymore",
  "I'm getting an error when I save the form",
  'the worker throws a NullPointerException on shutdown',
  'TypeError: Cannot read properties of undefined (reading "id")',
  'cargo build says:\nerror[E0382]: borrow of moved value',
  'same issue as last week with the cache',
  'we patched this before and it is back',
  'handle the edge case where the list is empty',
  'the timeout keeps coming back',
  'this is not just a patch problem, it keeps breaking',
  'the only fix so far was a restart and it crashed again'
];

const quiet = [
  'Write a README for this package',
  'Explain binary search',
  'try again with the other port',
  'add error handling to the parser',
  'raise a ValueError if the input is negative',
  'bump the patch version',
  'draw an architecture diagram',
  'refactor this module to use async/await',
  'dispatch the event after the page loads'
];

const narrowFixOptOuts = [
  'this broke again, just patch it',
  'Login is broken. I only want a minimal fix.',
  'tests are failing, fix it without refactoring',
  'give me a one-line hotfix for the crash',
  'same bug as yesterday, just fix it'
];

for (const prompt of nudges) {
  test(`nudges: ${JSON.stringify(prompt)}`, () => assert.equal(shouldNudge(prompt), true));
}
for (const prompt of quiet) {
  test(`stays quiet: ${JSON.stringify(prompt)}`, () => assert.equal(shouldNudge(prompt), false));
}
for (const prompt of narrowFixOptOuts) {
  test(`narrow-fix request suppresses the nudge: ${JSON.stringify(prompt)}`, () => assert.equal(shouldNudge(prompt), false));
}

test('does not nudge empty or non-string prompts', () => {
  assert.equal(shouldNudge(''), false);
  assert.equal(shouldNudge(null), false);
});
test('returns advisory context and never a blocking decision', () => {
  const result = buildOutput('Investigate this regression');
  assert.equal(result.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(result.hookSpecificOutput.additionalContext, /do not force a redesign/i);
  assert.equal('decision' in result, false);
});
test('returns null for unrelated prompts', () => assert.equal(buildOutput('Explain binary search'), null));
test('stays fast on a long pasted log', () => {
  const log = `${'\n'.repeat(20000)}${'x '.repeat(50000)}TypeError: boom`;
  const started = performance.now();
  assert.equal(shouldNudge(log), true);
  assert.ok(performance.now() - started < 500, 'matching a long prompt should take well under the 3s hook timeout');
});
test('hook process accepts stdin with a UTF-8 BOM (Windows PowerShell piping)', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const hook = fileURLToPath(new URL('../hooks/stepback-hook.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [hook], { input: '﻿{"prompt":"Fix this bug"}', encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.equal(JSON.parse(run.stdout).hookSpecificOutput.hookEventName, 'UserPromptSubmit');
});
