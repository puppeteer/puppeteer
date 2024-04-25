#!/usr/bin/env node
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-check

'use strict';

import {writeFile, mkdir, copyFile} from 'fs/promises';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

import core from '@actions/core';
import semver from 'semver';

import packageJson from '../packages/puppeteer-core/package.json' assert {type: 'json'};

const codifyAndJoinValues = values => {
  return values
    .map(value => {
      return `\`${value}\``;
    })
    .join(' ,');
};
const formatMessage = value => {
  return value.trim();
};
const removeVersionPrefix = value => {
  return value.startsWith('v') ? value.slice(1) : value;
};

const LAST_PUPPETEER_VERSION = packageJson.version;
if (!LAST_PUPPETEER_VERSION) {
  core.setFailed('No maintained version found.');
}
const LAST_SUPPORTED_NODE_VERSION = packageJson.engines.node;

const SUPPORTED_OSES = ['windows', 'macos', 'linux'];
const SUPPORTED_PACKAGE_MANAGERS = ['yarn', 'npm', 'pnpm'];

const ERROR_MESSAGES = {
  unsupportedOs(value) {
    return formatMessage(`
This issue has an unsupported OS: \`${value}\`. Only the following operating systems are supported: ${codifyAndJoinValues(
      SUPPORTED_OSES
    )}. Please verify the issue on a supported OS and update the form.
`);
  },
  unsupportedPackageManager(value) {
    return formatMessage(`
This issue has an unsupported package manager: \`${value}\`. Only the following package managers are supported: ${codifyAndJoinValues(
      SUPPORTED_PACKAGE_MANAGERS
    )}. Please verify the issue using a supported package manager and update the form.
`);
  },
  invalidPackageManagerVersion(value) {
    return formatMessage(`
This issue has an invalid package manager version: \`${value}\`. Versions must follow [SemVer](https://semver.org/) formatting. Please update the form with a valid version.
`);
  },
  unsupportedNodeVersion(value) {
    return formatMessage(`
This issue has an unsupported Node.js version: \`${value}\`. Only versions satisfying \`${LAST_SUPPORTED_NODE_VERSION}\` are supported. Please verify the issue on a supported version of Node.js and update the form.
`);
  },
  invalidNodeVersion(value) {
    return formatMessage(`
This issue has an invalid Node.js version: \`${value}\`. Versions must follow [SemVer](https://semver.org/) formatting. Please update the form with a valid version.
`);
  },
  unsupportedPuppeteerVersion(value) {
    return formatMessage(`
This issue has an outdated Puppeteer version: \`${value}\`. Please verify your issue on the latest \`${LAST_PUPPETEER_VERSION}\` version. Then update the form accordingly.
`);
  },
  invalidPuppeteerVersion(value) {
    return formatMessage(`
This issue has an invalid Puppeteer version: \`${value}\`. Versions must follow [SemVer](https://semver.org/) formatting. Please update the form with a valid version.
`);
  },
};

