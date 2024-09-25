---
sidebar_label: Locator.waitHandle
---

# Locator.waitHandle() method

Waits for the locator to get a handle from the page.

### Signature

```typescript
class Locator {
  waitHandle(options?: Readonly<ActionOptions>): Promise<HandleFor<T>>;
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

Readonly&lt;[ActionOptions](./puppeteer.actionoptions.md)&gt;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;T&gt;&gt;
