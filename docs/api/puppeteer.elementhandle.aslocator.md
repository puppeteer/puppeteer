---
sidebar_label: ElementHandle.asLocator
---

# ElementHandle.asLocator() method

Creates a locator based on an ElementHandle. This would not allow refreshing the element handle if it is stale but it allows re-using other locator pre-conditions.

### Signature

```typescript
class ElementHandle {
  asLocator(this: ElementHandle<Element>): Locator<Element>;
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

this

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

[Locator](./puppeteer.locator.md)&lt;Element&gt;
