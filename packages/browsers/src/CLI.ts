/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {stdin as input, stdout as output} from 'process';
import * as readline from 'readline';

import ProgressBar from 'progress';
import type * as Yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import yargs from 'yargs/yargs';

import {
  resolveBuildId,
  Browser,
  BrowserPlatform,
  ChromeReleaseChannel,
} from './browser-data/browser-data.js';
import {Cache} from './Cache.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import {install} from './install.js';
import {
  computeExecutablePath,
  computeSystemExecutablePath,
  launch,
} from './launch.js';

type InstallArgs = {
  browser: {
    name: Browser;
    buildId: string;
  };
  path?: string;
  platform?: BrowserPlatform;
  baseUrl?: string;
};

type LaunchArgs = {
  browser: {
    name: Browser;
    buildId: string;
  };
  path?: string;
  platform?: BrowserPlatform;
  detached: boolean;
  system: boolean;
};

type ClearArgs = {
  path?: string;
};

/**
 * @public
 */
export class CLI {
  #cachePath;
  #rl?: readline.Interface;

  constructor(cachePath = process.cwd(), rl?: readline.Interface) {
    this.#cachePath = cachePath;
    this.#rl = rl;
  }

  #defineBrowserParameter(yargs: Yargs.Argv<unknown>): void {
    yargs.positional('browser', {
      description:
        'Which browser to install <browser>[@<buildId|latest>]. `latest` will try to find the latest available build. `buildId` is a browser-specific identifier such as a version or a revision.',
      type: 'string',
      coerce: (opt): InstallArgs['browser'] => {
        return {
          name: this.#parseBrowser(opt),
          buildId: this.#parseBuildId(opt),
        };
      },
    });
  }

  #definePlatformParameter(yargs: Yargs.Argv<unknown>): void {
    yargs.option('platform', {
      type: 'string',
      desc: 'Platform that the binary needs to be compatible with.',
      choices: Object.values(BrowserPlatform),
      defaultDescription: 'Auto-detected',
    });
  }

  #definePathParameter(yargs: Yargs.Argv<unknown>, required = false): void {
    yargs.option('path', {
      type: 'string',
      desc: 'Path to the root folder for the browser downloads and installation. The installation folder structure is compatible with the cache structure used by Puppeteer.',
      defaultDescription: 'Current working directory',
      ...(required ? {} : {default: process.cwd()}),
    });
    if (required) {
      yargs.demandOption('path');
    }
  }

  async run(argv: string[]): Promise<void> {
    const yargsInstance = yargs(hideBin(argv));
    await yargsInstance
      .scriptName('@puppeteer/browsers')
      .command(
        'install <browser>',
        'Download and install the specified browser. If successful, the command outputs the actual browser buildId that was installed and the absolute path to the browser executable (format: <browser>@<buildID> <path>).',
        yargs => {
          this.#defineBrowserParameter(yargs);
          this.#definePlatformParameter(yargs);
          this.#definePathParameter(yargs);
          yargs.option('base-url', {
            type: 'string',
            desc: 'Base URL to download from',
          });
          yargs.example(
            '$0 install chrome',
            'Install the latest available build of the Chrome browser.'
          );
          yargs.example(
            '$0 install chrome@latest',
            'Install the latest available build for the Chrome browser.'
          );
          yargs.example(
            '$0 install chromium@1083080',
            'Install the revision 1083080 of the Chromium browser.'
          );
          yargs.example(
            '$0 install firefox',
            'Install the latest available build of the Firefox browser.'
          );
          yargs.example(
            '$0 install firefox --platform mac',
            'Install the latest Mac (Intel) build of the Firefox browser.'
          );
          yargs.example(
            '$0 install firefox --path /tmp/my-browser-cache',
            'Install to the specified cache directory.'
          );
        },
        async argv => {
          const args = argv as unknown as InstallArgs;
          args.platform ??= detectBrowserPlatform();
          if (!args.platform) {
            throw new Error(`Could not resolve the current platform`);
          }
          args.browser.buildId = await resolveBuildId(
            args.browser.name,
            args.platform,
            args.browser.buildId
          );
          await install({
            browser: args.browser.name,
            buildId: args.browser.buildId,
            platform: args.platform,
            cacheDir: args.path ?? this.#cachePath,
            downloadProgressCallback: makeProgressCallback(
              args.browser.name,
              args.browser.buildId
            ),
            baseUrl: args.baseUrl,
          });
          console.log(
            `${args.browser.name}@${
              args.browser.buildId
            } ${computeExecutablePath({
              browser: args.browser.name,
              buildId: args.browser.buildId,
              cacheDir: args.path ?? this.#cachePath,
              platform: args.platform,
            })}`
          );
        }
      )
      .command(
        'launch <browser>',
        'Launch the specified browser',
        yargs => {
          this.#defineBrowserParameter(yargs);
          this.#definePlatformParameter(yargs);
          this.#definePathParameter(yargs);
          yargs.option('detached', {
            type: 'boolean',
            desc: 'Detach the child process.',
            default: false,
          });
          yargs.option('system', {
            type: 'boolean',
            desc: 'Search for a browser installed on the system instead of the cache folder.',
            default: false,
          });
          yargs.example(
            '$0 launch chrome@1083080',
            'Launch the Chrome browser identified by the revision 1083080.'
          );
          yargs.example(
            '$0 launch firefox@112.0a1',
            'Launch the Firefox browser identified by the milestone 112.0a1.'
          );
          yargs.example(
            '$0 launch chrome@1083080 --detached',
            'Launch the browser but detach the sub-processes.'
          );
          yargs.example(
            '$0 launch chrome@canary --system',
            'Try to locate the Canary build of Chrome installed on the system and launch it.'
          );
        },
        async argv => {
          const args = argv as unknown as LaunchArgs;
          const executablePath = args.system
            ? computeSystemExecutablePath({
                browser: args.browser.name,
                // TODO: throw an error if not a ChromeReleaseChannel is provided.
                channel: args.browser.buildId as ChromeReleaseChannel,
                platform: args.platform,
              })
            : computeExecutablePath({
                browser: args.browser.name,
                buildId: args.browser.buildId,
                cacheDir: args.path ?? this.#cachePath,
                platform: args.platform,
              });
          launch({
            executablePath,
            detached: args.detached,
          });
        }
      )
      .command(
        'clear',
        'Removes all installed browsers from the specified cache directory',
        yargs => {
          this.#definePathParameter(yargs, true);
        },
        async argv => {
          const args = argv as unknown as ClearArgs;
          const cacheDir = args.path ?? this.#cachePath;
          const rl = this.#rl ?? readline.createInterface({input, output});
          rl.question(
            `Do you want to permanently and recursively delete the content of ${cacheDir} (yes/No)? `,
            answer => {
              rl.close();
              if (!['y', 'yes'].includes(answer.toLowerCase().trim())) {
                console.log('Cancelled.');
                return;
              }
              const cache = new Cache(cacheDir);
              cache.clear();
              console.log(`${cacheDir} cleared.`);
            }
          );
        }
      )
      .demandCommand(1)
      .help()
      .wrap(Math.min(120, yargsInstance.terminalWidth()))
      .parse();
  }

  #parseBrowser(version: string): Browser {
    return version.split('@').shift() as Browser;
  }

  #parseBuildId(version: string): string {
    const parts = version.split('@');
    return parts.length === 2 ? parts[1]! : 'latest';
  }
}

/**
 * @public
 */
export function makeProgressCallback(
  browser: Browser,
  buildId: string
): (downloadedBytes: number, totalBytes: number) => void {
  let progressBar: ProgressBar;
  let lastDownloadedBytes = 0;
  return (downloadedBytes: number, totalBytes: number) => {
    if (!progressBar) {
      progressBar = new ProgressBar(
        `Downloading ${browser} r${buildId} - ${toMegabytes(
          totalBytes
        )} [:bar] :percent :etas `,
        {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: totalBytes,
        }
      );
    }
    const delta = downloadedBytes - lastDownloadedBytes;
    lastDownloadedBytes = downloadedBytes;
    progressBar.tick(delta);
  };
}

function toMegabytes(bytes: number) {
  const mb = bytes / 1000 / 1000;
  return `${Math.round(mb * 10) / 10} MB`;
}
