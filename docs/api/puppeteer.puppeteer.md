---
sidebar_label: Puppeteer
---

# Puppeteer class

The main Puppeteer class.

IMPORTANT: if you are using Puppeteer in a Node environment, you will get an instance of [PuppeteerNode](./puppeteer.puppeteernode.md) when you import or require `puppeteer`. That class extends `Puppeteer`, so has all the methods documented below as well as all that are defined on [PuppeteerNode](./puppeteer.puppeteernode.md).

**Signature:**

```typescript
export declare class Puppeteer
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Puppeteer` class.

## Properties

| Property                                                        | Modifiers             | Type                                                         | Description |
| --------------------------------------------------------------- | --------------------- | ------------------------------------------------------------ | ----------- |
| [devices](./puppeteer.puppeteer.devices.md)                     | <code>readonly</code> | typeof [devices](./puppeteer.devices.md)                     |             |
| [errors](./puppeteer.puppeteer.errors.md)                       | <code>readonly</code> | typeof [errors](./puppeteer.errors.md)                       |             |
| [networkConditions](./puppeteer.puppeteer.networkconditions.md) | <code>readonly</code> | typeof [networkConditions](./puppeteer.networkconditions.md) |             |

## Methods

| Method                                                                                                | Modifiers | Description                                                     |
| ----------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------- |
| [clearCustomQueryHandlers()](./puppeteer.puppeteer.clearcustomqueryhandlers.md)                       |           |                                                                 |
| [connect(options)](./puppeteer.puppeteer.connect.md)                                                  |           | This method attaches Puppeteer to an existing browser instance. |
| [customQueryHandlerNames()](./puppeteer.puppeteer.customqueryhandlernames.md)                         |           |                                                                 |
| [registerCustomQueryHandler(name, queryHandler)](./puppeteer.puppeteer.registercustomqueryhandler.md) |           |                                                                 |
| [unregisterCustomQueryHandler(name)](./puppeteer.puppeteer.unregistercustomqueryhandler.md)           |           |                                                                 |
