---
sidebar_label: InstallOptions
---

# InstallOptions interface

#### Signature:

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

<p id="baseurl">baseUrl</p>

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

<p id="browser">browser</p>

</td><td>

</td><td>

[Browser](./browsers.browser.md)

</td><td>

Determines which browser to install.

</td><td>

</td></tr>
<tr><td>

<p id="buildid">buildId</p>

</td><td>

</td><td>

string

</td><td>

Determines which buildId to download. BuildId should uniquely identify binaries and they are used for caching.

</td><td>

</td></tr>
<tr><td>

<p id="buildidalias">buildIdAlias</p>

</td><td>

`optional`

</td><td>

string

</td><td>

An alias for the provided `buildId`. It will be used to maintain local metadata to support aliases in the `launch` command.

</td><td>

</td></tr>
<tr><td>

<p id="cachedir">cacheDir</p>

</td><td>

</td><td>

string

</td><td>

Determines the path to download browsers to.

</td><td>

</td></tr>
<tr><td>

<p id="downloadprogresscallback">downloadProgressCallback</p>

</td><td>

`optional`

</td><td>

(downloadedBytes: number, totalBytes: number) =&gt; void

</td><td>

Provides information about the progress of the download.

</td><td>

</td></tr>
<tr><td>

<p id="platform">platform</p>

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

<p id="unpack">unpack</p>

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
