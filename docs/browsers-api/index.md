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

[CLI](./browsers.cli.md)

</td><td>

</td></tr>
<tr><td>

[InstalledBrowser](./browsers.installedbrowser.md)

</td><td>

</td></tr>
<tr><td>

[Process](./browsers.process.md)

</td><td>

</td></tr>
<tr><td>

[TimeoutError](./browsers.timeouterror.md)

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

[Browser](./browsers.browser.md)

</td><td>

Supported browsers.

</td></tr>
<tr><td>

[BrowserPlatform](./browsers.browserplatform.md)

</td><td>

Platform names used to identify a OS platform x architecture combination in the way that is relevant for the browser download.

</td></tr>
<tr><td>

[ChromeReleaseChannel](./browsers.chromereleasechannel.md)

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

[canDownload(options)](./browsers.candownload.md)

</td><td>

</td></tr>
<tr><td>

[computeExecutablePath(options)](./browsers.computeexecutablepath.md)

</td><td>

</td></tr>
<tr><td>

[computeSystemExecutablePath(options)](./browsers.computesystemexecutablepath.md)

</td><td>

</td></tr>
<tr><td>

[createProfile(browser, opts)](./browsers.createprofile.md)

</td><td>

</td></tr>
<tr><td>

[detectBrowserPlatform()](./browsers.detectbrowserplatform.md)

</td><td>

</td></tr>
<tr><td>

[getInstalledBrowsers(options)](./browsers.getinstalledbrowsers.md)

</td><td>

Returns metadata about browsers installed in the cache directory.

</td></tr>
<tr><td>

[getVersionComparator(browser)](./browsers.getversioncomparator.md)

</td><td>

Returns a version comparator for the given browser that can be used to sort browser versions.

</td></tr>
<tr><td>

[install(options)](./browsers.install.md)

</td><td>

</td></tr>
<tr><td>

[install(options)](./browsers.install_1.md)

</td><td>

</td></tr>
<tr><td>

[launch(opts)](./browsers.launch.md)

</td><td>

</td></tr>
<tr><td>

[makeProgressCallback(browser, buildId)](./browsers.makeprogresscallback.md)

</td><td>

</td></tr>
<tr><td>

[resolveBuildId(browser, platform, tag)](./browsers.resolvebuildid.md)

</td><td>

</td></tr>
<tr><td>

[uninstall(options)](./browsers.uninstall.md)

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

[GetInstalledBrowsersOptions](./browsers.getinstalledbrowsersoptions.md)

</td><td>

</td></tr>
<tr><td>

[InstallOptions](./browsers.installoptions.md)

</td><td>

</td></tr>
<tr><td>

[LaunchOptions](./browsers.launchoptions.md)

</td><td>

</td></tr>
<tr><td>

[Options](./browsers.options.md)

</td><td>

</td></tr>
<tr><td>

[ProfileOptions](./browsers.profileoptions.md)

</td><td>

</td></tr>
<tr><td>

[SystemOptions](./browsers.systemoptions.md)

</td><td>

</td></tr>
<tr><td>

[UninstallOptions](./browsers.uninstalloptions.md)

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

[CDP_WEBSOCKET_ENDPOINT_REGEX](./browsers.cdp_websocket_endpoint_regex.md)

</td><td>

</td></tr>
<tr><td>

[WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX](./browsers.webdriver_bidi_websocket_endpoint_regex.md)

</td><td>

</td></tr>
</tbody></table>
