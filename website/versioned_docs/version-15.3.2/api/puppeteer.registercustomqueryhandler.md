---
sidebar_label: registerCustomQueryHandler
---

# registerCustomQueryHandler() function

Registers a [custom query handler](./puppeteer.customqueryhandler.md).

**Signature:**

```typescript
export declare function registerCustomQueryHandler(
  name: string,
  handler: CustomQueryHandler
): void;
```

## Parameters

| Parameter | Type                                                    | Description                                                      |
| --------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| name      | string                                                  | The name that the custom query handler will be registered under. |
| handler   | [CustomQueryHandler](./puppeteer.customqueryhandler.md) |                                                                  |

**Returns:**

void

## Remarks

After registration, the handler can be used everywhere where a selector is expected by prepending the selection string with `<name>/`. The name is only allowed to consist of lower- and upper case latin letters.

## Example

```
puppeteer.registerCustomQueryHandler('text', { … });
const aHandle = await page.$('text/…');
```