(async () => {
  let input = '';
  for await (const chunk of process.stdin.iterator({
    destroyOnReturn: false,
  })) {
    input += chunk;
  }
  input = JSON.parse(input).trim();

  let mvce = '';
  let error = '';
  let configuration = '';
  let puppeteerVersion = '';
  let nodeVersion = '';
  let packageManagerVersion = '';
  let packageManager = '';
  let os = '';
  const behavior = {};
  const lines = input.split('\n');
  {
    /** @type {(value: string) => void} */
    let set = () => {
      return void 0;
    };
    let j = 0;
    let i = 0;
    for (; i < lines.length; ++i) {
      if (lines[i].startsWith('### Bug behavior')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          if (value.match(/\[x\] Flaky/i)) {
            behavior.flaky = true;
          }
          if (value.match(/\[x\] pdf/i)) {
            behavior.noError = true;
          }
        };
      } else if (lines[i].startsWith('### Minimal, reproducible example')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          mvce = value;
        };
      } else if (lines[i].startsWith('### Error string')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          if (value.match(/no error/i)) {
            behavior.noError = true;
          } else {
            error = value;
          }
        };
      } else if (lines[i].startsWith('### Puppeteer configuration')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          configuration = value;
        };
      } else if (lines[i].startsWith('### Puppeteer version')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          puppeteerVersion = removeVersionPrefix(value);
        };
      } else if (lines[i].startsWith('### Node version')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          nodeVersion = removeVersionPrefix(value);
        };
      } else if (lines[i].startsWith('### Package manager version')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          packageManagerVersion = removeVersionPrefix(value);
        };
      } else if (lines[i].startsWith('### Package manager')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          packageManager = value.toLowerCase();
        };
      } else if (lines[i].startsWith('### Operating system')) {
        set(lines.slice(j, i).join('\n').trim());
        j = i + 1;
        set = value => {
          os = value.toLowerCase();
        };
      }
    }
    set(lines.slice(j, i).join('\n').trim());
  }

  let runsOn;
  switch (os) {
    case 'windows':
      runsOn = 'windows-latest';
      break;
    case 'macos':
      runsOn = 'macos-13';
      break;
    case 'linux':
      runsOn = 'ubuntu-latest';
      break;
    default:
      core.setOutput('errorMessage', ERROR_MESSAGES.unsupportedOs(os));
      core.setFailed(`Unsupported OS: ${os}`);
  }

  if (!SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
    core.setOutput(
      'errorMessage',
      ERROR_MESSAGES.unsupportedPackageManager(packageManager)
    );
    core.setFailed(`Unsupported package manager: ${packageManager}`);
  }

  if (!semver.valid(nodeVersion)) {
    core.setOutput(
      'errorMessage',
      ERROR_MESSAGES.invalidNodeVersion(nodeVersion)
    );
    core.setFailed('Invalid Node version');
  }
  if (!semver.satisfies(nodeVersion, LAST_SUPPORTED_NODE_VERSION)) {
    core.setOutput(
      'errorMessage',
      ERROR_MESSAGES.unsupportedNodeVersion(nodeVersion)
    );
    core.setFailed(`Unsupported node version: ${nodeVersion}`);
  }

  if (!semver.valid(puppeteerVersion)) {
    core.setOutput(
      'errorMessage',
      ERROR_MESSAGES.invalidPuppeteerVersion(puppeteerVersion)
    );
    core.setFailed(`Invalid puppeteer version: ${puppeteerVersion}`);
  }
  if (
    !LAST_PUPPETEER_VERSION ||
    semver.lt(puppeteerVersion, LAST_PUPPETEER_VERSION)
  ) {
    core.setOutput(
      'errorMessage',
      ERROR_MESSAGES.unsupportedPuppeteerVersion(puppeteerVersion)
    );
    core.setFailed(`Unsupported puppeteer version: ${puppeteerVersion}`);
  }

  if (!semver.valid(packageManagerVersion)) {
    core.setOutput(
      'errorMessage',
      ERROR_MESSAGES.invalidPackageManagerVersion(packageManagerVersion)
    );
    core.setFailed(`Invalid package manager version: ${packageManagerVersion}`);
  }

  core.setOutput('errorMessage', '');
  core.setOutput('runsOn', runsOn);
  core.setOutput('nodeVersion', nodeVersion);
  core.setOutput('packageManager', packageManager);

  await mkdir('out');
  Promise.all([
    writeFile(join('out', 'main.ts'), mvce.split('\n').slice(1, -1).join('\n')),
    writeFile(join('out', 'puppeteer-error.txt'), error),
    writeFile(
      join('out', 'puppeteer.config.js'),
      configuration.split('\n').slice(1, -1).join('\n')
    ),
    writeFile(join('out', 'puppeteer-behavior.json'), JSON.stringify(behavior)),
    writeFile(
      join('out', 'package.json'),
      JSON.stringify({
        packageManager: `${packageManager}@${packageManagerVersion}`,
        scripts: {
          start: 'tsx main.ts',
          verify: 'tsx verify_issue.ts',
        },
        dependencies: {
          puppeteer: puppeteerVersion,
        },
        devDependencies: {
          tsx: 'latest',
        },
      })
    ),
    copyFile(
      join(
        dirname(fileURLToPath(import.meta.url)),
        'assets',
        'verify_issue.ts'
      ),
      join('out', 'verify_issue.ts')
    ),
  ]);
})();
