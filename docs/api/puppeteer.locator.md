---
sidebar_label: Locator
---

# Locator class

Locators describe a strategy of locating elements and performing an action on them. If the action fails because the element is not ready for the action, the whole operation is retried. Various preconditions for a successful action are checked automatically.

#### Signature:

```typescript
export declare abstract class Locator<T> extends EventEmitter
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)

## Properties

| Property | Modifiers             | Type | Description                                                  |
| -------- | --------------------- | ---- | ------------------------------------------------------------ |
| \_       | <code>optional</code> | T    | Used for nominally typing [Locator](./puppeteer.locator.md). |

## Methods

| Method                                                                                                 | Modifiers           | Description                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [click(this, options)](./puppeteer.locator.click.md)                                                   |                     |                                                                                                                                                                                                                                          |
| [fill(this, value, options)](./puppeteer.locator.fill.md)                                              |                     | Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. contenteditable, selector, inputs are supported. |
| [hover(this, options)](./puppeteer.locator.hover.md)                                                   |                     |                                                                                                                                                                                                                                          |
| [map(mapper)](./puppeteer.locator.map.md)                                                              |                     | Maps the locator using the provided mapper.                                                                                                                                                                                              |
| [off(eventName, handler)](./puppeteer.locator.off.md)                                                  |                     |                                                                                                                                                                                                                                          |
| [on(eventName, handler)](./puppeteer.locator.on.md)                                                    |                     |                                                                                                                                                                                                                                          |
| [once(eventName, handler)](./puppeteer.locator.once.md)                                                |                     |                                                                                                                                                                                                                                          |
| [race(locators)](./puppeteer.locator.race.md)                                                          | <code>static</code> | Creates a race between multiple locators but ensures that only a single one acts.                                                                                                                                                        |
| [scroll(this, options)](./puppeteer.locator.scroll.md)                                                 |                     |                                                                                                                                                                                                                                          |
| [setEnsureElementIsInTheViewport(this, value)](./puppeteer.locator.setensureelementisintheviewport.md) |                     |                                                                                                                                                                                                                                          |
| [setTimeout(timeout)](./puppeteer.locator.settimeout.md)                                               |                     |                                                                                                                                                                                                                                          |
| [setVisibility(this, visibility)](./puppeteer.locator.setvisibility.md)                                |                     |                                                                                                                                                                                                                                          |
| [setWaitForEnabled(this, value)](./puppeteer.locator.setwaitforenabled.md)                             |                     |                                                                                                                                                                                                                                          |
| [setWaitForStableBoundingBox(this, value)](./puppeteer.locator.setwaitforstableboundingbox.md)         |                     |                                                                                                                                                                                                                                          |
| [wait(options)](./puppeteer.locator.wait.md)                                                           |                     | <p>Waits for the locator to get the serialized value from the page.</p><p>Note this requires the value to be JSON-serializable.</p>                                                                                                      |
