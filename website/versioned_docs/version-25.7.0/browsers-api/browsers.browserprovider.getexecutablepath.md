---
sidebar_label: BrowserProvider.getExecutablePath
---

# BrowserProvider.getExecutablePath() method

Get the relative path to the executable within the extracted archive.

### Signature

```typescript
interface BrowserProvider {
  getExecutablePath(options: {
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

Relative path to the executable

## Example

```ts
// Electron uses simple structure
getExecutablePath() {
  return 'chromedriver/chromedriver';
}

// Custom provider with platform-specific paths
getExecutablePath(options) {
  return `binaries/${options.browser}-${options.platform}`;
}
```
