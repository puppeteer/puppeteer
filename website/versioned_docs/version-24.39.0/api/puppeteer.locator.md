---
sidebar_label: Locator
---

# Locator class

Locators describe a strategy of locating objects and performing an action on them. If the action fails because the object is not ready for the action, the whole operation is retried. Various preconditions for a successful action are checked automatically.

See [https://pptr.dev/guides/page-interactions\#locators](https://pptr.dev/guides/page-interactions#locators) for details.

### Signature

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

<span id="_">\_</span>

</td><td>

`optional`

</td><td>

T

</td><td>

Used for nominally typing [Locator](./puppeteer.locator.md).

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

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

<span id="click">[click(this, options)](./puppeteer.locator.click.md)</span>

</td><td>

</td><td>

Clicks the located element.

</td></tr>
<tr><td>

<span id="clone">[clone()](./puppeteer.locator.clone.md)</span>

</td><td>

</td><td>

Clones the locator.

</td></tr>
<tr><td>

<span id="fill">[fill(this, value, options)](./puppeteer.locator.fill.md)</span>

</td><td>

</td><td>

Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. `contenteditable`, select, textarea and input elements are supported.

</td></tr>
<tr><td>

<span id="filter">[filter(predicate)](./puppeteer.locator.filter.md)</span>

</td><td>

</td><td>

Creates an expectation that is evaluated against located values.

If the expectations do not match, then the locator will retry.

</td></tr>
<tr><td>

<span id="hover">[hover(this, options)](./puppeteer.locator.hover.md)</span>

</td><td>

</td><td>

Hovers over the located element.

</td></tr>
<tr><td>

<span id="map">[map(mapper)](./puppeteer.locator.map.md)</span>

</td><td>

</td><td>

Maps the locator using the provided mapper.

</td></tr>
<tr><td>

<span id="race">[race(locators)](./puppeteer.locator.race.md)</span>

</td><td>

`static`

</td><td>

Creates a race between multiple locators trying to locate elements in parallel but ensures that only a single element receives the action.

</td></tr>
<tr><td>

<span id="scroll">[scroll(this, options)](./puppeteer.locator.scroll.md)</span>

</td><td>

</td><td>

Scrolls the located element.

</td></tr>
<tr><td>

<span id="setensureelementisintheviewport">[setEnsureElementIsInTheViewport(this, value)](./puppeteer.locator.setensureelementisintheviewport.md)</span>

</td><td>

</td><td>

Creates a new locator instance by cloning the current locator and specifying whether the locator should scroll the element into viewport if it is not in the viewport already.

</td></tr>
<tr><td>

<span id="settimeout">[setTimeout(timeout)](./puppeteer.locator.settimeout.md)</span>

</td><td>

</td><td>

Creates a new locator instance by cloning the current locator and setting the total timeout for the locator actions.

Pass `0` to disable timeout.

</td></tr>
<tr><td>

<span id="setvisibility">[setVisibility(this, visibility)](./puppeteer.locator.setvisibility.md)</span>

</td><td>

</td><td>

Creates a new locator instance by cloning the current locator with the visibility property changed to the specified value.

</td></tr>
<tr><td>

<span id="setwaitforenabled">[setWaitForEnabled(this, value)](./puppeteer.locator.setwaitforenabled.md)</span>

</td><td>

</td><td>

Creates a new locator instance by cloning the current locator and specifying whether to wait for input elements to become enabled before the action. Applicable to `click` and `fill` actions.

</td></tr>
<tr><td>

<span id="setwaitforstableboundingbox">[setWaitForStableBoundingBox(this, value)](./puppeteer.locator.setwaitforstableboundingbox.md)</span>

</td><td>

</td><td>

Creates a new locator instance by cloning the current locator and specifying whether the locator has to wait for the element's bounding box to be same between two consecutive animation frames.

</td></tr>
<tr><td>

<span id="wait">[wait(options)](./puppeteer.locator.wait.md)</span>

</td><td>

</td><td>

Waits for the locator to get the serialized value from the page.

Note this requires the value to be JSON-serializable.

</td></tr>
<tr><td>

<span id="waithandle">[waitHandle(options)](./puppeteer.locator.waithandle.md)</span>

</td><td>

</td><td>

Waits for the locator to get a handle from the page.

</td></tr>
</tbody></table>
