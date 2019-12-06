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

import os from 'os';
import fs from 'fs';
import path from 'path';
import util, { promisify } from 'util';
import { ConnectionOptions } from 'tls';
import URL, { UrlWithStringQuery } from 'url';
import http, { IncomingMessage, RequestOptions } from 'http';
import https from 'https';
import removeRecursive from 'rimraf';
import ProxyAgent, { HttpsProxyAgentOptions } from 'https-proxy-agent';
import extract from 'extract-zip';
import { getProxyForUrl } from 'proxy-from-env';
import { assert } from './helper';

export type Platform = "mac" | "win32" | "win64" | "linux";

export interface BrowserFetcherOptions {
  platform?: Platform;
  path?: string;
  host?: string;
}

export interface RevisionInfo {
  folderPath: string;
  executablePath: string;
  url: string;
  local: boolean;
  revision: string;
}

const DEFAULT_DOWNLOAD_HOST = 'https://storage.googleapis.com';

const supportedPlatforms = new Set<Platform>(['mac', 'linux', 'win32', 'win64']);

const downloadURLs: Record<Platform, string> = {
  linux: '%s/chromium-browser-snapshots/Linux_x64/%d/%s.zip',
  mac: '%s/chromium-browser-snapshots/Mac/%d/%s.zip',
  win32: '%s/chromium-browser-snapshots/Win/%d/%s.zip',
  win64: '%s/chromium-browser-snapshots/Win_x64/%d/%s.zip',
};

function archiveName(platform: Platform, revision: string): string {
  if (platform === 'linux')
    return 'chrome-linux';
  if (platform === 'mac')
    return 'chrome-mac';
  if (platform === 'win32' || platform === 'win64') {
    // Windows archive name changed at r591479.
    return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
  }
  throw new Error(`Unknown platform: ${platform}`)
}

function downloadURL(platform: Platform, host: string, revision: string): string {
  return util.format(downloadURLs[platform], host, revision, archiveName(platform, revision));
}

const readdirAsync = promisify(fs.readdir);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const chmodAsync = promisify(fs.chmod);
const existsAsync = promisify(fs.exists);

function detectPlatform(): Platform {
  const platform = os.platform();
  if (platform === 'darwin') {
    return 'mac';
  } else if (platform === 'linux') {
    return 'linux';
  } else if (platform === 'win32') {
    return os.arch() === 'x64' ? 'win64' : 'win32';
  } else {
    throw new Error(`Unsupported platform: ${platform}`)
  }
}

export class BrowserFetcher {
  private _downloadsFolder: string;
  private _downloadHost: string;
  private _platform: Platform;

  constructor(projectRoot: string, options: BrowserFetcherOptions = {}) {
    this._downloadsFolder = options.path || path.join(projectRoot, '.local-chromium');
    this._downloadHost = options.host || DEFAULT_DOWNLOAD_HOST;
    this._platform = options.platform || detectPlatform();
  }

  platform(): string {
    return this._platform;
  }

  canDownload(revision: string): Promise<boolean> {
    const url = downloadURL(this._platform, this._downloadHost, revision);
    let resolve: (sucess: boolean) => void;
    const promise = new Promise<boolean>(x => resolve = x);
    const request = httpRequest(url, 'HEAD', response => {
      resolve(response.statusCode === 200);
    });
    request.on('error', error => {
      console.error(error);
      resolve(false);
    });
    return promise;
  }

  async download(revision: string, progressCallback?: (current: number, total: number)=>void): Promise<RevisionInfo> {
    const url = downloadURL(this._platform, this._downloadHost, revision);
    const zipPath = path.join(this._downloadsFolder, `download-${this._platform}-${revision}.zip`);
    const folderPath = this._getFolderPath(revision);
    if (await existsAsync(folderPath))
      return this.revisionInfo(revision);
    if (!(await existsAsync(this._downloadsFolder)))
      await mkdirAsync(this._downloadsFolder);
    try {
      await downloadFile(url, zipPath, progressCallback);
      await extractZip(zipPath, folderPath);
    } finally {
      if (await existsAsync(zipPath))
        await unlinkAsync(zipPath);
    }
    const revisionInfo = this.revisionInfo(revision);
    if (revisionInfo)
      await chmodAsync(revisionInfo.executablePath, 0o755);
    return revisionInfo;
  }

