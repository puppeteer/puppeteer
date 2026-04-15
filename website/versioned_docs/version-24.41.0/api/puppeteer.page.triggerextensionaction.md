---
sidebar_label: Page.triggerExtensionAction
---

# Page.triggerExtensionAction() method

Triggers an extension action for the given extension.

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

The extension to trigger the action for.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
