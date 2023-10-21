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

CLI help will provide all documentation you need to use the CLI.

```bash
npx @puppeteer/browsers --help # help for all commands
npx @puppeteer/browsers install --help # help for the install command
npx @puppeteer/browsers launch --help # help for the launch command
```

## Known limitations

1. We support installing and running Firefox, Chrome and Chromium. The `latest`, `beta`, `dev`, `canary`, `stable` keywords are only supported for the install command. For the `launch` command you need to specify an exact build ID. The build ID is provided by the `install` command (see `npx @puppeteer/browsers install --help` for the format).
2. Launching the system browsers is only possible for Chrome/Chromium.

## API

The programmatic API allows installing and launching browsers from your code. See the `test` folder for examples on how to use the `install`, `canInstall`, `launch`, `computeExecutablePath`, `computeSystemExecutablePath` and other methods.

## Classes

| Class                                              | Description |
| -------------------------------------------------- | ----------- |
| [CLI](./browsers.cli.md)                           |             |
| [InstalledBrowser](./browsers.installedbrowser.md) |             |
| [Process](./browsers.process.md)                   |             |
| [TimeoutError](./browsers.timeouterror.md)         |             |

## Enumerations

| Enumeration                                                | Description                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [Browser](./browsers.browser.md)                           | Supported browsers.                                                                                                            |
| [BrowserPlatform](./browsers.browserplatform.md)           | Platform names used to identify a OS platform x architecture combination in the way that is relevant for the browser download. |
| [ChromeReleaseChannel](./browsers.chromereleasechannel.md) |                                                                                                                                |

## Functions

| Function                                                                          | Description                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [canDownload(options)](./browsers.candownload.md)                                 |                                                                   |
| [computeExecutablePath(options)](./browsers.computeexecutablepath.md)             |                                                                   |
| [computeSystemExecutablePath(options)](./browsers.computesystemexecutablepath.md) |                                                                   |
| [createProfile(browser, opts)](./browsers.createprofile.md)                       |                                                                   |
| [detectBrowserPlatform()](./browsers.detectbrowserplatform.md)                    |                                                                   |
| [getInstalledBrowsers(options)](./browsers.getinstalledbrowsers.md)               | Returns metadata about browsers installed in the cache directory. |
| [install(options)](./browsers.install.md)                                         |                                                                   |
| [install(options)](./browsers.install_1.md)                                       |                                                                   |
| [launch(opts)](./browsers.launch.md)                                              |                                                                   |
| [makeProgressCallback(browser, buildId)](./browsers.makeprogresscallback.md)      |                                                                   |
| [resolveBuildId(browser, platform, tag)](./browsers.resolvebuildid.md)            |                                                                   |
| [uninstall(options)](./browsers.uninstall.md)                                     |                                                                   |

## Interfaces

| Interface                                                                | Description |
| ------------------------------------------------------------------------ | ----------- |
| [GetInstalledBrowsersOptions](./browsers.getinstalledbrowsersoptions.md) |             |
| [InstallOptions](./browsers.installoptions.md)                           |             |
| [LaunchOptions](./browsers.launchoptions.md)                             |             |
| [Options](./browsers.options.md)                                         |             |
| [ProfileOptions](./browsers.profileoptions.md)                           |             |
| [SystemOptions](./browsers.systemoptions.md)                             |             |
| [UninstallOptions](./browsers.uninstalloptions.md)                       |             |

## Variables

| Variable                                                                                         | Description |
| ------------------------------------------------------------------------------------------------ | ----------- |
| [CDP_WEBSOCKET_ENDPOINT_REGEX](./browsers.cdp_websocket_endpoint_regex.md)                       |             |
| [WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX](./browsers.webdriver_bidi_websocket_endpoint_regex.md) |             |
