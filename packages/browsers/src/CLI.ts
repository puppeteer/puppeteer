/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {stdin as input, stdout as output} from 'node:process';
import * as readline from 'node:readline';

import ProgressBar from 'progress';
import type * as Yargs from 'yargs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import {
  resolveBuildId,
  type Browser,
  BrowserPlatform,
  type ChromeReleaseChannel,
} from './browser-data/browser-data.js';
import {Cache} from './Cache.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import {install} from './install.js';
import {
  computeExecutablePath,
  computeSystemExecutablePath,
  launch,
} from './launch.js';

interface InstallBrowser {
  name: Browser;
  buildId: string;
}
interface InstallArgs {
  browser?: InstallBrowser;
  path?: string;
  platform?: BrowserPlatform;
  baseUrl?: string;
  installDeps?: boolean;
}

/**
 * @public
 */
export class CLI {
  #cachePath: string;
  #rl?: readline.Interface;
  #scriptName: string;
  #allowCachePathOverride: boolean;
  #pinnedBrowsers?: Partial<
    Record<
      Browser,
      {
        buildId: string;
        skipDownload: boolean;
      }
    >
  >;
  #prefixCommand?: {cmd: string; description: string};

  constructor(
    opts?:
      | string
      | {
          cachePath?: string;
          scriptName?: string;
          prefixCommand?: {cmd: string; description: string};
          allowCachePathOverride?: boolean;
          pinnedBrowsers?: Partial<
            Record<
              Browser,
              {
                buildId: string;
                skipDownload: boolean;
              }
            >
          >;
        },
    rl?: readline.Interface,
  ) {
    if (!opts) {
      opts = {};
    }
    if (typeof opts === 'string') {
      opts = {
        cachePath: opts,
      };
    }
    this.#cachePath = opts.cachePath ?? process.cwd();
    this.#rl = rl;
    this.#scriptName = opts.scriptName ?? '@puppeteer/browsers';
    this.#allowCachePathOverride = opts.allowCachePathOverride ?? true;
    this.#pinnedBrowsers = opts.pinnedBrowsers;
    this.#prefixCommand = opts.prefixCommand;
  }

