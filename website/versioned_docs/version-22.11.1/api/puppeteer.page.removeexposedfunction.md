---
sidebar_label: Page.removeExposedFunction
---

# Page.removeExposedFunction() method

The method removes a previously added function via $[Page.exposeFunction()](./puppeteer.page.exposefunction.md) called `name` from the page's `window` object.

#### Signature:

```typescript
class Page {
  abstract removeExposedFunction(name: string): Promise<void>;
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

name

</td><td>

string

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
