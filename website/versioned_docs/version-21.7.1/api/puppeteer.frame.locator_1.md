---
sidebar_label: Frame.locator_1
---

# Frame.locator() method

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

#### Signature:

```typescript
class Frame {
  locator<Ret>(func: () => Awaitable<Ret>): Locator<Ret>;
}
```

## Parameters

| Parameter | Type                                                      | Description |
| --------- | --------------------------------------------------------- | ----------- |
| func      | () =&gt; [Awaitable](./puppeteer.awaitable.md)&lt;Ret&gt; |             |

**Returns:**

[Locator](./puppeteer.locator.md)&lt;Ret&gt;

## Remarks

Locators API is experimental and we will not follow semver for breaking change in the Locators API.
