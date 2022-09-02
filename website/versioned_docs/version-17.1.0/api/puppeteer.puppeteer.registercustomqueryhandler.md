---
sidebar_label: Puppeteer.registerCustomQueryHandler
---

# Puppeteer.registerCustomQueryHandler() method

> Warning: This API is now obsolete.
>
> Import directly puppeteer.

**Signature:**

```typescript
class Puppeteer {
  registerCustomQueryHandler(
    name: string,
    queryHandler: CustomQueryHandler
  ): void;
}
```

## Parameters

| Parameter    | Type                                                    | Description |
| ------------ | ------------------------------------------------------- | ----------- |
| name         | string                                                  |             |
| queryHandler | [CustomQueryHandler](./puppeteer.customqueryhandler.md) |             |

**Returns:**

void

## Example

```ts
import {registerCustomQueryHandler} from 'puppeteer';
```
