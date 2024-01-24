import {copyFile, readFile, writeFile} from 'fs/promises';

import {execa} from 'execa';
import {task} from 'hereby';
import semver from 'semver';

import {docgen, spliceIntoSection} from '@puppeteer/docgen';

export const docsNgSchematicsTask = task({
  name: 'docs:ng-schematics',
  run: async () => {
    const readme = await readFile('packages/ng-schematics/README.md', 'utf-8');
    await writeFile('docs/integrations/ng-schematics.md', readme);
  },
});

/**
 * This logic should match the one in `website/docusaurus.config.js`.
 */
function getApiUrl(version) {
  if (semver.gte(version, '19.3.0')) {
    return `https://github.com/puppeteer/puppeteer/blob/puppeteer-${version}/docs/api/index.md`;
  } else if (semver.gte(version, '15.3.0')) {
    return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api/index.md`;
  } else {
    return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api.md`;
  }
}

export const docsChromiumSupportTask = task({
  name: 'docs:chromium-support',
  run: async () => {
    const content = await readFile('docs/chromium-support.md', {
      encoding: 'utf8',
    });
    const {versionsPerRelease} = await import('./versions.js');
    const buffer = [];
    for (const [chromiumVersion, puppeteerVersion] of versionsPerRelease) {
      if (puppeteerVersion === 'NEXT') {
        continue;
      }
      if (semver.gte(puppeteerVersion, '20.0.0')) {
        buffer.push(
          `  * [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](${getApiUrl(
            puppeteerVersion
          )})`
        );
      } else {
        buffer.push(
          `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](${getApiUrl(
            puppeteerVersion
          )})`
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
    for (const [name, folder] of [
      ['browsers', 'browsers-api'],
      ['puppeteer', 'api'],
    ]) {
      docgen(`docs/${name}.api.json`, `docs/${folder}`);
    }

    // Update main @puppeteer/browsers page.
    const readme = await readFile('packages/browsers/README.md', 'utf-8');
    const index = await readFile('docs/browsers-api/index.md', 'utf-8');
    await writeFile(
      'docs/browsers-api/index.md',
      index.replace('# API Reference', readme)
    );

    // Format everything.
    await execa('prettier', ['--ignore-path', 'none', '--write', 'docs']);
  },
});
