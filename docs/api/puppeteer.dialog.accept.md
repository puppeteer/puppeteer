---
sidebar_label: Dialog.accept
---

# Dialog.accept() method

A promise that resolves when the dialog has been accepted.

#### Signature:

```typescript
class Dialog &#123;accept(promptText?: string): Promise<void>;&#125;
```

## Parameters

| Parameter  | Type   | Description                                                                                                                          |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| promptText | string | _(Optional)_ optional text that will be entered in the dialog prompt. Has no effect if the dialog's type is not <code>prompt</code>. |

**Returns:**

Promise&lt;void&gt;
