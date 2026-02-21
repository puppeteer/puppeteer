---
sidebar_label: ElementHandle.getText
---

# ElementHandle.getText() method

Retrieves the `innerText` of the first descendant element that matches the provided selector within the current element context.

This method uses Puppeteer's `$eval` internally and executes in the page context. The returned value is normalized to an empty string if `innerText` is `null` or `undefined`.

### Signature

```typescript
class ElementHandle {
  getText<Selector extends string>(selector: Selector): Promise<string>;
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

selector

</td><td>

Selector

</td><td>

A non-empty CSS selector used to locate the target element relative to the current element.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;string&gt;

A promise that resolves to the `innerText` of the matched element.

## Exceptions

An error if: - The selector is not a non-empty string. - No element matches the selector. - The matched node is not an `HTMLElement`. - The underlying evaluation fails.

## Remarks

- Decorated with `@throwIfDisposed`, preventing execution on a disposed handle. - Decorated with `@bindIsolatedHandle`, ensuring execution within the correct isolated context. - Throws a descriptive error if no element matches the selector.

## Example

```ts
const title = await pageHandle.getText('.title');
console.log(title);
```
