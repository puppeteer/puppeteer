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

<span id="channel">channel</span>

</td><td>

`optional`

</td><td>

[ChromeReleaseChannel](./puppeteer.chromereleasechannel.md)

</td><td>

Chrome Release Channel

</td><td>

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

Path to a browser executable to use instead of the bundled Chromium. Note that Puppeteer is only guaranteed to work with the bundled Chromium, so use this setting at your own risk.

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

Connect to a browser over a pipe instead of a WebSocket.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="product">product</span>

</td><td>

`optional`

</td><td>

[Product](./puppeteer.product.md)

</td><td>

Which browser to launch.

</td><td>

`chrome`

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
