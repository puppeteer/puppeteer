---
sidebar_label: InstalledBrowser
---

# InstalledBrowser class

### Signature

```typescript
export declare class InstalledBrowser
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `InstalledBrowser` class.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="browser">browser</span>

</td><td>

</td><td>

[Browser](./browsers.browser.md)

</td><td>

</td></tr>
<tr><td>

<span id="buildid">buildId</span>

</td><td>

</td><td>

string

</td><td>

</td></tr>
<tr><td>

<span id="executablepath">executablePath</span>

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`readonly`

</td><td>

string

</td><td>

Path to the root of the installation folder. Use [computeExecutablePath()](./browsers.computeexecutablepath.md) to get the path to the executable binary.

</td></tr>
<tr><td>

<span id="platform">platform</span>

</td><td>

</td><td>

[BrowserPlatform](./browsers.browserplatform.md)

</td><td>

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="readmetadata">[readMetadata()](./browsers.installedbrowser.readmetadata.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="writemetadata">[writeMetadata(metadata)](./browsers.installedbrowser.writemetadata.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
