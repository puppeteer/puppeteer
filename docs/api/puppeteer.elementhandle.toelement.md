---
sidebar_label: ElementHandle.toElement
---

# ElementHandle.toElement() method

Converts the current handle to the given element type.

### Signature

```typescript
class ElementHandle {
  toElement<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>(
    tagName: K,
  ): Promise<HandleFor<ElementFor<K>>>;
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

tagName

</td><td>

K

</td><td>

The tag name of the desired element type.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;[ElementFor](./puppeteer.elementfor.md)&lt;K&gt;&gt;&gt;

## Exceptions

An error if the handle does not match. **The handle will not be automatically disposed.**

## Example

```ts
const element: ElementHandle<Element> = await page.$('.class-name-of-anchor');
// DO NOT DISPOSE `element`, this will be always be the same handle.
const anchor: ElementHandle<HTMLAnchorElement> = await element.toElement('a');
```
