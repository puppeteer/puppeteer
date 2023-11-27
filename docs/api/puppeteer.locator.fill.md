---
sidebar_label: Locator.fill
---

# Locator.fill() method

Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. contenteditable, selector, inputs are supported.

#### Signature:

```typescript
class Locator \{fill<ElementType extends Element>(this: Locator<ElementType>, value: string, options?: Readonly<ActionOptions>): Promise<void>;\}
```

## Parameters

| Parameter | Type                                                          | Description  |
| --------- | ------------------------------------------------------------- | ------------ |
| this      | [Locator](./puppeteer.locator.md)&lt;ElementType&gt;          |              |
| value     | string                                                        |              |
| options   | Readonly&lt;[ActionOptions](./puppeteer.actionoptions.md)&gt; | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
