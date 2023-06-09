---
sidebar_label: Frame.locator
---

# Frame.locator() method

Creates a locator for the provided `selector`. See [Locator](./puppeteer.locator.md) for details and supported actions.

#### Signature:

```typescript
class Frame {
  locator(selector: string): Locator;
}
```

## Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| selector  | string |             |

**Returns:**

[Locator](./puppeteer.locator.md)

## Remarks

Locators API is experimental and we will not follow semver for breaking change in the Locators API.
