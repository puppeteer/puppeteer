---
sidebar_label: Page.resize
---

# Page.resize() method

Resizes the browser window of this page so that the content area (excluding browser UI) has the specified width and height.

### Signature

```typescript
class Page {
  abstract resize(params: {
    contentWidth: number;
    contentHeight: number;
  }): Promise<void>;
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

params

</td><td>

&#123; contentWidth: number; contentHeight: number; &#125;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
