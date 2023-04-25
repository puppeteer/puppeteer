---
sidebar_label: ElementHandle.select
---

# ElementHandle.select() method

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

#### Signature:

```typescript
class ElementHandle {
  select(...values: string[]): Promise<string[]>;
}
```

## Parameters

| Parameter | Type       | Description                                                                                                                                                                             |
| --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| values    | string\[\] | Values of options to select. If the <code>&lt;select&gt;</code> has the <code>multiple</code> attribute, all values are considered, otherwise only the first one is taken into account. |

**Returns:**

Promise&lt;string\[\]&gt;

## Example

```ts
handle.select('blue'); // single selection
handle.select('red', 'green', 'blue'); // multiple selections
```
