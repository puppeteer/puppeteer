/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import { Product } from './Product.ts';
import { debug } from './Debug.ts';

import { assert } from './assert.ts';

import { sprintf } from 'https://deno.land/std@0.83.0/fmt/printf.ts';
import { existsSync, exists } from 'https://deno.land/std@0.83.0/fs/exists.ts';
import { join } from 'https://deno.land/std@0.83.0/path/mod.ts';

const debugFetcher = debug(`puppeteer:fetcher`);

const downloadURLs = {
  chrome: {
    linux: '%s/chromium-browser-snapshots/Linux_x64/%d/%s.zip',
    darwin: '%s/chromium-browser-snapshots/Mac/%d/%s.zip',
    windows: '%s/chromium-browser-snapshots/Win_x64/%d/%s.zip',
  },
  firefox: {
    linux: '%s/firefox-%s.en-US.%s-x86_64.tar.bz2',
    darwin: '%s/firefox-%s.en-US.%s.dmg',
    windows: '%s/firefox-%s.en-US.%s.zip',
  },
} as const;
const browserConfig = {
  chrome: {
    host: 'https://storage.googleapis.com',
    destination: '.local-chromium',
  },
  firefox: {
    host:
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central',
    destination: '.local-firefox',
  },
} as const;

function archiveName(
  product: Product,
  platform: typeof Deno.build.os,
  revision: string
): string {
  if (product === 'chrome') {
    if (platform === 'linux') return 'chrome-linux';
    if (platform === 'darwin') return 'chrome-mac';
    if (platform === 'windows') {
      // Windows archive name changed at r591479.
      return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
    }
  } else if (product === 'firefox') {
    return platform;
  }
  assert(false, 'unreachable');
}

/**
 * @internal
 */
function downloadURL(
  product: Product,
  platform: typeof Deno.build.os,
  host: string,
  revision: string
): string {
  const url = sprintf(
    downloadURLs[product][Deno.build.os],
    host,
    revision,
    archiveName(product, platform, revision)
  );
  return url;
}

/**
 * @internal
 */
function handleArm64(): void {
  if (!existsSync('/usr/bin/chromium-browser')) {
    console.error(`The chromium binary is not available for arm64: `);
    console.error(`If you are on Ubuntu, you can install with: `);
    console.error(`\n apt-get install chromium-browser\n`);
    throw new Error();
  }
}

/**
 * @public
 */
export interface BrowserFetcherOptions {
  platform?: typeof Deno.build.os;
  product?: string;
  path?: string;
  host?: string;
}

/**
 * @public
 */
export interface BrowserFetcherRevisionInfo {
  folderPath: string;
  executablePath: string;
  url: string;
  local: boolean;
  revision: string;
  product: string;
}
/**
 * BrowserFetcher can download and manage different versions of Chromium and Firefox.
 *
 * @remarks
 * BrowserFetcher operates on revision strings that specify a precise version of Chromium, e.g. `"533271"`. Revision strings can be obtained from {@link http://omahaproxy.appspot.com/ | omahaproxy.appspot.com}.
 * In the Firefox case, BrowserFetcher downloads Firefox Nightly and
 * operates on version numbers such as `"75"`.
 *
 * @example
 * An example of using BrowserFetcher to download a specific version of Chromium
 * and running Puppeteer against it:
 *
 * ```js
 * const browserFetcher = puppeteer.createBrowserFetcher();
 * const revisionInfo = await browserFetcher.download('533271');
 * const browser = await puppeteer.launch({executablePath: revisionInfo.executablePath})
 * ```
 *
 * **NOTE** BrowserFetcher is not designed to work concurrently with other
 * instances of BrowserFetcher that share the same downloads directory.
 *
 * @public
 */

export class BrowserFetcher {
  private _product: Product;
  private _downloadsFolder: string;
  private _downloadHost: string;
  private _platform = Deno.build.os;

