import yargs from 'yargs';
import ProgressBar from 'progress';
import {hideBin} from 'yargs/helpers';
import {Browser, BrowserPlatform} from './browsers/types.js';
import {fetch} from './fetch.js';
import path from 'path';

type Arguments = {
  browser: {
    name: Browser;
    revision: string;
  };
  path?: string;
  platform?: BrowserPlatform;
};

export class CLI {
  #cachePath;

  constructor(cachePath = process.cwd()) {
    this.#cachePath = cachePath;
  }

  async run(argv: string[]): Promise<void> {
    await yargs(hideBin(argv))
      .command(
        '$0 install <browser>',
        'run files',
        yargs => {
          yargs.positional('browser', {
            description: 'The browser version',
            type: 'string',
            coerce: (opt): Arguments['browser'] => {
              return {
                name: this.#parseBrowser(opt),
                revision: this.#parseRevision(opt),
              };
            },
          });
        },
        async argv => {
          const args = argv as unknown as Arguments;
          await fetch({
            browser: args.browser.name,
            revision: args.browser.revision,
            platform: args.platform,
            outputDir: path.join(
              args.path ?? this.#cachePath,
              args.browser.name
            ),
            progressCallback: this.#makeProgressBar(
              args.browser.name,
              args.browser.revision
            ),
          });
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
      .parse();
  }

  #parseBrowser(version: string): Browser {
    return version.split('@').shift() as Browser;
  }

  #parseRevision(version: string): string {
    return version.split('@').pop() ?? 'latest';
  }

  #toMegabytes(bytes: number) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 10) / 10} Mb`;
  }

  #makeProgressBar(browser: Browser, revision: string) {
    let progressBar: ProgressBar | null = null;
    let lastDownloadedBytes = 0;
    return (downloadedBytes: number, totalBytes: number) => {
      if (!progressBar) {
        progressBar = new ProgressBar(
          `Downloading ${browser} r${revision} - ${this.#toMegabytes(
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
