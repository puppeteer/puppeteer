---
sidebar_label: ElementHandle.dragAndDrop
---

# ElementHandle.dragAndDrop() method

> Warning: This API is now obsolete.
>
> Use `ElementHandle.drop` instead.

#### Signature:

```typescript
class ElementHandle &#123;dragAndDrop(this: ElementHandle<Element>, target: ElementHandle<Node>, options?: &#123;
        delay: number;
    &#125;): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                         | Description  |
| --------- | ------------------------------------------------------------ | ------------ |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |              |
| target    | [ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;    |              |
| options   | &#123; delay: number; &#125;                                 | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
