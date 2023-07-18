---
sidebar_label: Locator.race
---

# Locator.race() method

Creates a race between multiple locators but ensures that only a single one acts.

#### Signature:

```typescript
class Locator {
  static race(locators: Locator[]): Locator;
}
```

## Parameters

| Parameter | Type                                  | Description |
| --------- | ------------------------------------- | ----------- |
| locators  | [Locator](./puppeteer.locator.md)\[\] |             |

**Returns:**

[Locator](./puppeteer.locator.md)
