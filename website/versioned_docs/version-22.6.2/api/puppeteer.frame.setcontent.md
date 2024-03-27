---
sidebar_label: Frame.setContent
---

# Frame.setContent() method

Set the content of the frame.

#### Signature:

```typescript
class Frame {
  abstract setContent(html: string, options?: WaitForOptions): Promise<void>;
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

_(Optional)_ Options to configure how long before timing out and at what point to consider the content setting successful.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
