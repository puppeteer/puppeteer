---
sidebar_label: API
---

# API Reference

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
| [BrowserPlatform](./browsers.browserplatform.md)           | Platform names used to identify a OS platfrom x architecture combination in the way that is relevant for the browser download. |
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
