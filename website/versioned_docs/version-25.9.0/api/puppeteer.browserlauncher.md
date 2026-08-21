---
sidebar_label: BrowserLauncher
---

# BrowserLauncher class

Describes a launcher - a class that is able to create and launch a browser instance.

### Signature

```typescript
export declare abstract class BrowserLauncher
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `BrowserLauncher` class.

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

`readonly`

</td><td>

[SupportedBrowser](./puppeteer.supportedbrowser.md)

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

<span id="defaultargs">[defaultArgs(object)](./puppeteer.browserlauncher.defaultargs.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="executablepath">[executablePath(channel, validatePath)](./puppeteer.browserlauncher.executablepath.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="launch">[launch(options)](./puppeteer.browserlauncher.launch.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
