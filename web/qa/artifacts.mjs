import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
const baselineFile = path.join(ROOT, 'qa/baseline/artifacts.json');
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}
export async function inventory() {
  const files = [...await walk(path.join(ROOT, 'dist')), path.join(ROOT, '.openai/hosting.json')].sort();
  return Object.fromEntries(await Promise.all(files.map(async file => {
    const bytes = await readFile(file);
    return [path.relative(ROOT, file).split(path.sep).join('/'), { sha256: digest(bytes), bytes: bytes.length }];
  })));
}
export function compare(expected, actual) {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort().flatMap(file => {
    if (!expected[file]) return [{ file, change: 'added' }];
    if (!actual[file]) return [{ file, change: 'removed' }];
    return expected[file].sha256 === actual[file].sha256 ? [] : [{ file, change: 'changed' }];
  });
}
export async function checkArtifacts() {
  const baseline = JSON.parse(await readFile(baselineFile, 'utf8'));
  if (baseline.schema !== 1) throw Error('Unsupported artifact baseline schema');
  const actual = await inventory();
  return { baseline, actual, changes: compare(baseline.files, actual), candidateDigest: digest(JSON.stringify(actual)) };
}
async function main() {
  const command = process.argv[2];
  if (command === 'record-initial') {
    try { await readFile(baselineFile); throw Error('Baseline already exists. Never overwrite it automatically.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const files = await inventory();
    const baseline = {
      schema: 1,
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
      createdAt: new Date().toISOString(),
      description: 'Exact generated output before refactoring. This is not a screenshot baseline.',
      files
    };
    await mkdir(path.dirname(baselineFile), { recursive: true });
    await writeFile(baselineFile, JSON.stringify(baseline, null, 2) + '\n', { flag: 'wx' });
    console.log(`Recorded ${Object.keys(files).length} deployment files.`);
    return;
  }
  if (command !== 'check') throw Error('Usage: node qa/artifacts.mjs record-initial|check');
  const result = await checkArtifacts();
  await mkdir(path.join(ROOT, 'qa/results'), { recursive: true });
  await writeFile(path.join(ROOT, 'qa/results/artifacts.json'), JSON.stringify({
    baselineCommit: result.baseline.sourceCommit,
    candidateDigest: result.candidateDigest,
    changes: result.changes
  }, null, 2) + '\n');
  if (result.changes.length) {
    console.error('Deployment differs from the preservation baseline:');
    for (const item of result.changes) console.error(`${item.change}: ${item.file}`);
    console.error('Review the diff and run browser regression. Do not automatically replace the baseline.');
    process.exitCode = 1;
  } else console.log(`UNCHANGED: ${Object.keys(result.actual).length} deployment files match the baseline byte for byte.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
