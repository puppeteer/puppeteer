---
sidebar_label: BrowserDownloader.getExecutablePath
---

# BrowserDownloader.getExecutablePath() method

Get the relative path to the executable within the extracted archive.

Can return a simple path or use `\{platform\}` and `\{buildId\}` placeholders. If not provided, uses the default Chrome for Testing structure.

### Signature

```typescript
interface BrowserDownloader {
  getExecutablePath?(options: {
    browser: Browser;
    buildId: string;
    platform: BrowserPlatform;
  }): Promise<string> | string;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

&#123; browser: [Browser](./browsers.browser.md); buildId: string; platform: [BrowserPlatform](./browsers.browserplatform.md); &#125;

</td><td>

Browser, buildId, and platform

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt; \| string

Relative path to the executable (may include placeholders)

## Example

```ts
// Electron uses simple structure
getExecutablePath() {
  return 'chromedriver/chromedriver';
}

// Chrome for Testing uses platform-specific folders
getExecutablePath(options) {
  return `chromedriver-\{platform\}/chromedriver`;
}
```
