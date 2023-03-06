---
sidebar_label: ElementHandle.clickablePoint
---

# ElementHandle.clickablePoint() method

Returns the middle point within an element unless a specific offset is provided.

#### Signature:

```typescript
class ElementHandle {
  clickablePoint(offset?: Offset): Promise<Point>;
}
```

## Parameters

| Parameter | Type                            | Description  |
| --------- | ------------------------------- | ------------ |
| offset    | [Offset](./puppeteer.offset.md) | _(Optional)_ |

**Returns:**

Promise&lt;[Point](./puppeteer.point.md)&gt;
