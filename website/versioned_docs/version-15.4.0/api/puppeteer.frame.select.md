---
sidebar_label: Frame.select
---

# Frame.select() method

Triggers a `change` and `input` event once all the provided options have been selected.

**Signature:**

```typescript
class Frame {
  select(selector: string, ...values: string[]): Promise<string[]>;
}
```

## Parameters

| Parameter | Type       | Description                                                                                                                                                                              |
| --------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | string     | a selector to query the frame for                                                                                                                                                        |
| values    | string\[\] | an array of values to select. If the <code>&lt;select&gt;</code> has the <code>multiple</code> attribute, all values are considered, otherwise only the first one is taken into account. |

**Returns:**

Promise&lt;string\[\]&gt;

the list of values that were successfully selected.

## Remarks

If there's no `<select>` element matching `selector`, the method throws an error.

## Example

```ts
frame.select('select#colors', 'blue'); // single selection
frame.select('select#colors', 'red', 'green', 'blue'); // multiple selections
```
