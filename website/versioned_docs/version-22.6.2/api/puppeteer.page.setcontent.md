---
sidebar_label: Page.setContent
---

# Page.setContent() method

Set the content of the page.

#### Signature:

```typescript
class Page {
  setContent(html: string, options?: WaitForOptions): Promise<void>;
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

html

</td><td>

string

</td><td>

HTML markup to assign to the page.

</td></tr>
<tr><td>

options

</td><td>

[WaitForOptions](./puppeteer.waitforoptions.md)

</td><td>

_(Optional)_ Parameters that has some properties.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

The parameter `options` might have the following options.

- `timeout` : Maximum time in milliseconds for resources to load, defaults to 30 seconds, pass `0` to disable timeout. The default value can be changed by using the [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) or [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) methods.

- `waitUntil`: When to consider setting markup succeeded, defaults to `load`. Given an array of event strings, setting content is considered to be successful after all events have been fired. Events can be either:<br/> - `load` : consider setting content to be finished when the `load` event is fired.<br/> - `domcontentloaded` : consider setting content to be finished when the `DOMContentLoaded` event is fired.<br/> - `networkidle0` : consider setting content to be finished when there are no more than 0 network connections for at least `500` ms.<br/> - `networkidle2` : consider setting content to be finished when there are no more than 2 network connections for at least `500` ms.