  /**
   * @internal
   */
  constructor(options: BrowserFetcherOptions = {}) {
    this._product = (options.product || 'chrome').toLowerCase() as Product;
    assert(
      this._product === 'chrome' || this._product === 'firefox',
      `Unknown product: "${options.product}"`
    );

    this._downloadsFolder = options.path!;
    this._downloadHost = options.host || browserConfig[this._product].host;
    assert(
      downloadURLs[this._product][this._platform],
      'Unsupported platform: ' + this._platform
    );
  }

  /**
   * @returns Returns the current `Product`.
   */
  product(): Product {
    return this._product;
  }

  /**
   * @returns The download host being used.
   */
  host(): string {
    return this._downloadHost;
  }

  // /**
  //  * Initiates a GET request to download the revision from the host.
  //  * @remarks
  //  * This method is affected by the current `product`.
  //  * @param revision - The revision to download.
  //  * @param progressCallback - A function that will be called with two arguments:
  //  * How many bytes have been downloaded and the total number of bytes of the download.
  //  * @returns A promise with revision information when the revision is downloaded
  //  * and extracted.
  //  */
  // async download(
  //   revision: string,
  //   progressCallback: (x: number, y: number) => void = (): void => {}
  // ): Promise<BrowserFetcherRevisionInfo> {
  //   const url = downloadURL(
  //     this._product,
  //     this._platform,
  //     this._downloadHost,
  //     revision
  //   );
  //   const fileName = url.split('/').pop();
  //   const archivePath = path.join(this._downloadsFolder, fileName);
  //   const outputPath = this._getFolderPath(revision);
  //   if (await existsAsync(outputPath)) return this.revisionInfo(revision);
  //   if (!(await existsAsync(this._downloadsFolder)))
  //     await mkdirAsync(this._downloadsFolder);
  //   if (os.arch() === 'arm64') {
  //     handleArm64();
  //     return;
  //   }
  //   try {
  //     await downloadFile(url, archivePath, progressCallback);
  //     await install(archivePath, outputPath);
  //   } finally {
  //     if (await existsAsync(archivePath)) await unlinkAsync(archivePath);
  //   }
  //   const revisionInfo = this.revisionInfo(revision);
  //   if (revisionInfo) await chmodAsync(revisionInfo.executablePath, 0o755);
  //   return revisionInfo;
  // }

  // /**
  //  * @remarks
  //  * This method is affected by the current `product`.
  //  * @returns A promise with a list of all revision strings (for the current `product`)
  //  * available locally on disk.
  //  */
  // async localRevisions(): Promise<string[]> {
  //   if (!(await exists(this._downloadsFolder))) return [];
  //   for await (const fileName of Deno.readDir(this._downloadsFolder)) {
  //     parseFolderPath(this._product, fileName)
  //   }
  //   return fileNames
  //     .map((fileName) => )
  //     .filter((entry) => entry && entry.platform === this._platform)
  //     .map((entry) => entry.revision);
  // }

  // /**
  //  * @remarks
  //  * This method is affected by the current `product`.
  //  * @param revision - A revision to remove for the current `product`.
  //  * @returns A promise that resolves when the revision has been removes or
  //  * throws if the revision has not been downloaded.
  //  */
  // async remove(revision: string): Promise<void> {
  //   const folderPath = this._getFolderPath(revision);
  //   assert(
  //     await existsAsync(folderPath),
  //     `Failed to remove: revision ${revision} is not downloaded`
  //   );
  //   await new Promise((fulfill) => removeRecursive(folderPath, fulfill));
  // }

