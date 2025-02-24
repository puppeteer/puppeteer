---
sidebar_label: PuppeteerNode.connect
---

# PuppeteerNode.connect() method

This method attaches Puppeteer to an existing browser instance.

### Signature

```typescript
class PuppeteerNode {
  connect(options: ConnectOptions): Promise<Browser>;
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

[ConnectOptions](./puppeteer.connectoptions.md)

</td><td>

Set of configurable options to set on the browser.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[Browser](./puppeteer.browser.md)&gt;

Promise which resolves to browser instance.