  async localRevisions(): Promise<string[]> {
    if (!await existsAsync(this._downloadsFolder))
      return [];
    const fileNames = await readdirAsync(this._downloadsFolder);
    return fileNames.map(fileName => parseFolderPath(fileName)).filter(entry => entry && entry.platform === this._platform).map(entry => entry!.revision);
  }

  async remove(revision: string) {
    const folderPath = this._getFolderPath(revision);
    assert(await existsAsync(folderPath), `Failed to remove: revision ${revision} is not downloaded`);
    await new Promise(fulfill => removeRecursive(folderPath, fulfill));
  }

  revisionInfo(revision: string): RevisionInfo {
    const folderPath = this._getFolderPath(revision);
    let executablePath = '';
    if (this._platform === 'mac')
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
    else if (this._platform === 'linux')
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'chrome');
    else if (this._platform === 'win32' || this._platform === 'win64')
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'chrome.exe');
    else
      throw new Error('Unsupported platform: ' + this._platform);
    const url = downloadURL(this._platform, this._downloadHost, revision);
    const local = fs.existsSync(folderPath);
    return {revision, executablePath, folderPath, local, url};
  }

  private _getFolderPath(revision: string): string {
    return path.join(this._downloadsFolder, this._platform + '-' + revision);
  }
}

function parseFolderPath(folderPath: string): {platform: Platform, revision: string} | null {
  const name = path.basename(folderPath);
  const splits = name.split('-');
  if (splits.length !== 2)
    return null;
  const [platform, revision] = splits as [Platform, string];
  if (!supportedPlatforms.has(platform))
    return null;
  return {platform, revision};
}

function downloadFile(url: string, destinationPath: string, progressCallback?: (downloadedBytes: number, totalBytes: number) =>void): Promise<void> {
  let fulfill: () => void, reject: (e: Error) => void;
  let downloadedBytes = 0;
  let totalBytes = 0;

  const promise = new Promise<void>((x, y) => { fulfill = x; reject = y; });

  const request = httpRequest(url, 'GET', response => {
    if (response.statusCode !== 200) {
      const error = new Error(`Download failed: server returned code ${response.statusCode}. URL: ${url}`);
      // consume response data to free up memory
      response.resume();
      reject(error);
      return;
    }
    const file = fs.createWriteStream(destinationPath);
    file.on('finish', () => fulfill());
    file.on('error', error => reject(error));
    response.pipe(file);
    const contentLength = response.headers['content-length']
    totalBytes = contentLength !== undefined ? parseInt(contentLength, 10) : 0;
    if (progressCallback)
      response.on('data', onData);
  });
  request.on('error', error => reject(error));
  return promise;

  function onData(chunk: string) {
    downloadedBytes += chunk.length;
    progressCallback!(downloadedBytes, totalBytes);
  }
}

function extractZip(zipPath: string, folderPath: string): Promise<void> {
  return new Promise((fulfill, reject) => extract(zipPath, {dir: folderPath}, err => {
    if (err)
      reject(err);
    else
      fulfill();
  }));
}


function httpRequest(url: string, method: string, response: (res: IncomingMessage) => void) {
  let options = URL.parse(url) as UrlWithStringQuery & RequestOptions & ConnectionOptions;
  options.method = method;

  const proxyURL = getProxyForUrl(url);
  if (proxyURL) {
    if (url.startsWith('http:')) {
      const proxy = URL.parse(proxyURL);
      options = {
        path: options.href,
        host: proxy.hostname,
        port: proxy.port,
      } as UrlWithStringQuery & RequestOptions & ConnectionOptions;
    } else {
      const parsedProxyURL = URL.parse(proxyURL) as HttpsProxyAgentOptions;
      parsedProxyURL.secureProxy = parsedProxyURL.protocol === 'https:';

      options.agent = new ProxyAgent(parsedProxyURL);
      options.rejectUnauthorized = false;
    }
  }

  const requestCallback = (res: IncomingMessage) => {
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
      httpRequest(res.headers.location, method, response);
    else
      response(res);
  };

  const request = options.protocol === 'https:' ?
    https.request(options, requestCallback) :
    http.request(options, requestCallback);
  
  request.end();
  return request;
}
