---
sidebar_label: BrowserContextEmittedEvents
---

# BrowserContextEmittedEvents enum

#### Signature:

```typescript
export declare const enum BrowserContextEmittedEvents
```

## Enumeration Members

| Member          | Value                                    | Description                                                                                                                                                                                                                                                                                                               |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TargetChanged   | <code>&quot;targetchanged&quot;</code>   | Emitted when the url of a target inside the browser context changes. Contains a [Target](./puppeteer.target.md) instance.                                                                                                                                                                                                 |
| TargetCreated   | <code>&quot;targetcreated&quot;</code>   | <p>Emitted when a target is created within the browser context, for example when a new page is opened by [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) or by [browserContext.newPage](./puppeteer.browsercontext.newpage.md)</p><p>Contains a [Target](./puppeteer.target.md) instance.</p> |
| TargetDestroyed | <code>&quot;targetdestroyed&quot;</code> | Emitted when a target is destroyed within the browser context, for example when a page is closed. Contains a [Target](./puppeteer.target.md) instance.                                                                                                                                                                    |
