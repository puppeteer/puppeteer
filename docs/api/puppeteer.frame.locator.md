---
sidebar_label: Frame.locator
---

# Frame.locator() method

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

#### Signature:

```typescript
class Frame &#123;locator<Selector extends string>(selector: Selector): Locator<NodeFor<Selector>>;&#125;
```

## Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| selector  | Selector |             |

**Returns:**

[Locator](./puppeteer.locator.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;

## Remarks

Locators API is experimental and we will not follow semver for breaking change in the Locators API.
