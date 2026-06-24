---
sidebar_label: Browser.setWindowBounds
---

# Browser.setWindowBounds() method

Sets the specified window [bounds](./puppeteer.windowbounds.md).

### Signature

```typescript
class Browser {
  abstract setWindowBounds(
    windowId: WindowId,
    windowBounds: WindowBounds,
  ): Promise<void>;
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

windowId

</td><td>

[WindowId](./puppeteer.windowid.md)

</td><td>

</td></tr>
<tr><td>

windowBounds

</td><td>

[WindowBounds](./puppeteer.windowbounds.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
