---
sidebar_label: Dialog.accept
---

# Dialog.accept() method

**Signature:**

```typescript
class Dialog {
  accept(promptText?: string): Promise<void>;
}
```

## Parameters

| Parameter  | Type   | Description                                                                                                                               |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| promptText | string | <i>(Optional)</i> optional text that will be entered in the dialog prompt. Has no effect if the dialog's type is not <code>prompt</code>. |

**Returns:**

Promise&lt;void&gt;

A promise that resolves when the dialog has been accepted.
