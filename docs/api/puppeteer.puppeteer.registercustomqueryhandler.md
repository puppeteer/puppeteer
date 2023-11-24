---
sidebar_label: Puppeteer.registerCustomQueryHandler
---

# Puppeteer.registerCustomQueryHandler() method

Registers a [custom query handler](./puppeteer.customqueryhandler.md).

#### Signature:

```typescript
class Puppeteer &#123;static registerCustomQueryHandler(name: string, queryHandler: CustomQueryHandler): void;&#125;
```

## Parameters

| Parameter    | Type                                                    | Description                                                                |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| name         | string                                                  | The name that the custom query handler will be registered under.           |
| queryHandler | [CustomQueryHandler](./puppeteer.customqueryhandler.md) | The [custom query handler](./puppeteer.customqueryhandler.md) to register. |

**Returns:**

void

## Remarks

After registration, the handler can be used everywhere where a selector is expected by prepending the selection string with `<name>/`. The name is only allowed to consist of lower- and upper case latin letters.

## Example

```
puppeteer.registerCustomQueryHandler('text', &#123; … &#125;);
const aHandle = await page.$('text/…');
```
