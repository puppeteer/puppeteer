---
sidebar_label: Page.triggerExtensionAction
---

# Page.triggerExtensionAction() method

Triggers the default action of the specified extension for this page. This simulates clicking the extension's icon in the browser's toolbar.

### Signature

```typescript
class Page {
  abstract triggerExtensionAction(extension: Extension): Promise<void>;
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

extension

</td><td>

[Extension](./puppeteer.extension.md)

</td><td>

The [Extension](./puppeteer.extension.md) whose action to trigger.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
