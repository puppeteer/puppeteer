---
sidebar_label: Page.setContent
---

# Page.setContent() method

Set the content of the page.

### Signature

```typescript
class Page {
  setContent(html: string, options?: WaitForOptions): Promise<void>;
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

html

</td><td>

string

</td><td>

HTML markup to assign to the page.

</td></tr>
<tr><td>

options

</td><td>

[WaitForOptions](./puppeteer.waitforoptions.md)

</td><td>

_(Optional)_ Parameters that has some properties.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
