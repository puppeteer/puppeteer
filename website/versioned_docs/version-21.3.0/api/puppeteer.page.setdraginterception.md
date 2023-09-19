---
sidebar_label: Page.setDragInterception
---

# Page.setDragInterception() method

> Warning: This API is now obsolete.
>
> We no longer support intercepting drag payloads. Use the new drag APIs found on [ElementHandle](./puppeteer.elementhandle.md) to drag (or just use the [Page.mouse](./puppeteer.page.mouse.md)).

#### Signature:

```typescript
class Page {
  setDragInterception(enabled: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| enabled   | boolean | Whether to enable drag interception. |

**Returns:**

Promise&lt;void&gt;
