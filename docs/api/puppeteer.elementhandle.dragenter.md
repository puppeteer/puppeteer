---
sidebar_label: ElementHandle.dragEnter
---

# ElementHandle.dragEnter() method

> Warning: This API is now obsolete.
>
> Do not use. `dragenter` will automatically be performed during dragging.

#### Signature:

```typescript
class ElementHandle &#123;dragEnter(this: ElementHandle<Element>, data?: Protocol.Input.DragData): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                         | Description  |
| --------- | ------------------------------------------------------------ | ------------ |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |              |
| data      | Protocol.Input.DragData                                      | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
