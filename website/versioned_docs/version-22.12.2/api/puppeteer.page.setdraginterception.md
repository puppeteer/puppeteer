---
sidebar_label: Page.setDragInterception
---

# Page.setDragInterception() method

> Warning: This API is now obsolete.
>
> We no longer support intercepting drag payloads. Use the new drag APIs found on [ElementHandle](./puppeteer.elementhandle.md) to drag (or just use the [Page.mouse](./puppeteer.page.md#mouse)).

#### Signature:

```typescript
class Page {
  abstract setDragInterception(enabled: boolean): Promise<void>;
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

enabled

</td><td>

boolean

</td><td>

Whether to enable drag interception.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