  /**
   * @param revision - The revision to get info for.
   * @returns The revision info for the given revision.
   */
  revisionInfo(revision: string): BrowserFetcherRevisionInfo {
    const folderPath = this._getFolderPath(revision);
    let executablePath = '';
    if (this._product === 'chrome') {
      if (this._platform === 'darwin')
        executablePath = join(
          folderPath,
          archiveName(this._product, this._platform, revision),
          'Chromium.app',
          'Contents',
          'MacOS',
          'Chromium'
        );
      else if (this._platform === 'linux')
        executablePath = join(
          folderPath,
          archiveName(this._product, this._platform, revision),
          'chrome'
        );
      else if (this._platform === 'windows')
        executablePath = join(
          folderPath,
          archiveName(this._product, this._platform, revision),
          'chrome.exe'
        );
      else throw new Error('Unsupported platform: ' + this._platform);
    } else if (this._product === 'firefox') {
      if (this._platform === 'darwin')
        executablePath = join(
          folderPath,
          'Firefox Nightly.app',
          'Contents',
          'MacOS',
          'firefox'
        );
      else if (this._platform === 'linux')
        executablePath = join(folderPath, 'firefox', 'firefox');
      else if (this._platform === 'windows')
        executablePath = join(folderPath, 'firefox', 'firefox.exe');
      else throw new Error('Unsupported platform: ' + this._platform);
    } else {
      throw new Error('Unsupported product: ' + this._product);
    }
    const url = downloadURL(
      this._product,
      this._platform,
      this._downloadHost,
      revision
    );
    const local = existsSync(folderPath);
    debugFetcher({
      revision,
      executablePath,
      folderPath,
      local,
      url,
      product: this._product,
    });
    return {
      revision,
      executablePath,
      folderPath,
      local,
      url,
      product: this._product,
    };
  }

  /**
   * @internal
   */
  _getFolderPath(revision: string): string {
    return join(this._downloadsFolder, this._platform + '-' + revision);
  }
}

// function install(archivePath: string, folderPath: string): Promise<unknown> {
//   debugFetcher(`Installing ${archivePath} to ${folderPath}`);
//   if (archivePath.endsWith('.zip'))
//     return extractZip(archivePath, { dir: folderPath });
//   else if (archivePath.endsWith('.tar.bz2'))
//     return extractTar(archivePath, folderPath);
//   else if (archivePath.endsWith('.dmg'))
//     return mkdirAsync(folderPath).then(() =>
//       installDMG(archivePath, folderPath)
//     );
//   else throw new Error(`Unsupported archive format: ${archivePath}`);
// }

// /**
//  * @internal
//  */
// function extractTar(tarPath: string, folderPath: string): Promise<unknown> {
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const tar = require('tar-fs');
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const bzip = require('unbzip2-stream');
//   return new Promise((fulfill, reject) => {
//     const tarStream = tar.extract(folderPath);
//     tarStream.on('error', reject);
//     tarStream.on('finish', fulfill);
//     const readStream = fs.createReadStream(tarPath);
//     readStream.pipe(bzip()).pipe(tarStream);
//   });
// }

/**
 * @internal
 */
async function installDMG(dmgPath: string, folderPath: string): Promise<void> {
  let mountPath: string = null!;
  try {
    const mountCommand = [
      'hdiutil',
      'attach',
      '-nobrowse',
      '-noautoopen',
      dmgPath,
    ];
    const proc = Deno.run({ cmd: mountCommand, stdout: 'piped' });
    if (!(await proc.status()).success) throw new Error();
    const buf = await proc.output();
    const stdout = new TextDecoder().decode(buf);
    const volumes = stdout.match(/\/Volumes\/(.*)/m);
    if (!volumes) throw new Error(`Could not find volume path in ${stdout}`);
    mountPath = volumes[0];
    for await (const item of Deno.readDir(mountPath)) {
      if (item.name.endsWith('.app')) {
        const copyPath = join(mountPath, item.name);
        debugFetcher(`Copying ${copyPath} to ${folderPath}`);
        const copyProc = Deno.run({ cmd: ['cp', '-R', copyPath, folderPath] });
        if (!(await copyProc.status()).success) throw new Error();
        return;
      }
    }
    throw new Error(`Cannot find app in ${mountPath}`);
  } finally {
    if (!mountPath) return;
    const unmountCommand = ['hdiutil', 'detach', mountPath, '-quiet'];
    debugFetcher(`Unmounting ${mountPath}`);
    const unmountProc = Deno.run({ cmd: unmountCommand });
    if (!(await unmountProc.status()).success)
      console.error(`Error unmounting dmg`);
  }
}
