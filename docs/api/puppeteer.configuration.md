---
sidebar_label: Configuration
---

# Configuration interface

Defines options to configure Puppeteer's behavior during installation and runtime.

See individual properties for more information.

### Signature

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

<span id="_chrome-headless-shell_">"chrome-headless-shell"</span>

</td><td>

`optional`

</td><td>

[ChromeHeadlessShellSettings](./puppeteer.chromeheadlessshellsettings.md)

</td><td>

</td><td>

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

<span id="chrome">chrome</span>

</td><td>

`optional`

</td><td>

[ChromeSettings](./puppeteer.chromesettings.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="defaultbrowser">defaultBrowser</span>

</td><td>

`optional`

</td><td>

[SupportedBrowser](./puppeteer.supportedbrowser.md)

</td><td>

Specifies which browser you'd like Puppeteer to use.

Can be overridden by `PUPPETEER_BROWSER`.

</td><td>

`chrome`

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

<span id="firefox">firefox</span>

</td><td>

`optional`

</td><td>

[FirefoxSettings](./puppeteer.firefoxsettings.md)

</td><td>

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
