---
sidebar_label: Keyboard.up
---

# Keyboard.up() method

Dispatches a `keyup` event.

#### Signature:

```typescript
class Keyboard {
  up(key: KeyInput): Promise<void>;
}
```

## Parameters

| Parameter | Type                                | Description                                                                                                                  |
| --------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| key       | [KeyInput](./puppeteer.keyinput.md) | Name of key to release, such as <code>ArrowLeft</code>. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names. |

**Returns:**

Promise&lt;void&gt;
