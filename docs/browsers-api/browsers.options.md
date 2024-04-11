---
sidebar_label: Options
---

# Options interface

#### Signature:

```typescript
export interface ComputeExecutablePathOptions
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

<span id="browser">browser</span>

</td><td>

</td><td>

[Browser](./browsers.browser.md)

</td><td>

Determines which browser to launch.

</td><td>

</td></tr>
<tr><td>

<span id="buildid">buildId</span>

</td><td>

</td><td>

string

</td><td>

Determines which buildId to download. BuildId should uniquely identify binaries and they are used for caching.

</td><td>

</td></tr>
<tr><td>

<span id="cachedir">cacheDir</span>

</td><td>

</td><td>

string

</td><td>

Root path to the storage directory.

</td><td>

</td></tr>
<tr><td>

<span id="platform">platform</span>

</td><td>

`optional`

</td><td>

[BrowserPlatform](./browsers.browserplatform.md)

</td><td>

Determines which platform the browser will be suited for.

</td><td>

**Auto-detected.**

</td></tr>
</tbody></table>
