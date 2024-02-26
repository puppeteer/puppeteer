---
sidebar_label: Mouse.up
---

# Mouse.up() method

Releases the mouse.

#### Signature:

```typescript
class Mouse {
  abstract up(options?: Readonly<MouseOptions>): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                        | Description                                 |
| --------- | ----------------------------------------------------------- | ------------------------------------------- |
| options   | Readonly&lt;[MouseOptions](./puppeteer.mouseoptions.md)&gt; | _(Optional)_ Options to configure behavior. |

**Returns:**

Promise&lt;void&gt;
