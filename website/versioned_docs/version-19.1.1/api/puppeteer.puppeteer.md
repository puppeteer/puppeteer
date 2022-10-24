---
sidebar_label: Puppeteer
---

# Puppeteer class

The main Puppeteer class.

IMPORTANT: if you are using Puppeteer in a Node environment, you will get an instance of [PuppeteerNode](./puppeteer.puppeteernode.md) when you import or require `puppeteer`. That class extends `Puppeteer`, so has all the methods documented below as well as all that are defined on [PuppeteerNode](./puppeteer.puppeteernode.md).

#### Signature:

```typescript
export declare class Puppeteer
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Puppeteer` class.

## Methods

| Method                                                                                                | Modifiers           | Description                                                            |
| ----------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| [clearCustomQueryHandlers()](./puppeteer.puppeteer.clearcustomqueryhandlers.md)                       | <code>static</code> | Unregisters all custom query handlers.                                 |
| [connect(options)](./puppeteer.puppeteer.connect.md)                                                  |                     | This method attaches Puppeteer to an existing browser instance.        |
| [customQueryHandlerNames()](./puppeteer.puppeteer.customqueryhandlernames.md)                         | <code>static</code> | Gets the names of all custom query handlers.                           |
| [registerCustomQueryHandler(name, queryHandler)](./puppeteer.puppeteer.registercustomqueryhandler.md) | <code>static</code> | Registers a [custom query handler](./puppeteer.customqueryhandler.md). |
| [unregisterCustomQueryHandler(name)](./puppeteer.puppeteer.unregistercustomqueryhandler.md)           | <code>static</code> | Unregisters a custom query handler for a given name.                   |
