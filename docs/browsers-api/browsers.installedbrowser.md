---
sidebar_label: InstalledBrowser
---

# InstalledBrowser class

#### Signature:

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

<p id="browser">browser</p>

</td><td>

</td><td>

[Browser](./browsers.browser.md)

</td><td>

</td></tr>
<tr><td>

<p id="buildid">buildId</p>

</td><td>

</td><td>

string

</td><td>

</td></tr>
<tr><td>

<p id="executablepath">executablePath</p>

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
<tr><td>

<p id="path">path</p>

</td><td>

`readonly`

</td><td>

string

</td><td>

Path to the root of the installation folder. Use [computeExecutablePath()](./browsers.computeexecutablepath.md) to get the path to the executable binary.

</td></tr>
<tr><td>

<p id="platform">platform</p>

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

<p id="readmetadata">[readMetadata()](./browsers.installedbrowser.readmetadata.md)</p>

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="writemetadata">[writeMetadata(metadata)](./browsers.installedbrowser.writemetadata.md)</p>

</td><td>

</td><td>

</td></tr>
</tbody></table>
