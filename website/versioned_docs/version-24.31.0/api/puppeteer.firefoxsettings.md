---
sidebar_label: FirefoxSettings
---

# FirefoxSettings interface

### Signature

```typescript
export interface FirefoxSettings
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

<span id="downloadbaseurl">downloadBaseUrl</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Specifies the URL prefix that is used to download the browser.

Can be overridden by `PUPPETEER_FIREFOX_DOWNLOAD_BASE_URL`.

**Remarks:**

This must include the protocol and may even need a path prefix. This must **not** include a trailing slash similar to the default.

</td><td>

https://archive.mozilla.org/pub/firefox/releases

</td></tr>
<tr><td>

<span id="skipdownload">skipDownload</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Tells Puppeteer to not download the browser during installation.

Can be overridden by `PUPPETEER_FIREFOX_SKIP_DOWNLOAD`.

</td><td>

true

</td></tr>
<tr><td>

<span id="version">version</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Specifies a certain version of the browser you'd like Puppeteer to use.

Can be overridden by `PUPPETEER_FIREFOX_VERSION`.

See [puppeteer.launch](./puppeteer.puppeteernode.launch.md) on how executable path is inferred.

</td><td>

The pinned browser version supported by the current Puppeteer version.

</td></tr>
</tbody></table>
