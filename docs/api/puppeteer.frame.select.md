---
sidebar_label: Frame.select
---

# Frame.select() method

Selects a set of value on the first `<select>` element that matches the `selector`.

#### Signature:

```typescript
class Frame {
  select(selector: string, ...values: string[]): Promise<string[]>;
}
```

## Parameters

| Parameter | Type       | Description                                                                                                                                                                               |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | string     | The selector to query for.                                                                                                                                                                |
| values    | string\[\] | The array of values to select. If the <code>&lt;select&gt;</code> has the <code>multiple</code> attribute, all values are considered, otherwise only the first one is taken into account. |

**Returns:**

Promise&lt;string\[\]&gt;

the list of values that were successfully selected.

## Exceptions

Throws if there's no `<select>` matching `selector`.

## Example

```ts
frame.select('select#colors', 'blue'); // single selection
frame.select('select#colors', 'red', 'green', 'blue'); // multiple selections
```
