---
sidebar_label: Locator
---

# Locator class

Locators describe a strategy of locating objects and performing an action on them. If the action fails because the object is not ready for the action, the whole operation is retried. Various preconditions for a successful action are checked automatically.

#### Signature:

```typescript
export declare abstract class Locator<T> extends EventEmitter<LocatorEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[LocatorEvents](./puppeteer.locatorevents.md)&gt;

## Properties

| Property | Modifiers             | Type   | Description                                                  |
| -------- | --------------------- | ------ | ------------------------------------------------------------ |
| \_       | <code>optional</code> | T      | Used for nominally typing [Locator](./puppeteer.locator.md). |
| timeout  | <code>readonly</code> | number |                                                              |

## Methods

| Method                                                                                                 | Modifiers           | Description                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [click(this, options)](./puppeteer.locator.click.md)                                                   |                     |                                                                                                                                                                                                                                          |
| [clone()](./puppeteer.locator.clone.md)                                                                |                     | Clones the locator.                                                                                                                                                                                                                      |
| [fill(this, value, options)](./puppeteer.locator.fill.md)                                              |                     | Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. contenteditable, selector, inputs are supported. |
| [filter(predicate)](./puppeteer.locator.filter.md)                                                     |                     | <p>Creates an expectation that is evaluated against located values.</p><p>If the expectations do not match, then the locator will retry.</p>                                                                                             |
| [hover(this, options)](./puppeteer.locator.hover.md)                                                   |                     |                                                                                                                                                                                                                                          |
| [map(mapper)](./puppeteer.locator.map.md)                                                              |                     | Maps the locator using the provided mapper.                                                                                                                                                                                              |
| [race(locators)](./puppeteer.locator.race.md)                                                          | <code>static</code> | Creates a race between multiple locators but ensures that only a single one acts.                                                                                                                                                        |
| [scroll(this, options)](./puppeteer.locator.scroll.md)                                                 |                     |                                                                                                                                                                                                                                          |
| [setEnsureElementIsInTheViewport(this, value)](./puppeteer.locator.setensureelementisintheviewport.md) |                     |                                                                                                                                                                                                                                          |
| [setTimeout(timeout)](./puppeteer.locator.settimeout.md)                                               |                     |                                                                                                                                                                                                                                          |
| [setVisibility(this, visibility)](./puppeteer.locator.setvisibility.md)                                |                     |                                                                                                                                                                                                                                          |
| [setWaitForEnabled(this, value)](./puppeteer.locator.setwaitforenabled.md)                             |                     |                                                                                                                                                                                                                                          |
| [setWaitForStableBoundingBox(this, value)](./puppeteer.locator.setwaitforstableboundingbox.md)         |                     |                                                                                                                                                                                                                                          |
| [wait(options)](./puppeteer.locator.wait.md)                                                           |                     | <p>Waits for the locator to get the serialized value from the page.</p><p>Note this requires the value to be JSON-serializable.</p>                                                                                                      |
| [waitHandle(options)](./puppeteer.locator.waithandle.md)                                               |                     | Waits for the locator to get a handle from the page.                                                                                                                                                                                     |
