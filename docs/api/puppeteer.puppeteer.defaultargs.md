---
sidebar_label: Puppeteer.defaultArgs
---

# Puppeteer.defaultArgs() method

#### Signature:

```typescript
class Puppeteer {
  defaultArgs(options?: BrowserLaunchArgumentOptions): Promise<string[]>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

[BrowserLaunchArgumentOptions](./puppeteer.browserlaunchargumentoptions.md)

</td><td>

_(Optional)_ Set of configurable options to set on the browser.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;string\[\]&gt;

The default flags that Chromium will be launched with.
