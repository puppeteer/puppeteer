# Custom Browser Downloaders

Puppeteer’s pluggable downloader system allows you to implement alternative download sources for browsers and drivers. This is useful when you need to download from corporate mirrors, private repositories, or specialized browser builds.

## When to Use Custom Downloaders

Custom downloaders are appropriate when:

- **Corporate Environments**: Your organization maintains internal browser mirrors
- **Offline Development**: Working without internet access to official sources
- **Specialized Builds**: Using custom browser builds with specific features or patches
- **Alternative Sources**: Official Chrome for Testing unavailable for your platform/architecture
- **Legacy Versions**: Need older browser versions not available from official sources

:::caution

Custom downloaders are NOT officially supported by Puppeteer. You accept full responsibility for:

- Binary compatibility with Puppeteer's expectations
- Testing that browser launch and features work correctly
- Maintaining compatibility when Puppeteer or your download source changes
- Version consistency across platforms

Puppeteer only tests and guarantees Chrome for Testing binaries.

:::

## Basic Implementation

Create a simple downloader that fetches Chrome from a custom mirror:

```typescript
import { BrowserDownloader, DownloadOptions, Browser, BrowserPlatform } from '@puppeteer/browsers';

class SimpleMirrorDownloader implements BrowserDownloader {
  constructor(private mirrorUrl: string) {}

  supports(options: DownloadOptions): boolean {
    // Only support Chrome downloads
    return options.browser === Browser.CHROME;
  }

  getDownloadUrl(options: DownloadOptions): URL | null {
    // Construct download URL using mirror
    const { buildId, platform } = options;

    const filenameMap = {
      [BrowserPlatform.LINUX]: 'chrome-linux64.zip',
      [BrowserPlatform.MAC]: 'chrome-mac-x64.zip',
      [BrowserPlatform.MAC_ARM]: 'chrome-mac-arm64.zip',
      [BrowserPlatform.WIN32]: 'chrome-win32.zip',
      [BrowserPlatform.WIN64]: 'chrome-win64.zip'
    };

    const filename = filenameMap[platform];
    if (!filename) return null;

    return new URL(`${this.mirrorUrl}/chrome/${buildId}/${filename}`);
  }

  getExecutablePath(options: DownloadOptions): string {
    // Return path to executable in extracted archive
    const { platform } = options;

    if (platform === BrowserPlatform.MAC || platform === BrowserPlatform.MAC_ARM) {
      return 'chrome-mac/Chromium.app/Contents/MacOS/Chromium';
    } else if (platform === BrowserPlatform.LINUX) {
      return 'chrome-linux64/chrome';
    } else if (platform.includes('win')) {
      return 'chrome-win64/chrome.exe';
    }

    throw new Error(`Unsupported platform: ${platform}`);
  }
}
```

## Usage with Installation

```typescript
import { install } from '@puppeteer/browsers';

const customDownloader = new CustomDownloader();

// Install with custom downloader
await install({
  browser: Browser.CHROME,
  buildId: '120.0.6099.109',
  platform: BrowserPlatform.LINUX,
  cacheDir: '/tmp/puppeteer-cache',
  downloaders: [customDownloader]
});
```

## Downloader Chaining

Downloaders are tried in order until one succeeds:

```typescript
await install({
  browser: Browser.CHROME,
  buildId: '120.0.6099.109',
  platform: BrowserPlatform.LINUX,
  downloaders: [
    new CorporateMirrorDownloader('https://internal.company.com'), // Try first
    new CDNFallbackDownloader(), // Fallback
    // Chrome for Testing automatically added as final fallback
  ]
});
```

## Troubleshooting

### Binary Launch Issues

**Problem**: Browser downloads but fails to launch
**Solution**: Verify `getExecutablePath()` returns correct path within archive

### Archive Structure Problems

**Problem**: "Cannot find executable in archive"
**Solution**: Check archive contents and adjust `getExecutablePath()`

### Version Resolution Failures

**Problem**: "Version not found" for aliases like "stable"
**Solution**: Implement version resolution in `getDownloadUrl()` or use exact version numbers

### Platform Compatibility

**Problem**: Downloads work on one platform but not others
**Solution**: Ensure `supports()` method correctly identifies supported platforms

### Network Timeouts

**Problem**: Downloads fail with timeout errors
**Solution**: Implement retry logic or use faster mirror sources
