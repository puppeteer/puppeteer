---
sidebar_label: Extension.triggerAction
---

# Extension.triggerAction() method

Triggers the default action of the extension for a specified page. This typically simulates a user clicking the extension's action icon in the browser toolbar, potentially opening a popup or executing an action script.

### Signature

```typescript
class Extension {
  abstract triggerAction(page: Page): Promise<void>;
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

page

</td><td>

[Page](./puppeteer.page.md)

</td><td>

The page to trigger the action on.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
