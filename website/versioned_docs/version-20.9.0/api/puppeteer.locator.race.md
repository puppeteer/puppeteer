---
sidebar_label: Locator.race
---

# Locator.race() method

Creates a race between multiple locators but ensures that only a single one acts.

#### Signature:

```typescript
class Locator {
  static race<Locators extends Array<Locator<unknown>>>(
    locators: Locators
  ): Locator<UnionLocatorOf<Locators>>;
}
```

## Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| locators  | Locators |             |

**Returns:**

[Locator](./puppeteer.locator.md)&lt;UnionLocatorOf&lt;Locators&gt;&gt;
