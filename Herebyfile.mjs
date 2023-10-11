import {copyFile, mkdir, readFile, writeFile} from 'fs/promises';

import {execa} from 'execa';
import {task} from 'hereby';
import semver from 'semver';

import {docgen, spliceIntoSection} from '@puppeteer/docgen';

export const docsNgSchematicsTask = task({
  name: 'docs:ng-schematics',
  run: async () => {
    const readme = await readFile('packages/ng-schematics/README.md', 'utf-8');
    const index = await readFile('docs/integrations/ng-schematics.md', 'utf-8');
    await writeFile(
      'docs/integrations/ng-schematics.md',
      index.replace('# API Reference\n', readme)
    );
  },
});

export const docsChromiumSupportTask = task({
  name: 'docs:chromium-support',
  run: async () => {
    const content = await readFile('docs/chromium-support.md', {
      encoding: 'utf8',
    });
    const {versionsPerRelease} = await import('./versions.js');
    const versionsArchived = JSON.parse(
      await readFile('website/versionsArchived.json', 'utf8')
    );
    const buffer = [];
    for (const [chromiumVersion, puppeteerVersion] of versionsPerRelease) {
      if (puppeteerVersion === 'NEXT') {
        continue;
      }
      if (versionsArchived.includes(puppeteerVersion.substring(1))) {
        if (semver.gte(puppeteerVersion, '20.0.0')) {
          buffer.push(
            `  * [Chrome for Testing](https://goo.gle/chrome-for-testing) ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://pptr.dev/${puppeteerVersion.slice(
              1
            )})`
          );
        } else {
          buffer.push(
            `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://github.com/puppeteer/puppeteer/blob/${puppeteerVersion}/docs/api/index.md)`
          );
        }
      } else if (semver.lt(puppeteerVersion, '15.0.0')) {
        buffer.push(
          `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://github.com/puppeteer/puppeteer/blob/${puppeteerVersion}/docs/api.md)`
        );
      } else if (semver.gte(puppeteerVersion, '15.3.0')) {
        buffer.push(
          `  * [Chrome for Testing](https://goo.gle/chrome-for-testing) ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://pptr.dev/${puppeteerVersion.slice(
            1
          )})`
        );
      } else {
        buffer.push(
          `  * Chromium ${chromiumVersion} - Puppeteer ${puppeteerVersion}`
        );
      }
    }
    await writeFile(
      'docs/chromium-support.md',
      spliceIntoSection('version', content, buffer.join('\n'))
    );
  },
});

export const docsTask = task({
  name: 'docs',
  dependencies: [docsNgSchematicsTask, docsChromiumSupportTask],
  run: async () => {
    // Copy main page.
    await copyFile('README.md', 'docs/index.md');

    // Generate documentation
    await Promise.all(
      [
        ['browsers', 'browsers-api'],
        ['puppeteer', 'api'],
      ].map(async ([name, folder]) => {
        return await docgen(`docs/${name}.api.json`, `docs/${folder}`);
      })
    );

    // Update main @puppeteer/browsers page.
    await mkdir('docs/browsers-api', {recursive: true});
    const readme = await readFile('packages/browsers/README.md', 'utf-8');
    const index = await readFile('docs/browsers-api/index.md', 'utf-8');
    await writeFile(
      'docs/browsers-api/index.md',
      index.replace('# API Reference\n', readme)
    );

    // Format everything.
    await execa('prettier', ['--ignore-path', 'none', '--write', 'docs']);
  },
});