  #defineBrowserParameter<T>(
    yargs: Yargs.Argv<T>,
    required: true,
  ): Yargs.Argv<T & {browser: InstallBrowser}>;
  #defineBrowserParameter<T>(
    yargs: Yargs.Argv<T>,
    required: boolean,
  ): Yargs.Argv<T & {browser: InstallBrowser | undefined}>;
  #defineBrowserParameter<T>(yargs: Yargs.Argv<T>, required: boolean) {
    return yargs.positional('browser', {
      description:
        'Which browser to install <browser>[@<buildId|latest>]. `latest` will try to find the latest available build. `buildId` is a browser-specific identifier such as a version or a revision.',
      type: 'string',
      coerce: (opt): InstallBrowser => {
        return {
          name: this.#parseBrowser(opt),
          buildId: this.#parseBuildId(opt),
        };
      },
      demandOption: required,
    });
  }

  #definePlatformParameter<T>(yargs: Yargs.Argv<T>) {
    return yargs.option('platform', {
      type: 'string',
      desc: 'Platform that the binary needs to be compatible with.',
      choices: Object.values(BrowserPlatform),
      defaultDescription: 'Auto-detected',
    });
  }

  #definePathParameter<T>(yargs: Yargs.Argv<T>, required = false) {
    if (!this.#allowCachePathOverride) {
      return yargs as Yargs.Argv<T & {path: undefined}>;
    }

    return yargs.option('path', {
      type: 'string',
      desc: 'Path to the root folder for the browser downloads and installation. If a relative path is provided, it will be resolved relative to the current working directory. The installation folder structure is compatible with the cache structure used by Puppeteer.',
      defaultDescription: 'Current working directory',
      ...(required ? {} : {default: process.cwd()}),
      demandOption: required,
    });
  }

  async run(argv: string[]): Promise<void> {
    const yargsInstance = yargs(hideBin(argv));
    let target = yargsInstance.scriptName(this.#scriptName);
    if (this.#prefixCommand) {
      target = target.command(
        this.#prefixCommand.cmd,
        this.#prefixCommand.description,
        yargs => {
          return this.#build(yargs);
        },
      );
    } else {
      target = this.#build(target);
    }
    await target
      .demandCommand(1)
      .help()
      .wrap(Math.min(120, yargsInstance.terminalWidth()))
      .parseAsync();
  }

  #build(yargs: Yargs.Argv<unknown>) {
    const latestOrPinned = this.#pinnedBrowsers ? 'pinned' : 'latest';
    // If there are pinned browsers allow the positional arg to be optional
    const browserArgType = this.#pinnedBrowsers ? '[browser]' : '<browser>';
    return yargs
      .command(
        `install ${browserArgType}`,
        'Download and install the specified browser. If successful, the command outputs the actual browser buildId that was installed and the absolute path to the browser executable (format: <browser>@<buildID> <path>).',
        yargs => {
          if (this.#pinnedBrowsers) {
            yargs.example('$0 install', 'Install all pinned browsers');
          }
          yargs
            .example(
              '$0 install chrome',
              `Install the ${latestOrPinned} available build of the Chrome browser.`,
            )
            .example(
              '$0 install chrome@latest',
              'Install the latest available build for the Chrome browser.',
            )
            .example(
              '$0 install chrome@stable',
              'Install the latest available build for the Chrome browser from the stable channel.',
            )
            .example(
              '$0 install chrome@beta',
              'Install the latest available build for the Chrome browser from the beta channel.',
            )
            .example(
              '$0 install chrome@dev',
              'Install the latest available build for the Chrome browser from the dev channel.',
            )
            .example(
              '$0 install chrome@canary',
              'Install the latest available build for the Chrome Canary browser.',
            )
            .example(
              '$0 install chrome@115',
              'Install the latest available build for Chrome 115.',
            )
            .example(
              '$0 install chromedriver@canary',
              'Install the latest available build for ChromeDriver Canary.',
            )
            .example(
              '$0 install chromedriver@115',
              'Install the latest available build for ChromeDriver 115.',
            )
            .example(
              '$0 install chromedriver@115.0.5790',
              'Install the latest available patch (115.0.5790.X) build for ChromeDriver.',
            )
            .example(
              '$0 install chrome-headless-shell',
              'Install the latest available chrome-headless-shell build.',
            )
            .example(
              '$0 install chrome-headless-shell@beta',
              'Install the latest available chrome-headless-shell build corresponding to the Beta channel.',
            )
            .example(
              '$0 install chrome-headless-shell@118',
              'Install the latest available chrome-headless-shell 118 build.',
            )
            .example(
              '$0 install chromium@1083080',
              'Install the revision 1083080 of the Chromium browser.',
            )
            .example(
              '$0 install firefox',
              'Install the latest nightly available build of the Firefox browser.',
            )
            .example(
              '$0 install firefox@stable',
              'Install the latest stable build of the Firefox browser.',
            )
            .example(
              '$0 install firefox@beta',
              'Install the latest beta build of the Firefox browser.',
            )
            .example(
              '$0 install firefox@devedition',
              'Install the latest devedition build of the Firefox browser.',
            )
            .example(
              '$0 install firefox@esr',
              'Install the latest ESR build of the Firefox browser.',
            )
            .example(
              '$0 install firefox@nightly',
              'Install the latest nightly build of the Firefox browser.',
            )
            .example(
              '$0 install firefox@stable_111.0.1',
              'Install a specific version of the Firefox browser.',
            )
            .example(
              '$0 install firefox --platform mac',
              'Install the latest Mac (Intel) build of the Firefox browser.',
            );
          if (this.#allowCachePathOverride) {
            yargs.example(
              '$0 install firefox --path /tmp/my-browser-cache',
              'Install to the specified cache directory.',
            );
          }

          const yargsWithBrowserParam = this.#defineBrowserParameter(
            yargs,
            !Boolean(this.#pinnedBrowsers),
          );
          const yargsWithPlatformParam = this.#definePlatformParameter(
            yargsWithBrowserParam,
          );
          return this.#definePathParameter(yargsWithPlatformParam, false)
            .option('base-url', {
              type: 'string',
              desc: 'Base URL to download from',
            })
            .option('install-deps', {
              type: 'boolean',
              desc: 'Whether to attempt installing system dependencies (only supported on Linux, requires root privileges).',
              default: false,
            });
        },
        async args => {
          if (this.#pinnedBrowsers && !args.browser) {
            // Use allSettled to avoid scenarios that
            // a browser may fail early and leave the other
            // installation in a faulty state
            const result = await Promise.allSettled(
              Object.entries(this.#pinnedBrowsers).map(
                async ([browser, options]) => {
                  if (options.skipDownload) {
                    return;
                  }
                  await this.#install({
                    ...args,
                    browser: {
                      name: browser as Browser,
                      buildId: options.buildId,
                    },
                  });
                },
              ),
            );

            for (const install of result) {
              if (install.status === 'rejected') {
                throw install.reason;
              }
            }
          } else {
            await this.#install(args);
          }
        },
      )
      .command(
        'launch <browser>',
        'Launch the specified browser',
        yargs => {
          yargs
            .example(
              '$0 launch chrome@115.0.5790.170',
              'Launch Chrome 115.0.5790.170',
            )
            .example(
              '$0 launch firefox@112.0a1',
              'Launch the Firefox browser identified by the milestone 112.0a1.',
            )
            .example(
              '$0 launch chrome@115.0.5790.170 --detached',
              'Launch the browser but detach the sub-processes.',
            )
            .example(
              '$0 launch chrome@canary --system',
              'Try to locate the Canary build of Chrome installed on the system and launch it.',
            )
            .example(
              '$0 launch chrome@115.0.5790.170 -- --version',
              'Launch Chrome 115.0.5790.170 and pass custom argument to the binary.',
            );

          const yargsWithExtraAgs = yargs.parserConfiguration({
            'populate--': true,
            // Yargs does not have the correct overload for this.
          }) as Yargs.Argv<{'--': Array<string | number>}>;
          const yargsWithBrowserParam = this.#defineBrowserParameter(
            yargsWithExtraAgs,
            true,
          );
          const yargsWithPlatformParam = this.#definePlatformParameter(
            yargsWithBrowserParam,
          );
          return this.#definePathParameter(yargsWithPlatformParam)
            .option('detached', {
              type: 'boolean',
              desc: 'Detach the child process.',
              default: false,
            })
            .option('system', {
              type: 'boolean',
              desc: 'Search for a browser installed on the system instead of the cache folder.',
              default: false,
            })
            .option('dumpio', {
              type: 'boolean',
              desc: "Forwards the browser's process stdout and stderr",
              default: false,
            });
        },
        async args => {
          const extraArgs = args['--'].filter(arg => {
            return typeof arg === 'string';
          });

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
            args: extraArgs,
            executablePath,
            dumpio: args.dumpio,
            detached: args.detached,
          });
        },
      )
      .command(
        'clear',
        this.#allowCachePathOverride
          ? 'Removes all installed browsers from the specified cache directory'
          : `Removes all installed browsers from ${this.#cachePath}`,
        yargs => {
          return this.#definePathParameter(yargs, true);
        },
        async args => {
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
            },
          );
        },
      )
      .command(
        'list',
        'List all installed browsers in the cache directory',
        yargs => {
          yargs.example(
            '$0 list',
            'List all installed browsers in the cache directory',
          );
          if (this.#allowCachePathOverride) {
            yargs.example(
              '$0 list --path /tmp/my-browser-cache',
              'List browsers installed in the specified cache directory',
            );
          }

          return this.#definePathParameter(yargs);
        },
        async args => {
          const cacheDir = args.path ?? this.#cachePath;
          const cache = new Cache(cacheDir);
          const browsers = cache.getInstalledBrowsers();

          for (const browser of browsers) {
            console.log(
              `${browser.browser}@${browser.buildId} (${browser.platform}) ${browser.executablePath}`,
            );
          }
        },
      )
      .demandCommand(1)
      .help();
  }

  #parseBrowser(version: string): Browser {
    return version.split('@').shift() as Browser;
  }

  #parseBuildId(version: string): string {
    const parts = version.split('@');
    return parts.length === 2
      ? parts[1]!
      : this.#pinnedBrowsers
        ? 'pinned'
        : 'latest';
  }

  async #install(args: InstallArgs) {
    args.platform ??= detectBrowserPlatform();
    if (!args.browser) {
      throw new Error(`No browser arg provided`);
    }
    if (!args.platform) {
      throw new Error(`Could not resolve the current platform`);
    }
    if (args.browser.buildId === 'pinned') {
      const options = this.#pinnedBrowsers?.[args.browser.name];
      if (!options || !options.buildId) {
        throw new Error(`No pinned version found for ${args.browser.name}`);
      }
      args.browser.buildId = options.buildId;
    }
    const originalBuildId = args.browser.buildId;
    args.browser.buildId = await resolveBuildId(
      args.browser.name,
      args.platform,
      args.browser.buildId,
    );
    await install({
      browser: args.browser.name,
      buildId: args.browser.buildId,
      platform: args.platform,
      cacheDir: args.path ?? this.#cachePath,
      downloadProgressCallback: makeProgressCallback(
        args.browser.name,
        args.browser.buildId,
      ),
      baseUrl: args.baseUrl,
      buildIdAlias:
        originalBuildId !== args.browser.buildId ? originalBuildId : undefined,
      installDeps: args.installDeps,
    });
    console.log(
      `${args.browser.name}@${args.browser.buildId} ${computeExecutablePath({
        browser: args.browser.name,
        buildId: args.browser.buildId,
        cacheDir: args.path ?? this.#cachePath,
        platform: args.platform,
      })}`,
    );
  }
}

/**
 * @public
 */
export function makeProgressCallback(
  browser: Browser,
  buildId: string,
): (downloadedBytes: number, totalBytes: number) => void {
  let progressBar: ProgressBar;
  let lastDownloadedBytes = 0;
  return (downloadedBytes: number, totalBytes: number) => {
    if (!progressBar) {
      progressBar = new ProgressBar(
        `Downloading ${browser} ${buildId} - ${toMegabytes(
          totalBytes,
        )} [:bar] :percent :etas `,
        {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: totalBytes,
        },
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
