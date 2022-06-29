import {
  copyFileSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import {sync} from 'glob';
import {join} from 'path';
import {chdir} from 'process';
import semver from 'semver';
import {versionsPerRelease} from '../versions.js';

function getOffsetAndLimit(
  sectionName: string,
  lines: string[]
): [offset: number, limit: number] {
  const offset =
    lines.findIndex(line => {
      return line.includes(`<!-- ${sectionName}-start -->`);
    }) + 1;
  const limit = lines.slice(offset).findIndex(line => {
    return line.includes(`<!-- ${sectionName}-end -->`);
  });
  return [offset, limit];
}

function spliceIntoSection(
  sectionName: string,
  content: string,
  sectionContent: string
): string {
  const lines = content.split('\n');
  const [offset, limit] = getOffsetAndLimit(sectionName, lines);
  lines.splice(offset, limit, ...sectionContent.split('\n'));
  return lines.join('\n');
}

// Change to root directory
chdir(join(__dirname, '..'));

// README
{
  copyFileSync('README.md', 'docs/index.md');
}

// Chrome Versions
{
  const filename = 'docs/chromium-support.md';
  let content = readFileSync(filename, {encoding: 'utf8'});

  // Generate versions
  const buffer: string[] = [];
  for (const [chromiumVersion, puppeteerVersion] of versionsPerRelease) {
    if (puppeteerVersion === 'NEXT') {
      continue;
    }
    if (semver.lt(puppeteerVersion, '15.0.0')) {
      buffer.push(
        `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://github.com/puppeteer/puppeteer/blob/${puppeteerVersion}/docs/api.md)`
      );
    } else {
      buffer.push(
        `  * Chromium ${chromiumVersion} - Puppeteer ${puppeteerVersion}`
      );
    }
  }
  content = spliceIntoSection('version', content, buffer.join('\n'));

  writeFileSync(filename, content);
}

// Change to documentation directory
chdir('docs/api');

// Remove `index.md` and replace it with `puppeteer.md` since we only have one package.
rmSync('index.md');
renameSync('puppeteer.md', 'index.md');

// Change all links.
for (const file of sync(`./**/*.md`)) {
  let content = readFileSync(file, {encoding: 'utf-8'});

  // Start processing lines
  let lines = content.split('\n');

  // Remove the `auto-generated` commented because docusaurus cannot find the
  // title after it.
  lines = lines.slice(1);

  // Remove the breadcrumb since `docusaurus` makes them.
  lines.splice(
    lines.findIndex(line => {
      return line.includes('[Home](./index.md)');
    }),
    1
  );

  // Stop processing lines.
  content = lines.join('\n');

  // Replace the first header with a `h1` header since they aren't created.
  content = content.replace('##', '#');

  // Replace empty comments since `docusaurus` cannot parse these.
  content = content.replace(/<!-- -->/g, '');

  // Replace boldface with markdown equivalent.
  content = content.replace(/<b>|<\/b>/g, '**');

  if (content.includes('/puppeteer.md')) {
    console.log(content);
    throw new Error(
      'All references to `puppeteer.md` must be replaced with a reference to `index.md`. Check out `utils/generate-docs.ts` for more details.'
    );
  }
  writeFileSync(file, content);
}
