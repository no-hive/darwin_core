import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const outputPath = resolve('docs/changelog.mdx');
const scopes = ['web', 'app', 'tools', 'studio', 'protocols', 'docs', 'repo'];
const labels = {
  web: 'Web',
  app: 'App',
  tools: 'Tools',
  studio: 'Studio',
  protocols: 'Protocols',
  docs: 'Docs',
  repo: 'Repository',
};

function escapeMdxText(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '&#124;')
    .replaceAll('[', '&#91;')
    .replaceAll(']', '&#93;')
    .replaceAll('`', '&#96;')
    .replaceAll('*', '&#42;')
    .replaceAll('_', '&#95;');
}

function repositoryUrl() {
  const repository = process.env.GITHUB_REPOSITORY;
  return repository ? `https://github.com/${repository}` : null;
}

function normalizeTitle(value) {
  const title = value.trim();
  return title ? title[0].toLocaleUpperCase('en-US') + title.slice(1) : title;
}

function parseCommit(line, baseUrl) {
  const [sha, date, ...subjectParts] = line.split('\t');
  const subject = subjectParts.join('\t').trim();

  if (!sha || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !subject) return null;
  if (subject.includes('[skip changelog]')) return null;

  const conventional = subject.match(/^([a-z]+)\(([^)]+)\)(!)?: (.+)$/);
  const scope = conventional?.[2];
  const module = scopes.includes(scope) ? scope : 'repo';
  const description = conventional?.[4] ?? subject;
  const breaking = conventional?.[3] ? ' (breaking change)' : '';
  const href = baseUrl ? `${baseUrl}/commit/${sha}` : null;
  const title = escapeMdxText(`${normalizeTitle(description)}${breaking}`);

  return {
    module,
    date,
    sha,
    entry: href ? `- **${date}** — [${title}](${href})` : `- **${date}** — ${title}`,
  };
}

function monthHeading(date) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function renderTab(scope, commits) {
  const entries = commits.filter((commit) => commit.module === scope);
  const groups = new Map();

  for (const commit of entries) {
    const heading = monthHeading(commit.date);
    if (!groups.has(heading)) groups.set(heading, []);
    groups.get(heading).push(commit.entry);
  }

  const content = groups.size
    ? [...groups].map(([heading, rows]) => `## ${heading}\n\n${rows.join('\n')}`).join('\n\n')
    : `No recorded commits for ${labels[scope]} yet.`;

  return `<Tab title="${labels[scope]}">\n${content}\n</Tab>`;
}

const log = readFileSync(0, 'utf8').trimEnd();
const baseUrl = repositoryUrl();
const commits = log.split('\n').map((line) => parseCommit(line, baseUrl)).filter(Boolean);

const markdown = [
  '---',
  'title: "Changelog"',
  'description: "Repository changes grouped by module and commit date."',
  '---',
  '',
  'Select a module to browse its commit history. Entries are generated automatically from commit messages on `main`.',
  '',
  '<Tabs sync={false}>',
  ...scopes.map((scope) => renderTab(scope, commits)),
  '</Tabs>',
  '',
].join('\n');

let current = '';
try {
  current = readFileSync(outputPath, 'utf8');
} catch {
  // The first run can create the page when it does not exist yet.
}

if (current !== markdown) writeFileSync(outputPath, markdown);

console.log(`Rendered ${commits.length} commit entries into ${outputPath}`);
