---
sidebar_label: API
---

# @puppeteer/browsers

Manage and launch browsers/drivers from a CLI or programmatically.

## System requirements

- A compatible Node version (see `engines` in `package.json`).
- For Firefox downloads:
  - Linux builds: `xz` and `bzip2` utilities are required to unpack `.tar.gz` and `.tar.bz2` archives.
  - MacOS builds: `hdiutil` is required to unpack `.dmg` archives.

## CLI

Use `npx` to run the CLI:

```bash
# This will install and run the @puppeteer/browsers package.
# If it is already installed in the current directory, the installed
# version will be used.
npx @puppeteer/browsers --help
```

Built-in per-command `help` will provide all documentation you need to use the CLI.

```bash
npx @puppeteer/browsers --help # help for all commands
npx @puppeteer/browsers install --help # help for the install command
npx @puppeteer/browsers launch --help # help for the launch command
npx @puppeteer/browsers clear --help # help for the clear command
npx @puppeteer/browsers list --help # help for the list command
```

You can specify the version of the `@puppeteer/browsers` when using
`npx`:

```bash
# Always install and use the latest version from the registry.
npx @puppeteer/browsers@latest --help
# Always use a specifc version.
npx @puppeteer/browsers@2.4.1 --help
# Always install the latest version and automatically confirm the installation.
npx --yes @puppeteer/browsers@latest --help
```

To clear all installed browsers, use the `clear` command:

```bash
npx @puppeteer/browsers clear
```

To list all installed browsers, use the `list` command:

```bash
npx @puppeteer/browsers list
```

Some example to give an idea of what the CLI looks like (use the `--help` command for more examples):

```sh
# Download the latest available Chrome for Testing binary corresponding to the Stable channel.
npx @puppeteer/browsers install chrome@stable

# Download a specific Chrome for Testing version.
npx @puppeteer/browsers install chrome@116.0.5793.0

# Download the latest Chrome for Testing version for the given milestone.
npx @puppeteer/browsers install chrome@117

# Download the latest available ChromeDriver version corresponding to the Canary channel.
npx @puppeteer/browsers install chromedriver@canary

# Download a specific ChromeDriver version.
npx @puppeteer/browsers install chromedriver@116.0.5793.0

# On Ubuntu/Debian and only for Chrome, install the browser and required system dependencies.
# If the browser version has already been installed, the command
# will still attempt to install system dependencies.
# Requires root privileges.
npx puppeteer browsers install chrome --install-deps
```

## Known limitations

1. Launching the system browsers is only possible for Chrome/Chromium.

## Custom Providers

You can implement custom browser providers to download from alternative sources like corporate mirrors, private repositories, or specialized browser builds.

```typescript
import {
  BrowserProvider,
  DownloadOptions,
  Browser,
  BrowserPlatform,
} from '@puppeteer/browsers';

class SimpleMirrorProvider implements BrowserProvider {
  constructor(private mirrorUrl: string) {}

  supports(options: DownloadOptions): boolean {
    return options.browser === Browser.CHROME;
  }

  getDownloadUrl(options: DownloadOptions): URL | null {
    const {buildId, platform} = options;
    const filenameMap = {
      [BrowserPlatform.LINUX]: 'chrome-linux64.zip',
      [BrowserPlatform.MAC]: 'chrome-mac-x64.zip',
      [BrowserPlatform.MAC_ARM]: 'chrome-mac-arm64.zip',
      [BrowserPlatform.WIN32]: 'chrome-win32.zip',
      [BrowserPlatform.WIN64]: 'chrome-win64.zip',
    };
    const filename = filenameMap[platform];
    if (!filename) return null;
    return new URL(`${this.mirrorUrl}/chrome/${buildId}/${filename}`);
  }

  getExecutablePath(options: DownloadOptions): string {
    const {platform} = options;
    if (
      platform === BrowserPlatform.MAC ||
      platform === BrowserPlatform.MAC_ARM
    ) {
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

Use with the `install` API:

```typescript
import {install} from '@puppeteer/browsers';

const customProvider = new SimpleMirrorProvider('https://internal.company.com');

