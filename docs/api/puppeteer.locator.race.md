---
sidebar_label: Locator.race
---

# Locator.race() method

Creates a race between multiple locators but ensures that only a single one acts.

#### Signature:

```typescript
class Locator \{static race<Locators extends readonly unknown[] | []>(locators: Locators): Locator<AwaitedLocator<Locators[number]>>;\}
```

## Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| locators  | Locators |             |

**Returns:**

[Locator](./puppeteer.locator.md)&lt;[AwaitedLocator](./puppeteer.awaitedlocator.md)&lt;Locators\[number\]&gt;&gt;
