---
sidebar_label: Keyboard.up
---

# Keyboard.up() method

Dispatches a `keyup` event.

#### Signature:

```typescript
class Keyboard &#123;abstract up(key: KeyInput): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                | Description                                                                                                                  |
| --------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| key       | [KeyInput](./puppeteer.keyinput.md) | Name of key to release, such as <code>ArrowLeft</code>. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names. |

**Returns:**

Promise&lt;void&gt;
