---
sidebar_label: Browser.getWindowBounds
---

# Browser.getWindowBounds() method

Gets the specified window [bounds](./puppeteer.windowbounds.md).

### Signature

```typescript
class Browser {
  abstract getWindowBounds(windowId: WindowId): Promise<WindowBounds>;
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
</tbody></table>

**Returns:**

Promise&lt;[WindowBounds](./puppeteer.windowbounds.md)&gt;
