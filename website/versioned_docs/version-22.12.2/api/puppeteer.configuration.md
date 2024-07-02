---
sidebar_label: Configuration
---

# Configuration interface

Defines options to configure Puppeteer's behavior during installation and runtime.

See individual properties for more information.

#### Signature:

```typescript
export interface Configuration
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="browserrevision">browserRevision</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Specifies a certain version of the browser you'd like Puppeteer to use.

Can be overridden by `PUPPETEER_BROWSER_REVISION`.

See [puppeteer.launch](./puppeteer.puppeteernode.launch.md) on how executable path is inferred.

Use a specific browser version (e.g., 119.0.6045.105). If you use an alias such `stable` or `canary` it will only work during the installation of Puppeteer and it will fail when launching the browser.

</td><td>

The pinned browser version supported by the current Puppeteer version.

</td></tr>
<tr><td>

<span id="cachedirectory">cacheDirectory</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Defines the directory to be used by Puppeteer for caching.

Can be overridden by `PUPPETEER_CACHE_DIR`.

</td><td>

`path.join(os.homedir(), '.cache', 'puppeteer')`

</td></tr>
<tr><td>

<span id="defaultproduct">defaultProduct</span>

</td><td>

`optional`

</td><td>

[Product](./puppeteer.product.md)

</td><td>

Specifies which browser you'd like Puppeteer to use.

Can be overridden by `PUPPETEER_PRODUCT`.

</td><td>

`chrome`

</td></tr>
<tr><td>

<span id="downloadbaseurl">downloadBaseUrl</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Specifies the URL prefix that is used to download the browser.

Can be overridden by `PUPPETEER_DOWNLOAD_BASE_URL`.

**Remarks:**

This must include the protocol and may even need a path prefix.

</td><td>

Either https://storage.googleapis.com/chrome-for-testing-public or https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central, depending on the product.

</td></tr>
<tr><td>

<span id="executablepath">executablePath</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Specifies an executable path to be used in [puppeteer.launch](./puppeteer.puppeteernode.launch.md).

Can be overridden by `PUPPETEER_EXECUTABLE_PATH`.

</td><td>

**Auto-computed.**

</td></tr>
<tr><td>

<span id="experiments">experiments</span>

</td><td>

`optional`

</td><td>

[ExperimentsConfiguration](./puppeteer.experimentsconfiguration.md)

</td><td>

Defines experimental options for Puppeteer.

</td><td>

</td></tr>
<tr><td>

<span id="loglevel">logLevel</span>

</td><td>

`optional`

</td><td>

'silent' \| 'error' \| 'warn'

</td><td>

Tells Puppeteer to log at the given level.

</td><td>

`warn`

</td></tr>
<tr><td>

<span id="skipchromedownload">skipChromeDownload</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Tells Puppeteer to not Chrome download during installation.

Can be overridden by `PUPPETEER_SKIP_CHROME_DOWNLOAD`.

</td><td>

</td></tr>
<tr><td>

<span id="skipchromeheadlessshelldownload">skipChromeHeadlessShellDownload</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Tells Puppeteer to not chrome-headless-shell download during installation.

Can be overridden by `PUPPETEER_SKIP_CHROME_HEADLESS_SHELL_DOWNLOAD`.

</td><td>

</td></tr>
<tr><td>

<span id="skipdownload">skipDownload</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Tells Puppeteer to not download during installation.

Can be overridden by `PUPPETEER_SKIP_DOWNLOAD`.

</td><td>

</td></tr>
<tr><td>

<span id="temporarydirectory">temporaryDirectory</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Defines the directory to be used by Puppeteer for creating temporary files.

Can be overridden by `PUPPETEER_TMP_DIR`.

</td><td>

`os.tmpdir()`

</td></tr>
</tbody></table>
