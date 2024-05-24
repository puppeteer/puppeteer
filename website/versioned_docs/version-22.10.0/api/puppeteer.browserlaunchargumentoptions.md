---
sidebar_label: BrowserLaunchArgumentOptions
---

# BrowserLaunchArgumentOptions interface

Launcher options that only apply to Chrome.

#### Signature:

```typescript
export interface BrowserLaunchArgumentOptions
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

<span id="userdatadir">userDataDir</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to a user data directory. [see the Chromium docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md) for more info.

</td><td>

</td></tr>
</tbody></table>
