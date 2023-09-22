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

| Member          | Value                                    | Description                                                                                                                                                                                                                                                                      |
| --------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disconnected    | <code>&quot;disconnected&quot;</code>    | <p>Emitted when Puppeteer gets disconnected from the browser instance. This might happen because either:</p><p>- The browser closes/crashes or - [Browser.disconnect()](./puppeteer.browser.disconnect.md) was called.</p>                                                       |
| TargetChanged   | <code>&quot;targetchanged&quot;</code>   | Emitted when the URL of a target changes. Contains a [Target](./puppeteer.target.md) instance.                                                                                                                                                                                   |
| TargetCreated   | <code>&quot;targetcreated&quot;</code>   | <p>Emitted when a target is created, for example when a new page is opened by [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) or by [browser.newPage](./puppeteer.browser.newpage.md)</p><p>Contains a [Target](./puppeteer.target.md) instance.</p> |
| TargetDestroyed | <code>&quot;targetdestroyed&quot;</code> | Emitted when a target is destroyed, for example when a page is closed. Contains a [Target](./puppeteer.target.md) instance.                                                                                                                                                      |
