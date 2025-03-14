---
sidebar_label: LaunchOptions
---

# LaunchOptions interface

Generic launch options that can be passed when launching any browser.

### Signature

```typescript
export interface LaunchOptions extends ConnectOptions
```

**Extends:** [ConnectOptions](./puppeteer.connectoptions.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="args">args</span>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

Additional command line arguments to pass to the browser instance.

</td><td>

</td></tr>
<tr><td>

<span id="browser">browser</span>

</td><td>

`optional`

</td><td>

[SupportedBrowser](./puppeteer.supportedbrowser.md)

</td><td>

Which browser to launch.

</td><td>

`chrome`

</td></tr>
<tr><td>

<span id="channel">channel</span>

</td><td>

`optional`

</td><td>

[ChromeReleaseChannel](./puppeteer.chromereleasechannel.md)

</td><td>

If specified for Chrome, looks for a regular Chrome installation at a known system location instead of using the bundled Chrome binary.

</td><td>

</td></tr>
<tr><td>

<span id="debuggingport">debuggingPort</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specify the debugging port number to use

</td><td>

</td></tr>
<tr><td>

<span id="devtools">devtools</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to auto-open a DevTools panel for each tab. If this is set to `true`, then `headless` will be forced to `false`.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="dumpio">dumpio</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

If true, pipes the browser process stdout and stderr to `process.stdout` and `process.stderr`.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="env">env</span>

</td><td>

`optional`

</td><td>

Record&lt;string, string \| undefined&gt;

</td><td>

Specify environment variables that will be visible to the browser.

</td><td>

The contents of `process.env`.

</td></tr>
<tr><td>

<span id="executablepath">executablePath</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to a browser executable to use instead of the bundled browser. Note that Puppeteer is only guaranteed to work with the bundled browser, so use this setting at your own risk.

**Remarks:**

When using this is recommended to set the `browser` property as well as Puppeteer will default to `chrome` by default.

</td><td>

</td></tr>
<tr><td>

<span id="extraprefsfirefox">extraPrefsFirefox</span>

</td><td>

`optional`

</td><td>

Record&lt;string, unknown&gt;

</td><td>

[Additional preferences](https://searchfox.org/mozilla-release/source/modules/libpref/init/all.js) that can be passed when launching with Firefox.

</td><td>

</td></tr>
<tr><td>

<span id="handlesighup">handleSIGHUP</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Close the browser process on `SIGHUP`.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="handlesigint">handleSIGINT</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Close the browser process on `Ctrl+C`.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="handlesigterm">handleSIGTERM</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Close the browser process on `SIGTERM`.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="headless">headless</span>

</td><td>

`optional`

</td><td>

boolean \| 'shell'

</td><td>

Whether to run the browser in headless mode.

**Remarks:**

- `true` launches the browser in the [new headless](https://developer.chrome.com/articles/new-headless/) mode.

- `'shell'` launches [shell](https://developer.chrome.com/blog/chrome-headless-shell) known as the old headless mode.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="ignoredefaultargs">ignoreDefaultArgs</span>

</td><td>

`optional`

</td><td>

boolean \| string\[\]

</td><td>

If `true`, do not use `puppeteer.defaultArgs()` when creating a browser. If an array is provided, these args will be filtered out. Use this with care - you probably want the default arguments Puppeteer uses.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="pipe">pipe</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Connect to a browser over a pipe instead of a WebSocket. Only supported with Chrome.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum time in milliseconds to wait for the browser to start. Pass `0` to disable the timeout.

</td><td>

`30_000` (30 seconds).

</td></tr>
<tr><td>

<span id="userdatadir">userDataDir</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to a user data directory. [see the Chromium docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md) for more info.

</td><td>

</td></tr>
<tr><td>

<span id="waitforinitialpage">waitForInitialPage</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to wait for the initial page to be ready. Useful when a user explicitly disables that (e.g. `--no-startup-window` for Chrome).

</td><td>

`true`

</td></tr>
</tbody></table>
