---
sidebar_label: Puppeteer.registerCustomQueryHandler
---

# Puppeteer.registerCustomQueryHandler() method

Registers a [custom query handler](./puppeteer.customqueryhandler.md).

### Signature

```typescript
class Puppeteer {
  static registerCustomQueryHandler(
    name: string,
    queryHandler: CustomQueryHandler,
  ): void;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

name

</td><td>

string

</td><td>

The name that the custom query handler will be registered under.

</td></tr>
<tr><td>

queryHandler

</td><td>

[CustomQueryHandler](./puppeteer.customqueryhandler.md)

</td><td>

The [custom query handler](./puppeteer.customqueryhandler.md) to register.

</td></tr>
</tbody></table>

**Returns:**

void

## Remarks

After registration, the handler can be used everywhere where a selector is expected by prepending the selection string with `<name>/`. The name is only allowed to consist of lower- and upper case latin letters.

## Example

```
import {Puppeteer}, puppeteer from 'puppeteer';

Puppeteer.registerCustomQueryHandler('text', { … });
const aHandle = await page.$('text/…');
```
