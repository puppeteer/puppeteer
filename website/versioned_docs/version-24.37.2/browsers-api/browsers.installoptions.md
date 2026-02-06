---
sidebar_label: InstallOptions
---

# InstallOptions interface

### Signature

```typescript
export interface InstallOptions
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

<span id="baseurl">baseUrl</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Determines the host that will be used for downloading.

</td><td>

Either

- https://storage.googleapis.com/chrome-for-testing-public or - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central

</td></tr>
<tr><td>

<span id="browser">browser</span>

</td><td>

</td><td>

[Browser](./browsers.browser.md)

</td><td>

Determines which browser to install.

</td><td>

</td></tr>
<tr><td>

<span id="buildid">buildId</span>

</td><td>

</td><td>

string

</td><td>

Determines which buildId to download. BuildId should uniquely identify binaries and they are used for caching.

</td><td>

</td></tr>
<tr><td>

<span id="buildidalias">buildIdAlias</span>

</td><td>

`optional`

</td><td>

string

</td><td>

An alias for the provided `buildId`. It will be used to maintain local metadata to support aliases in the `launch` command.

</td><td>

</td></tr>
<tr><td>

<span id="cachedir">cacheDir</span>

</td><td>

</td><td>

string

</td><td>

Determines the path to download browsers to.

</td><td>

</td></tr>
<tr><td>

<span id="downloadprogresscallback">downloadProgressCallback</span>

</td><td>

`optional`

</td><td>

'default' \| ((downloadedBytes: number, totalBytes: number) =&gt; void)

</td><td>

Provides information about the progress of the download. If set to 'default', the default callback implementing a progress bar will be used.

</td><td>

</td></tr>
<tr><td>

<span id="installdeps">installDeps</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to attempt to install system-level dependencies required for the browser.

Only supported for Chrome on Debian or Ubuntu. Requires system-level privileges to run `apt-get`.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="platform">platform</span>

</td><td>

`optional`

</td><td>

[BrowserPlatform](./browsers.browserplatform.md)

</td><td>

Determines which platform the browser will be suited for.

</td><td>

**Auto-detected.**

</td></tr>
<tr><td>

<span id="providers">providers</span>

</td><td>

`optional`

</td><td>

[BrowserProvider](./browsers.browserprovider.md)\[\]

</td><td>

Custom provider implementation for alternative download sources.

If not provided, uses the default provider. Multiple providers can be chained - they will be tried in order. The default provider is automatically added as the final fallback.

⚠️ **IMPORTANT**: Custom providers are NOT officially supported by Puppeteer.

By using custom providers, you accept full responsibility for:

- **Version compatibility**: Different platforms may receive different binary versions - **Archive compatibility**: Binary structure must match Puppeteer's expectations - **Feature integration**: Browser launch and other Puppeteer features may not work - **Testing**: You must validate that downloaded binaries work with Puppeteer

**Puppeteer only tests and guarantees compatibility with default binaries.**

</td><td>

</td></tr>
<tr><td>

<span id="unpack">unpack</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to unpack and install browser archives.

</td><td>

`true`

</td></tr>
</tbody></table>
