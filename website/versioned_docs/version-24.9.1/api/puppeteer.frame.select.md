---
sidebar_label: Frame.select
---

# Frame.select() method

Selects a set of value on the first `<select>` element that matches the `selector`.

### Signature

```typescript
class Frame {
  select(selector: string, ...values: string[]): Promise<string[]>;
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

string

</td><td>

The selector to query for.

</td></tr>
<tr><td>

values

</td><td>

string\[\]

</td><td>

The array of values to select. If the `<select>` has the `multiple` attribute, all values are considered, otherwise only the first one is taken into account.

</td></tr>
</tbody></table>
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
