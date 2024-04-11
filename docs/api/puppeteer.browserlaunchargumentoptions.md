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

<p id="args">args</p>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

Additional command line arguments to pass to the browser instance.

</td><td>

</td></tr>
<tr><td>

<p id="debuggingport">debuggingPort</p>

</td><td>

`optional`

</td><td>

number

</td><td>

Specify the debugging port number to use

</td><td>

</td></tr>
<tr><td>

<p id="devtools">devtools</p>

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

<p id="headless">headless</p>

</td><td>

`optional`

</td><td>

boolean \| 'shell'

</td><td>

Whether to run the browser in headless mode.

</td><td>

`true`

</td></tr>
<tr><td>

<p id="userdatadir">userDataDir</p>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to a user data directory. [see the Chromium docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md) for more info.

</td><td>

</td></tr>
</tbody></table>
