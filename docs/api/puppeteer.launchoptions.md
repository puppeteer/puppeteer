---
sidebar_label: LaunchOptions
---

# LaunchOptions interface

Generic launch options that can be passed when launching any browser.

#### Signature:

```typescript
export interface LaunchOptions
```

## Properties

| Property           | Modifiers             | Type                                                        | Description                                                                                                                                                                                                                           | Default                                   |
| ------------------ | --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| channel            | <code>optional</code> | [ChromeReleaseChannel](./puppeteer.chromereleasechannel.md) | Chrome Release Channel                                                                                                                                                                                                                |                                           |
| dumpio             | <code>optional</code> | boolean                                                     | If true, pipes the browser process stdout and stderr to <code>process.stdout</code> and <code>process.stderr</code>.                                                                                                                  | <code>false</code>                        |
| env                | <code>optional</code> | Record&lt;string, string \| undefined&gt;                   | Specify environment variables that will be visible to the browser.                                                                                                                                                                    | The contents of <code>process.env</code>. |
| executablePath     | <code>optional</code> | string                                                      | Path to a browser executable to use instead of the bundled Chromium. Note that Puppeteer is only guaranteed to work with the bundled Chromium, so use this setting at your own risk.                                                  |                                           |
| extraPrefsFirefox  | <code>optional</code> | Record&lt;string, unknown&gt;                               | [Additional preferences](https://searchfox.org/mozilla-release/source/modules/libpref/init/all.js) that can be passed when launching with Firefox.                                                                                    |                                           |
| handleSIGHUP       | <code>optional</code> | boolean                                                     | Close the browser process on <code>SIGHUP</code>.                                                                                                                                                                                     | <code>true</code>                         |
| handleSIGINT       | <code>optional</code> | boolean                                                     | Close the browser process on <code>Ctrl+C</code>.                                                                                                                                                                                     | <code>true</code>                         |
| handleSIGTERM      | <code>optional</code> | boolean                                                     | Close the browser process on <code>SIGTERM</code>.                                                                                                                                                                                    | <code>true</code>                         |
| ignoreDefaultArgs  | <code>optional</code> | boolean \| string\[\]                                       | If <code>true</code>, do not use <code>puppeteer.defaultArgs()</code> when creating a browser. If an array is provided, these args will be filtered out. Use this with care - you probably want the default arguments Puppeteer uses. | <code>false</code>                        |
| pipe               | <code>optional</code> | boolean                                                     | Connect to a browser over a pipe instead of a WebSocket.                                                                                                                                                                              | <code>false</code>                        |
| product            | <code>optional</code> | [Product](./puppeteer.product.md)                           | Which browser to launch.                                                                                                                                                                                                              | <code>chrome</code>                       |
| timeout            | <code>optional</code> | number                                                      | Maximum time in milliseconds to wait for the browser to start. Pass <code>0</code> to disable the timeout.                                                                                                                            | <code>30_000</code> (30 seconds).         |
| waitForInitialPage | <code>optional</code> | boolean                                                     | Whether to wait for the initial page to be ready. Useful when a user explicitly disables that (e.g. <code>--no-startup-window</code> for Chrome).                                                                                     | <code>true</code>                         |
