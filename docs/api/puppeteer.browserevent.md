---
sidebar_label: BrowserEvent
---

# BrowserEvent enum

All the events a [browser instance](./puppeteer.browser.md) may emit.

#### Signature:

```typescript
export declare const enum BrowserEvent
```

## Enumeration Members

<table><thead><tr><th>

Member

</th><th>

Value

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

Disconnected

</td><td>

`"disconnected"`

</td><td>

Emitted when Puppeteer gets disconnected from the browser instance. This might happen because either:

- The browser closes/crashes or - [Browser.disconnect()](./puppeteer.browser.disconnect.md) was called.

</td></tr>
<tr><td>

TargetChanged

</td><td>

`"targetchanged"`

</td><td>

Emitted when the URL of a target changes. Contains a [Target](./puppeteer.target.md) instance.

**Remarks:**

Note that this includes target changes in all browser contexts.

</td></tr>
<tr><td>

TargetCreated

</td><td>

`"targetcreated"`

</td><td>

Emitted when a target is created, for example when a new page is opened by [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) or by [browser.newPage](./puppeteer.browser.newpage.md)

Contains a [Target](./puppeteer.target.md) instance.

**Remarks:**

Note that this includes target creations in all browser contexts.

</td></tr>
<tr><td>

TargetDestroyed

</td><td>

`"targetdestroyed"`

</td><td>

Emitted when a target is destroyed, for example when a page is closed. Contains a [Target](./puppeteer.target.md) instance.

**Remarks:**

Note that this includes target destructions in all browser contexts.

</td></tr>
</tbody></table>
