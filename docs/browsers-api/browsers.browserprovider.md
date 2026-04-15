---
sidebar_label: BrowserProvider
---

# BrowserProvider interface

Interface for custom browser provider implementations. Allows users to implement alternative download sources for browsers.

⚠️ **IMPORTANT**: Custom providers are NOT officially supported by Puppeteer.

By implementing this interface, you accept full responsibility for:

- Ensuring downloaded binaries are compatible with Puppeteer's expectations - Testing that browser launch and other features work with your binaries - Maintaining compatibility when Puppeteer or your download source changes - Version consistency across platforms if mixing sources

Puppeteer only tests and guarantees Chrome for Testing binaries.

### Signature

```typescript
export interface BrowserProvider
```

## Example

```typescript
class ElectronDownloader implements BrowserProvider {
  supports(options: DownloadOptions): boolean {
    return options.browser === Browser.CHROMEDRIVER;
  }

  getDownloadUrl(options: DownloadOptions): URL {
    const platform = mapToPlatform(options.platform);
    return new URL(
      `v${options.buildId}/chromedriver-v${options.buildId}-${platform}.zip`,
      'https://github.com/electron/electron/releases/download/',
    );
  }

  getExecutablePath(options): string {
    const ext = options.platform.includes('win') ? '.exe' : '';
    return `chromedriver/chromedriver${ext}`;
  }
}
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="getdownloadurl">[getDownloadUrl(options)](./browsers.browserprovider.getdownloadurl.md)</span>

</td><td>

Get the download URL for the requested browser.

The buildId can be either an exact version (e.g., "131.0.6778.109") or an alias (e.g., "latest", "stable"). Custom providers should handle version resolution internally if they support aliases.

Returns null if the buildId cannot be resolved to a valid version. The URL is not validated - download will fail later if URL doesn't exist.

Can be synchronous for simple URL construction or asynchronous if version resolution/network requests are needed.

</td></tr>
<tr><td>

<span id="getexecutablepath">[getExecutablePath(options)](./browsers.browserprovider.getexecutablepath.md)</span>

</td><td>

Get the relative path to the executable within the extracted archive.

</td></tr>
<tr><td>

<span id="getname">[getName()](./browsers.browserprovider.getname.md)</span>

</td><td>

Get the name of this provider. Used for error messages and logging purposes.

**Remarks:**

This method is used instead of `constructor.name` to avoid issues with minification in production builds.

</td></tr>
<tr><td>

<span id="supports">[supports(options)](./browsers.browserprovider.supports.md)</span>

</td><td>

Check if this provider supports the given browser/platform. Used for filtering before attempting downloads.

Can be synchronous for quick checks or asynchronous if version resolution/network requests are needed.

</td></tr>
</tbody></table>
