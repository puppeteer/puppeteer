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

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

values

</td><td>

string\[\]

</td><td>

Values of options to select. If the `<select>` has the `multiple` attribute, all values are considered, otherwise only the first one is taken into account.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;string\[\]&gt;

## Example

```ts
handle.select('blue'); // single selection
handle.select('red', 'green', 'blue'); // multiple selections
```