await install({
  browser: Browser.CHROME,
  buildId: '120.0.6099.109',
  platform: BrowserPlatform.LINUX,
  cacheDir: '/tmp/puppeteer-cache',
  providers: [customProvider],
});
```

Multiple providers can be chained - they're tried in order until one succeeds, with a default provider such as Chrome for Testing, as an automatic fallback.

:::caution
Custom providers are NOT officially supported by Puppeteer. You accept full responsibility for binary compatibility, testing, and maintenance.
:::

## API

The programmatic API allows installing and launching browsers from your code. See the `test` folder for examples on how to use the `install`, `canInstall`, `launch`, `computeExecutablePath`, `computeSystemExecutablePath` and other methods.

## Classes

<table><thead><tr><th>

Class

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="cli">[CLI](./browsers.cli.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="defaultprovider">[DefaultProvider](./browsers.defaultprovider.md)</span>

</td><td>

Default provider implementation that uses default sources. This is the standard provider used by Puppeteer.

</td></tr>
<tr><td>

<span id="installedbrowser">[InstalledBrowser](./browsers.installedbrowser.md)</span>

</td><td>

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `InstalledBrowser` class.

</td></tr>
<tr><td>

<span id="process">[Process](./browsers.process.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="timeouterror">[TimeoutError](./browsers.timeouterror.md)</span>

</td><td>

**Remarks:**

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `TimeoutError` class.

</td></tr>
</tbody></table>

## Enumerations

<table><thead><tr><th>

Enumeration

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="browser">[Browser](./browsers.browser.md)</span>

</td><td>

Supported browsers.

</td></tr>
<tr><td>

<span id="browserplatform">[BrowserPlatform](./browsers.browserplatform.md)</span>

</td><td>

Platform names used to identify a OS platform x architecture combination in the way that is relevant for the browser download.

</td></tr>
<tr><td>

<span id="browsertag">[BrowserTag](./browsers.browsertag.md)</span>

</td><td>

Enum describing a release channel for a browser.

You can use this in combination with [resolveBuildId()](./browsers.resolvebuildid.md) to resolve a build ID based on a release channel.

</td></tr>
<tr><td>

<span id="chromereleasechannel">[ChromeReleaseChannel](./browsers.chromereleasechannel.md)</span>

</td><td>

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Function

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="buildarchivefilename">[buildArchiveFilename(browser, platform, buildId, extension)](./browsers.buildarchivefilename.md)</span>

</td><td>

Utility function to build a standard archive filename.

</td></tr>
<tr><td>

<span id="candownload">[canDownload(options)](./browsers.candownload.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="computeexecutablepath">[computeExecutablePath(options)](./browsers.computeexecutablepath.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="computesystemexecutablepath">[computeSystemExecutablePath(options)](./browsers.computesystemexecutablepath.md)</span>

</td><td>

Returns a path to a system-wide Chrome installation given a release channel name by checking known installation locations (using [https://pptr.dev/browsers-api/browsers.computesystemexecutablepath](https://pptr.dev/browsers-api/browsers.computesystemexecutablepath)). If Chrome instance is not found at the expected path, an error is thrown.

</td></tr>
<tr><td>

<span id="createprofile">[createProfile(browser, opts)](./browsers.createprofile.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="detectbrowserplatform">[detectBrowserPlatform()](./browsers.detectbrowserplatform.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="getdownloadurl">[getDownloadUrl(browser, platform, buildId, baseUrl)](./browsers.getdownloadurl.md)</span>

</td><td>

Retrieves a URL for downloading the binary archive of a given browser.

The archive is bound to the specific platform and build ID specified.

</td></tr>
<tr><td>

<span id="getinstalledbrowsers">[getInstalledBrowsers(options)](./browsers.getinstalledbrowsers.md)</span>

</td><td>

Returns metadata about browsers installed in the cache directory.

</td></tr>
<tr><td>

<span id="getversioncomparator">[getVersionComparator(browser)](./browsers.getversioncomparator.md)</span>

</td><td>

Returns a version comparator for the given browser that can be used to sort browser versions.

</td></tr>
<tr><td>

<span id="install">[install(options)](./browsers.install.md)</span>

</td><td>

Downloads and unpacks the browser archive according to the [InstallOptions](./browsers.installoptions.md).

</td></tr>
<tr><td>

<span id="install">[install(options)](./browsers.install.md#overload-2)</span>

</td><td>

Downloads the browser archive according to the [InstallOptions](./browsers.installoptions.md) without unpacking.

</td></tr>
<tr><td>

<span id="launch">[launch(opts)](./browsers.launch.md)</span>

</td><td>

Launches a browser process according to [LaunchOptions](./browsers.launchoptions.md).

</td></tr>
<tr><td>

<span id="makeprogresscallback">[makeProgressCallback(browser, buildId)](./browsers.makeprogresscallback.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="resolvebuildid">[resolveBuildId(browser, platform, tag)](./browsers.resolvebuildid.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="resolvedefaultuserdatadir">[resolveDefaultUserDataDir(browser, platform, channel)](./browsers.resolvedefaultuserdatadir.md)</span>

</td><td>

Returns the expected default user data dir for the given channel. It does not check if the dir actually exists.

</td></tr>
<tr><td>

<span id="uninstall">[uninstall(options)](./browsers.uninstall.md)</span>

</td><td>

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Interface

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="browserprovider">[BrowserProvider](./browsers.browserprovider.md)</span>

</td><td>

Interface for custom browser provider implementations. Allows users to implement alternative download sources for browsers.

⚠️ **IMPORTANT**: Custom providers are NOT officially supported by Puppeteer.

By implementing this interface, you accept full responsibility for:

- Ensuring downloaded binaries are compatible with Puppeteer's expectations - Testing that browser launch and other features work with your binaries - Maintaining compatibility when Puppeteer or your download source changes - Version consistency across platforms if mixing sources

Puppeteer only tests and guarantees Chrome for Testing binaries.

</td></tr>
<tr><td>

<span id="downloadoptions">[DownloadOptions](./browsers.downloadoptions.md)</span>

</td><td>

Options passed to a provider.

</td></tr>
<tr><td>

<span id="getinstalledbrowsersoptions">[GetInstalledBrowsersOptions](./browsers.getinstalledbrowsersoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="installoptions">[InstallOptions](./browsers.installoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="launchoptions">[LaunchOptions](./browsers.launchoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="metadata_2">[Metadata_2](./browsers.metadata_2.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="options">[Options](./browsers.options.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="profileoptions">[ProfileOptions](./browsers.profileoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="systemoptions">[SystemOptions](./browsers.systemoptions.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="uninstalloptions">[UninstallOptions](./browsers.uninstalloptions.md)</span>

</td><td>

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Variable

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="cdp_websocket_endpoint_regex">[CDP_WEBSOCKET_ENDPOINT_REGEX](./browsers.cdp_websocket_endpoint_regex.md)</span>

</td><td>

</td></tr>
<tr><td>

<span id="webdriver_bidi_websocket_endpoint_regex">[WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX](./browsers.webdriver_bidi_websocket_endpoint_regex.md)</span>

</td><td>

</td></tr>
</tbody></table>
