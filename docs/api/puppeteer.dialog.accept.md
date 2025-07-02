---
sidebar_label: Dialog.accept
---

# Dialog.accept() method

A promise that resolves when the dialog has been accepted.

### Signature

```typescript
class Dialog {
  accept(promptText?: string): Promise<void>;
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

promptText

</td><td>

string

</td><td>

_(Optional)_ optional text that will be entered in the dialog prompt. Has no effect if the dialog's type is not `prompt`.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
