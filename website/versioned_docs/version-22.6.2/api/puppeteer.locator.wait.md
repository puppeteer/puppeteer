---
sidebar_label: Locator.wait
---

# Locator.wait() method

Waits for the locator to get the serialized value from the page.

Note this requires the value to be JSON-serializable.

#### Signature:

```typescript
class Locator {
  wait(options?: Readonly<ActionOptions>): Promise<T>;
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

Promise&lt;T&gt;
