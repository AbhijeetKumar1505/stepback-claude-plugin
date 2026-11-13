import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  '.claude-plugin/plugin.json', 'hooks/hooks.json', 'hooks/stepback-hook.mjs',
  'skills/architectural-reconsideration/SKILL.md', 'commands/rethink.md',
  'commands/challenge.md', 'commands/diagnose.md', 'commands/audit.md',
  'agents/root-cause-investigator.md', 'agents/architecture-auditor.md',
  'agents/alternative-designer.md', 'agents/edge-case-analyst.md'
];
let failed = false;
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}
for (const file of ['.claude-plugin/plugin.json', 'hooks/hooks.json', '.claude-plugin/marketplace.json']) {
  try { JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
  catch (error) { console.error(`Invalid JSON ${file}: ${error.message}`); failed = true; }
}
if (failed) process.exit(1);
console.log(`StepBack structure valid (${required.length} required files checked).`);
