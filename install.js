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

/**
 * This file is part of public API.
 *
 * By default, the `puppeteer` package runs this script during the installation
 * process unless one of the env flags is provided.
 * `puppeteer-core` package doesn't include this step at all. However, it's
 * still possible to install a supported browser using this script when
 * necessary.
 */

const compileTypeScriptIfRequired = require('./typescript-if-required');

const firefoxVersions =
  'https://product-details.mozilla.org/1.0/firefox_versions.json';
const supportedProducts = {
  chrome: 'Chromium',
  firefox: 'Firefox Nightly',
};

async function download() {
  await compileTypeScriptIfRequired();

  const downloadHost =
    process.env.PUPPETEER_DOWNLOAD_HOST ||
    process.env.npm_config_puppeteer_download_host ||
    process.env.npm_package_config_puppeteer_download_host;
  const puppeteer = require('./index');
  const product =
    process.env.PUPPETEER_PRODUCT ||
    process.env.npm_config_puppeteer_product ||
    process.env.npm_package_config_puppeteer_product ||
    'chrome';
  const browserFetcher = puppeteer.createBrowserFetcher({
    product,
    host: downloadHost,
  });
  const revision = await getRevision();
  await fetchBinary(revision);

  function getRevision() {
    if (product === 'chrome') {
      return (
        process.env.PUPPETEER_CHROMIUM_REVISION ||
        process.env.npm_config_puppeteer_chromium_revision ||
        process.env.npm_package_config_puppeteer_chromium_revision ||
        require('./package.json').puppeteer.chromium_revision
      );
    } else if (product === 'firefox') {
      puppeteer._preferredRevision = require('./package.json').puppeteer.firefox_revision;
      return getFirefoxNightlyVersion(browserFetcher.host()).catch((error) => {
        console.error(error);
        process.exit(1);
      });
    } else {
      throw new Error(`Unsupported product ${product}`);
    }
  }

  function fetchBinary(revision) {
    const revisionInfo = browserFetcher.revisionInfo(revision);

    // Do nothing if the revision is already downloaded.
    if (revisionInfo.local) {
      logPolitely(
        `${supportedProducts[product]} is already in ${revisionInfo.folderPath}; skipping download.`
      );
      return;
    }

    // Override current environment proxy settings with npm configuration, if any.
    const NPM_HTTPS_PROXY =
      process.env.npm_config_https_proxy || process.env.npm_config_proxy;
    const NPM_HTTP_PROXY =
      process.env.npm_config_http_proxy || process.env.npm_config_proxy;
    const NPM_NO_PROXY = process.env.npm_config_no_proxy;

    if (NPM_HTTPS_PROXY) process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
    if (NPM_HTTP_PROXY) process.env.HTTP_PROXY = NPM_HTTP_PROXY;
    if (NPM_NO_PROXY) process.env.NO_PROXY = NPM_NO_PROXY;

    /**
     * @param {!Array<string>}
     * @return {!Promise}
     */
    function onSuccess(localRevisions) {
      logPolitely(
        `${supportedProducts[product]} (${revisionInfo.revision}) downloaded to ${revisionInfo.folderPath}`
      );
      localRevisions = localRevisions.filter(
        (revision) => revision !== revisionInfo.revision
      );
      const cleanupOldVersions = localRevisions.map((revision) =>
        browserFetcher.remove(revision)
      );
      Promise.all([...cleanupOldVersions]);
    }

    /**
     * @param {!Error} error
     */
    function onError(error) {
      console.error(
        `ERROR: Failed to set up ${supportedProducts[product]} r${revision}! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.`
      );
      console.error(error);
      process.exit(1);
    }

    let progressBar = null;
    let lastDownloadedBytes = 0;
    function onProgress(downloadedBytes, totalBytes) {
      if (!progressBar) {
        const ProgressBar = require('progress');
        progressBar = new ProgressBar(
          `Downloading ${
            supportedProducts[product]
          } r${revision} - ${toMegabytes(totalBytes)} [:bar] :percent :etas `,
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
    }

    return browserFetcher
      .download(revisionInfo.revision, onProgress)
      .then(() => browserFetcher.localRevisions())
      .then(onSuccess)
      .catch(onError);
  }

  function toMegabytes(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 10) / 10} Mb`;
  }

  function getFirefoxNightlyVersion(host) {
    const https = require('https');
    const promise = new Promise((resolve, reject) => {
      let data = '';
      logPolitely(`Requesting latest Firefox Nightly version from ${host}`);
      https
        .get(firefoxVersions, (r) => {
          if (r.statusCode >= 400)
            return reject(new Error(`Got status code ${r.statusCode}`));
          r.on('data', (chunk) => {
            data += chunk;
          });
          r.on('end', () => {
            try {
              const versions = JSON.parse(data);
              return resolve(versions.FIREFOX_NIGHTLY);
            } catch {
              return reject(new Error('Firefox version not found'));
            }
          });
        })
        .on('error', reject);
    });
    return promise;
  }
}

function logPolitely(toBeLogged) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel) > -1;

  if (!logLevelDisplay) console.log(toBeLogged);
}

if (process.env.PUPPETEER_SKIP_DOWNLOAD) {
  logPolitely(
    '**INFO** Skipping browser download. "PUPPETEER_SKIP_DOWNLOAD" environment variable was found.'
  );
  return;
}
if (
  process.env.NPM_CONFIG_PUPPETEER_SKIP_DOWNLOAD ||
  process.env.npm_config_puppeteer_skip_download
) {
  logPolitely(
    '**INFO** Skipping browser download. "PUPPETEER_SKIP_DOWNLOAD" was set in npm config.'
  );
  return;
}
if (
  process.env.NPM_PACKAGE_CONFIG_PUPPETEER_SKIP_DOWNLOAD ||
  process.env.npm_package_config_puppeteer_skip_download
) {
  logPolitely(
    '**INFO** Skipping browser download. "PUPPETEER_SKIP_DOWNLOAD" was set in project config.'
  );
  return;
}
if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
  logPolitely(
    '**INFO** Skipping browser download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" environment variable was found.'
  );
  return;
}
if (
  process.env.NPM_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD ||
  process.env.npm_config_puppeteer_skip_chromium_download
) {
  logPolitely(
    '**INFO** Skipping browser download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in npm config.'
  );
  return;
}
if (
  process.env.NPM_PACKAGE_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD ||
  process.env.npm_package_config_puppeteer_skip_chromium_download
) {
  logPolitely(
    '**INFO** Skipping browser download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in project config.'
  );
  return;
}

download();
