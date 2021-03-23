"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserFetcher = void 0;
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const childProcess = __importStar(require("child_process"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const Debug_js_1 = require("../common/Debug.js");
const util_1 = require("util");
const rimraf_1 = __importDefault(require("rimraf"));
const URL = __importStar(require("url"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const proxy_from_env_1 = require("proxy-from-env");
const assert_js_1 = require("../common/assert.js");
const debugFetcher = Debug_js_1.debug(`puppeteer:fetcher`);
const downloadURLs = {
    chrome: {
        linux: '%s/chromium-browser-snapshots/Linux_x64/%d/%s.zip',
        mac: '%s/chromium-browser-snapshots/Mac/%d/%s.zip',
        win32: '%s/chromium-browser-snapshots/Win/%d/%s.zip',
        win64: '%s/chromium-browser-snapshots/Win_x64/%d/%s.zip',
    },
    firefox: {
        linux: '%s/firefox-%s.en-US.%s-x86_64.tar.bz2',
        mac: '%s/firefox-%s.en-US.%s.dmg',
        win32: '%s/firefox-%s.en-US.%s.zip',
        win64: '%s/firefox-%s.en-US.%s.zip',
    },
};
const browserConfig = {
    chrome: {
        host: 'https://storage.googleapis.com',
        destination: '.local-chromium',
    },
    firefox: {
        host: 'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central',
        destination: '.local-firefox',
    },
};
function archiveName(product, platform, revision) {
    if (product === 'chrome') {
        if (platform === 'linux')
            return 'chrome-linux';
        if (platform === 'mac')
            return 'chrome-mac';
        if (platform === 'win32' || platform === 'win64') {
            // Windows archive name changed at r591479.
            return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
        }
    }
    else if (product === 'firefox') {
        return platform;
    }
}
/**
 * @internal
 */
function downloadURL(product, platform, host, revision) {
    const url = util.format(downloadURLs[product][platform], host, revision, archiveName(product, platform, revision));
    return url;
}
/**
 * @internal
 */
function handleArm64() {
    fs.stat('/usr/bin/chromium-browser', function (err, stats) {
        if (stats === undefined) {
            fs.stat('/usr/bin/chromium', function (err, stats) {
                if (stats === undefined) {
                    console.error(`The chromium binary is not available for arm64.`);
                    console.error(`If you are on Ubuntu, you can install with: `);
                    console.error(`\n sudo apt install chromium\n`);
                    console.error(`\n sudo apt install chromium-browser\n`);
                    throw new Error();
                }
            });
        }
    });
}
const readdirAsync = util_1.promisify(fs.readdir.bind(fs));
const mkdirAsync = util_1.promisify(fs.mkdir.bind(fs));
const unlinkAsync = util_1.promisify(fs.unlink.bind(fs));
const chmodAsync = util_1.promisify(fs.chmod.bind(fs));
function existsAsync(filePath) {
    return new Promise((resolve) => {
        fs.access(filePath, (err) => resolve(!err));
    });
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
class BrowserFetcher {
    /**
     * @internal
     */
    constructor(projectRoot, options = {}) {
        this._product = (options.product || 'chrome').toLowerCase();
        assert_js_1.assert(this._product === 'chrome' || this._product === 'firefox', `Unknown product: "${options.product}"`);
        this._downloadsFolder =
            options.path ||
                path.join(projectRoot, browserConfig[this._product].destination);
        this._downloadHost = options.host || browserConfig[this._product].host;
        this.setPlatform(options.platform);
        assert_js_1.assert(downloadURLs[this._product][this._platform], 'Unsupported platform: ' + this._platform);
    }
    setPlatform(platformFromOptions) {
        if (platformFromOptions) {
            this._platform = platformFromOptions;
            return;
        }
        const platform = os.platform();
        if (platform === 'darwin')
            this._platform = 'mac';
        else if (platform === 'linux')
            this._platform = 'linux';
        else if (platform === 'win32')
            this._platform = os.arch() === 'x64' ? 'win64' : 'win32';
        else
            assert_js_1.assert(this._platform, 'Unsupported platform: ' + os.platform());
    }
    /**
     * @returns Returns the current `Platform`.
     */
    platform() {
        return this._platform;
    }
    /**
     * @returns Returns the current `Product`.
     */
    product() {
        return this._product;
    }
    /**
     * @returns The download host being used.
     */
    host() {
        return this._downloadHost;
    }
    /**
     * Initiates a HEAD request to check if the revision is available.
     * @remarks
     * This method is affected by the current `product`.
     * @param revision - The revision to check availability for.
     * @returns A promise that resolves to `true` if the revision could be downloaded
     * from the host.
     */
    canDownload(revision) {
        const url = downloadURL(this._product, this._platform, this._downloadHost, revision);
        return new Promise((resolve) => {
            const request = httpRequest(url, 'HEAD', (response) => {
                resolve(response.statusCode === 200);
            });
            request.on('error', (error) => {
                console.error(error);
                resolve(false);
            });
        });
    }
    /**
     * Initiates a GET request to download the revision from the host.
     * @remarks
     * This method is affected by the current `product`.
     * @param revision - The revision to download.
     * @param progressCallback - A function that will be called with two arguments:
     * How many bytes have been downloaded and the total number of bytes of the download.
     * @returns A promise with revision information when the revision is downloaded
     * and extracted.
     */
    async download(revision, progressCallback = () => { }) {
        const url = downloadURL(this._product, this._platform, this._downloadHost, revision);
        const fileName = url.split('/').pop();
        const archivePath = path.join(this._downloadsFolder, fileName);
        const outputPath = this._getFolderPath(revision);
        if (await existsAsync(outputPath))
            return this.revisionInfo(revision);
        if (!(await existsAsync(this._downloadsFolder)))
            await mkdirAsync(this._downloadsFolder);
        if (os.arch() === 'arm64') {
            handleArm64();
            return;
        }
        try {
            await downloadFile(url, archivePath, progressCallback);
            await install(archivePath, outputPath);
        }
        finally {
            if (await existsAsync(archivePath))
                await unlinkAsync(archivePath);
        }
        const revisionInfo = this.revisionInfo(revision);
        if (revisionInfo)
            await chmodAsync(revisionInfo.executablePath, 0o755);
        return revisionInfo;
    }
    /**
     * @remarks
     * This method is affected by the current `product`.
     * @returns A promise with a list of all revision strings (for the current `product`)
     * available locally on disk.
     */
    async localRevisions() {
        if (!(await existsAsync(this._downloadsFolder)))
            return [];
        const fileNames = await readdirAsync(this._downloadsFolder);
        return fileNames
            .map((fileName) => parseFolderPath(this._product, fileName))
            .filter((entry) => entry && entry.platform === this._platform)
            .map((entry) => entry.revision);
    }
    /**
     * @remarks
     * This method is affected by the current `product`.
     * @param revision - A revision to remove for the current `product`.
     * @returns A promise that resolves when the revision has been removes or
     * throws if the revision has not been downloaded.
     */
    async remove(revision) {
        const folderPath = this._getFolderPath(revision);
        assert_js_1.assert(await existsAsync(folderPath), `Failed to remove: revision ${revision} is not downloaded`);
        await new Promise((fulfill) => rimraf_1.default(folderPath, fulfill));
    }
    /**
     * @param revision - The revision to get info for.
     * @returns The revision info for the given revision.
     */
    revisionInfo(revision) {
        const folderPath = this._getFolderPath(revision);
        let executablePath = '';
        if (this._product === 'chrome') {
            if (this._platform === 'mac')
                executablePath = path.join(folderPath, archiveName(this._product, this._platform, revision), 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
            else if (this._platform === 'linux')
                executablePath = path.join(folderPath, archiveName(this._product, this._platform, revision), 'chrome');
            else if (this._platform === 'win32' || this._platform === 'win64')
                executablePath = path.join(folderPath, archiveName(this._product, this._platform, revision), 'chrome.exe');
            else
                throw new Error('Unsupported platform: ' + this._platform);
        }
        else if (this._product === 'firefox') {
            if (this._platform === 'mac')
                executablePath = path.join(folderPath, 'Firefox Nightly.app', 'Contents', 'MacOS', 'firefox');
            else if (this._platform === 'linux')
                executablePath = path.join(folderPath, 'firefox', 'firefox');
            else if (this._platform === 'win32' || this._platform === 'win64')
                executablePath = path.join(folderPath, 'firefox', 'firefox.exe');
            else
                throw new Error('Unsupported platform: ' + this._platform);
        }
        else {
            throw new Error('Unsupported product: ' + this._product);
        }
        const url = downloadURL(this._product, this._platform, this._downloadHost, revision);
        const local = fs.existsSync(folderPath);
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
    _getFolderPath(revision) {
        return path.join(this._downloadsFolder, this._platform + '-' + revision);
    }
}
exports.BrowserFetcher = BrowserFetcher;
function parseFolderPath(product, folderPath) {
    const name = path.basename(folderPath);
    const splits = name.split('-');
    if (splits.length !== 2)
        return null;
    const [platform, revision] = splits;
    if (!downloadURLs[product][platform])
        return null;
    return { product, platform, revision };
}
/**
 * @internal
 */
function downloadFile(url, destinationPath, progressCallback) {
    debugFetcher(`Downloading binary from ${url}`);
    let fulfill, reject;
    let downloadedBytes = 0;
    let totalBytes = 0;
    const promise = new Promise((x, y) => {
        fulfill = x;
        reject = y;
    });
    const request = httpRequest(url, 'GET', (response) => {
        if (response.statusCode !== 200) {
            const error = new Error(`Download failed: server returned code ${response.statusCode}. URL: ${url}`);
            // consume response data to free up memory
            response.resume();
            reject(error);
            return;
        }
        const file = fs.createWriteStream(destinationPath);
        file.on('finish', () => fulfill());
        file.on('error', (error) => reject(error));
        response.pipe(file);
        totalBytes = parseInt(
        /** @type {string} */ response.headers['content-length'], 10);
        if (progressCallback)
            response.on('data', onData);
    });
    request.on('error', (error) => reject(error));
    return promise;
    function onData(chunk) {
        downloadedBytes += chunk.length;
        progressCallback(downloadedBytes, totalBytes);
    }
}
function install(archivePath, folderPath) {
    debugFetcher(`Installing ${archivePath} to ${folderPath}`);
    if (archivePath.endsWith('.zip'))
        return extract_zip_1.default(archivePath, { dir: folderPath });
    else if (archivePath.endsWith('.tar.bz2'))
        return extractTar(archivePath, folderPath);
    else if (archivePath.endsWith('.dmg'))
        return mkdirAsync(folderPath).then(() => installDMG(archivePath, folderPath));
    else
        throw new Error(`Unsupported archive format: ${archivePath}`);
}
/**
 * @internal
 */
function extractTar(tarPath, folderPath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tar = require('tar-fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bzip = require('unbzip2-stream');
    return new Promise((fulfill, reject) => {
        const tarStream = tar.extract(folderPath);
        tarStream.on('error', reject);
        tarStream.on('finish', fulfill);
        const readStream = fs.createReadStream(tarPath);
        readStream.pipe(bzip()).pipe(tarStream);
    });
}
/**
 * @internal
 */
function installDMG(dmgPath, folderPath) {
    let mountPath;
    function mountAndCopy(fulfill, reject) {
        const mountCommand = `hdiutil attach -nobrowse -noautoopen "${dmgPath}"`;
        childProcess.exec(mountCommand, (err, stdout) => {
            if (err)
                return reject(err);
            const volumes = stdout.match(/\/Volumes\/(.*)/m);
            if (!volumes)
                return reject(new Error(`Could not find volume path in ${stdout}`));
            mountPath = volumes[0];
            readdirAsync(mountPath)
                .then((fileNames) => {
                const appName = fileNames.filter((item) => typeof item === 'string' && item.endsWith('.app'))[0];
                if (!appName)
                    return reject(new Error(`Cannot find app in ${mountPath}`));
                const copyPath = path.join(mountPath, appName);
                debugFetcher(`Copying ${copyPath} to ${folderPath}`);
                childProcess.exec(`cp -R "${copyPath}" "${folderPath}"`, (err) => {
                    if (err)
                        reject(err);
                    else
                        fulfill();
                });
            })
                .catch(reject);
        });
    }
    function unmount() {
        if (!mountPath)
            return;
        const unmountCommand = `hdiutil detach "${mountPath}" -quiet`;
        debugFetcher(`Unmounting ${mountPath}`);
        childProcess.exec(unmountCommand, (err) => {
            if (err)
                console.error(`Error unmounting dmg: ${err}`);
        });
    }
    return new Promise(mountAndCopy)
        .catch((error) => {
        console.error(error);
    })
        .finally(unmount);
}
function httpRequest(url, method, response) {
    const urlParsed = URL.parse(url);
    let options = {
        ...urlParsed,
        method,
    };
    const proxyURL = proxy_from_env_1.getProxyForUrl(url);
    if (proxyURL) {
        if (url.startsWith('http:')) {
            const proxy = URL.parse(proxyURL);
            options = {
                path: options.href,
                host: proxy.hostname,
                port: proxy.port,
            };
        }
        else {
            const parsedProxyURL = URL.parse(proxyURL);
            const proxyOptions = {
                ...parsedProxyURL,
                secureProxy: parsedProxyURL.protocol === 'https:',
            };
            options.agent = https_proxy_agent_1.default(proxyOptions);
            options.rejectUnauthorized = false;
        }
    }
    const requestCallback = (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
            httpRequest(res.headers.location, method, response);
        else
            response(res);
    };
    const request = options.protocol === 'https:'
        ? https.request(options, requestCallback)
        : http.request(options, requestCallback);
    request.end();
    return request;
}
//# sourceMappingURL=BrowserFetcher.js.map