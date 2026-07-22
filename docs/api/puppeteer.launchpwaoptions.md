---
sidebar_label: LaunchPWAOptions
---

# LaunchPWAOptions interface

Options for [Browser.launchPWA()](./puppeteer.browser.launchpwa.md).

### Signature

```typescript
export interface LaunchPWAOptions
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

<span id="manifestid">manifestId</span>

</td><td>

</td><td>

string

</td><td>

The id from the web app's manifest file.

</td><td>

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum wait time in milliseconds for the app window to open. Defaults to 30 seconds.

</td><td>

</td></tr>
<tr><td>

<span id="url">url</span>

</td><td>

`optional`

</td><td>

string

</td><td>

An optional URL within the app's scope to launch. Defaults to the app's start URL.

</td><td>

</td></tr>
</tbody></table>
