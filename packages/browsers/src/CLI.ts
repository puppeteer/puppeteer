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

import ProgressBar from 'progress';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import {resolveBuildId} from './browsers/browsers.js';
import {Browser, BrowserPlatform} from './browsers/types.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import {fetch} from './fetch.js';
import {computeExecutablePath, launch} from './launcher.js';

type InstallArgs = {
  browser: {
    name: Browser;
    buildId: string;
  };
  path?: string;
  platform?: BrowserPlatform;
};

type LaunchArgs = {
  browser: {
    name: Browser;
    buildId: string;
  };
  path?: string;
  platform?: BrowserPlatform;
  detached: boolean;
};

export class CLI {
  #cachePath;

  constructor(cachePath = process.cwd()) {
    this.#cachePath = cachePath;
  }

  async run(argv: string[]): Promise<void> {
    await yargs(hideBin(argv))
      .command(
        'install <browser>',
        'Download and install the specified browser',
        yargs => {
          yargs.positional('browser', {
            description: 'The browser version',
            type: 'string',
            coerce: (opt): InstallArgs['browser'] => {
              return {
                name: this.#parseBrowser(opt),
                buildId: this.#parseBuildId(opt),
              };
            },
          });
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
          await fetch({
            browser: args.browser.name,
            buildId: args.browser.buildId,
            platform: args.platform,
            cacheDir: args.path ?? this.#cachePath,
            downloadProgressCallback: this.#makeProgressCallback(
              args.browser.name,
              args.browser.buildId
            ),
          });
          console.log(
            `${args.browser.name}@${args.browser.buildId} downloaded successfully.`
          );
        }
      )
      .option('path', {
        type: 'string',
        desc: 'Path where the browsers will be downloaded to and installed from',
        default: process.cwd(),
      })
      .option('platform', {
        type: 'string',
        desc: 'Platform that the binary needs to be compatible with.',
        choices: Object.values(BrowserPlatform),
        defaultDescription: 'Auto-detected by default.',
      })
      .command(
        'launch <browser>',
        'Launch the specified browser',
        yargs => {
          yargs.positional('browser', {
            description: 'The browser version',
            type: 'string',
            coerce: (opt): LaunchArgs['browser'] => {
              return {
                name: this.#parseBrowser(opt),
                buildId: this.#parseBuildId(opt),
              };
            },
          });
        },
        async argv => {
          const args = argv as unknown as LaunchArgs;
          const executablePath = computeExecutablePath({
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
      .option('path', {
        type: 'string',
        desc: 'Path where the browsers will be downloaded to and installed from',
        default: process.cwd(),
      })
      .option('detached', {
        type: 'boolean',
        desc: 'Whether to detach the child process.',
        default: false,
      })
      .option('platform', {
        type: 'string',
        desc: 'Platform that the binary needs to be compatible with.',
        choices: Object.values(BrowserPlatform),
        defaultDescription: 'Auto-detected by default.',
      })
      .parse();
  }

  #parseBrowser(version: string): Browser {
    return version.split('@').shift() as Browser;
  }

  #parseBuildId(version: string): string {
    return version.split('@').pop() ?? 'latest';
  }

  #toMegabytes(bytes: number) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 10) / 10} Mb`;
  }

  #makeProgressCallback(browser: Browser, buildId: string) {
    let progressBar: ProgressBar;
    let lastDownloadedBytes = 0;
    return (downloadedBytes: number, totalBytes: number) => {
      if (!progressBar) {
        progressBar = new ProgressBar(
          `Downloading ${browser} r${buildId} - ${this.#toMegabytes(
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
}
