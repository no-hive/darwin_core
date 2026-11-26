import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, checkArtifacts, digest, inventory } from './artifacts.mjs';

const record = process.argv[2] === 'record-initial';
const results = path.join(ROOT, 'qa/results');
await mkdir(results, { recursive: true });
await rm(path.join(results, 'browser-pass.json'), { force: true });
if (process.env.SITES_MANAGED_LINUX_CONTAINER === '1') {
  console.error('BLOCKED: supported managed preview/CUA is required here. No screenshots have been approved.');
  process.exit(2);
}
const screenshots = path.join(ROOT, 'qa/baseline/screenshots');
const staging = path.join(results, 'initial-screenshots');
if (record) {
  if (existsSync(screenshots)) throw Error('Screenshot baseline already exists; initial capture cannot replace it.');
  const check = await checkArtifacts();
  if (check.changes.length) throw Error('Initial screenshots must match the original artifact baseline.');
  await rm(staging, { recursive: true, force: true });
} else if (!existsSync(screenshots)) {
  throw Error('Screenshot baseline is missing. Capture it on the unchanged baseline before refactoring.');
}
const before = digest(JSON.stringify(await inventory()));
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/@playwright/test/cli.js'), 'test',
  '--config', 'qa/playwright.config.mjs', ...(record ? ['--update-snapshots=all'] : [])], {
  cwd: ROOT, stdio: 'inherit',
  env: { ...process.env, ...(record ? { QA_SNAPSHOT_ROOT: staging } : {}) }
});
const report = JSON.parse(await readFile(path.join(results, 'browser.json'), 'utf8'));
if (report.stats.unexpected || report.stats.flaky || report.stats.skipped || !report.stats.expected) {
  throw Error('Every browser test must pass without skips or retries.');
}
if (before !== digest(JSON.stringify(await inventory()))) throw Error('Deployment output changed during browser QA.');
if (record) await rename(staging, screenshots);
async function hashes(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map(async entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? hashes(file) : [[path.relative(screenshots, file), digest(await readFile(file))]];
  }))).flat();
}
await writeFile(path.join(results, 'browser-pass.json'), JSON.stringify({
  schema: 1, mode: record ? 'initial-capture-needs-human-review' : 'comparison',
  candidateDigest: before, screenshotsDigest: digest(JSON.stringify(await hashes(screenshots))),
  passed: report.stats.expected, completedAt: new Date().toISOString()
}, null, 2) + '\n');
console.log(record ? 'Captured initial screenshots. Review the HTML report and commit the baseline before refactoring.' : 'Browser functions and screenshots match. Review the report before publication.');
