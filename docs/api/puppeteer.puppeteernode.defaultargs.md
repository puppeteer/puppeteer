---
sidebar_label: PuppeteerNode.defaultArgs
---

# PuppeteerNode.defaultArgs() method

### Signature

```typescript
class PuppeteerNode {
  defaultArgs(options?: LaunchOptions): Promise<string[]>;
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

[LaunchOptions](./puppeteer.launchoptions.md)

</td><td>

_(Optional)_ Set of configurable options to set on the browser.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string\[\]&gt;

The default arguments that the browser will be launched with.
