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

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

\_

</td><td>

`optional`

</td><td>

T

</td><td>

Used for nominally typing [Locator](./puppeteer.locator.md).

</td></tr>
<tr><td>

timeout

</td><td>

`readonly`

</td><td>

number

</td><td>

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[click(this, options)](./puppeteer.locator.click.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[clone()](./puppeteer.locator.clone.md)

</td><td>

</td><td>

Clones the locator.

</td></tr>
<tr><td>

[fill(this, value, options)](./puppeteer.locator.fill.md)

</td><td>

</td><td>

Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. contenteditable, selector, inputs are supported.

</td></tr>
<tr><td>

[filter(predicate)](./puppeteer.locator.filter.md)

</td><td>

</td><td>

Creates an expectation that is evaluated against located values.

If the expectations do not match, then the locator will retry.

</td></tr>
<tr><td>

[hover(this, options)](./puppeteer.locator.hover.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[map(mapper)](./puppeteer.locator.map.md)

</td><td>

</td><td>

Maps the locator using the provided mapper.

</td></tr>
<tr><td>

[race(locators)](./puppeteer.locator.race.md)

</td><td>

`static`

</td><td>

Creates a race between multiple locators but ensures that only a single one acts.

</td></tr>
<tr><td>

[scroll(this, options)](./puppeteer.locator.scroll.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setEnsureElementIsInTheViewport(this, value)](./puppeteer.locator.setensureelementisintheviewport.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setTimeout(timeout)](./puppeteer.locator.settimeout.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setVisibility(this, visibility)](./puppeteer.locator.setvisibility.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setWaitForEnabled(this, value)](./puppeteer.locator.setwaitforenabled.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[setWaitForStableBoundingBox(this, value)](./puppeteer.locator.setwaitforstableboundingbox.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[wait(options)](./puppeteer.locator.wait.md)

</td><td>

</td><td>

Waits for the locator to get the serialized value from the page.

Note this requires the value to be JSON-serializable.

</td></tr>
<tr><td>

[waitHandle(options)](./puppeteer.locator.waithandle.md)

</td><td>

</td><td>

Waits for the locator to get a handle from the page.

</td></tr>
</tbody></table>
