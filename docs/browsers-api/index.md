---
sidebar_label: API
---

# @puppeteer/browsers

Manage and launch browsers/drivers from a CLI or programmatically.

## CLI

Use `npx` to run the CLI:

```bash
npx @puppeteer/browsers --help
```

Built-in per-command `help` will provide all documentation you need to use the CLI.

```bash
npx @puppeteer/browsers --help # help for all commands
npx @puppeteer/browsers install --help # help for the install command
npx @puppeteer/browsers launch --help # help for the launch command
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
```

## Known limitations

1. Launching the system browsers is only possible for Chrome/Chromium.

## API

The programmatic API allows installing and launching browsers from your code. See the `test` folder for examples on how to use the `install`, `canInstall`, `launch`, `computeExecutablePath`, `computeSystemExecutablePath` and other methods.

## Classes

<table><thead><tr><th>

Class

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<p id="cli">[CLI](./browsers.cli.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="installedbrowser">[InstalledBrowser](./browsers.installedbrowser.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="process">[Process](./browsers.process.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="timeouterror">[TimeoutError](./browsers.timeouterror.md)</p>

</td><td>

</td></tr>
</tbody></table>

## Enumerations

<table><thead><tr><th>

Enumeration

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<p id="browser">[Browser](./browsers.browser.md)</p>

</td><td>

Supported browsers.

</td></tr>
<tr><td>

<p id="browserplatform">[BrowserPlatform](./browsers.browserplatform.md)</p>

</td><td>

Platform names used to identify a OS platform x architecture combination in the way that is relevant for the browser download.

</td></tr>
<tr><td>

<p id="chromereleasechannel">[ChromeReleaseChannel](./browsers.chromereleasechannel.md)</p>

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

<p id="candownload">[canDownload(options)](./browsers.candownload.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="computeexecutablepath">[computeExecutablePath(options)](./browsers.computeexecutablepath.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="computesystemexecutablepath">[computeSystemExecutablePath(options)](./browsers.computesystemexecutablepath.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="createprofile">[createProfile(browser, opts)](./browsers.createprofile.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="detectbrowserplatform">[detectBrowserPlatform()](./browsers.detectbrowserplatform.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="getinstalledbrowsers">[getInstalledBrowsers(options)](./browsers.getinstalledbrowsers.md)</p>

</td><td>

Returns metadata about browsers installed in the cache directory.

</td></tr>
<tr><td>

<p id="getversioncomparator">[getVersionComparator(browser)](./browsers.getversioncomparator.md)</p>

</td><td>

Returns a version comparator for the given browser that can be used to sort browser versions.

</td></tr>
<tr><td>

<p id="install">[install(options)](./browsers.install.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="install">[install(options)](./browsers.install_1.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="launch">[launch(opts)](./browsers.launch.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="makeprogresscallback">[makeProgressCallback(browser, buildId)](./browsers.makeprogresscallback.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="resolvebuildid">[resolveBuildId(browser, platform, tag)](./browsers.resolvebuildid.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="uninstall">[uninstall(options)](./browsers.uninstall.md)</p>

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

<p id="getinstalledbrowsersoptions">[GetInstalledBrowsersOptions](./browsers.getinstalledbrowsersoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="installoptions">[InstallOptions](./browsers.installoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="launchoptions">[LaunchOptions](./browsers.launchoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="options">[Options](./browsers.options.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="profileoptions">[ProfileOptions](./browsers.profileoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="systemoptions">[SystemOptions](./browsers.systemoptions.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="uninstalloptions">[UninstallOptions](./browsers.uninstalloptions.md)</p>

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

<p id="cdp_websocket_endpoint_regex">[CDP\_WEBSOCKET\_ENDPOINT\_REGEX](./browsers.cdp_websocket_endpoint_regex.md)</p>

</td><td>

</td></tr>
<tr><td>

<p id="webdriver_bidi_websocket_endpoint_regex">[WEBDRIVER\_BIDI\_WEBSOCKET\_ENDPOINT\_REGEX](./browsers.webdriver_bidi_websocket_endpoint_regex.md)</p>

</td><td>

</td></tr>
</tbody></table>
