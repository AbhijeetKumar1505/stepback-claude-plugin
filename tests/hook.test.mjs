import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldNudge, buildOutput } from '../hooks/stepback-hook.mjs';

test('detects a bug report', () => assert.equal(shouldNudge('Fix this bug'), true));
test('detects repeated workaround language', () => assert.equal(shouldNudge('We need another workaround, this keeps breaking'), true));
test('does not nudge unrelated requests', () => assert.equal(shouldNudge('Write a README for this package'), false));
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
test('hook process accepts stdin with a UTF-8 BOM (Windows PowerShell piping)', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const hook = fileURLToPath(new URL('../hooks/stepback-hook.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [hook], { input: '\uFEFF{"prompt":"Fix this bug"}', encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.equal(JSON.parse(run.stdout).hookSpecificOutput.hookEventName, 'UserPromptSubmit');
});
