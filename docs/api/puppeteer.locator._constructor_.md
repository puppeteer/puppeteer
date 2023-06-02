---
sidebar_label: Locator.(constructor)
---

# Locator.(constructor)

Constructs a new instance of the `Locator` class

#### Signature:

```typescript
class Locator {
  constructor(
    pageOrFrame: Page | Frame,
    selector: string,
    options?: LocatorOptions
  );
}
```

## Parameters

| Parameter   | Type                                                         | Description  |
| ----------- | ------------------------------------------------------------ | ------------ |
| pageOrFrame | [Page](./puppeteer.page.md) \| [Frame](./puppeteer.frame.md) |              |
| selector    | string                                                       |              |
| options     | [LocatorOptions](./puppeteer.locatoroptions.md)              | _(Optional)_ |
