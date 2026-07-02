---
sidebar_label: Realm
---

# Realm class

### Signature

```typescript
export declare abstract class Realm
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Realm` class.

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

<span id="origin">origin</span>

</td><td>

`readonly`

</td><td>

string \| undefined

</td><td>

**_(Experimental)_** Returns the origin that created the Realm. For example, if the realm was created by an extension content script, this will return the origin of the extension (e.g., `chrome-extension://<extension-id>`).

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

<span id="evaluate">[evaluate(pageFunction, args)](./puppeteer.realm.evaluate.md)</span>

</td><td>

</td><td>

Evaluates a function in the realm's context and returns the resulting value.

If the function passed to `realm.evaluate` returns a Promise, the method will wait for the promise to resolve and return its value.

[JSHandle](./puppeteer.jshandle.md) instances can be passed as arguments to the function.

</td></tr>
<tr><td>

<span id="evaluatehandle">[evaluateHandle(pageFunction, args)](./puppeteer.realm.evaluatehandle.md)</span>

</td><td>

</td><td>

Evaluates a function in the realm's context and returns a [JSHandle](./puppeteer.jshandle.md) to the result.

If the function passed to `realm.evaluateHandle` returns a Promise, the method will wait for the promise to resolve and return its value.

[JSHandle](./puppeteer.jshandle.md) instances can be passed as arguments to the function.

</td></tr>
<tr><td>

<span id="extension">[extension()](./puppeteer.realm.extension.md)</span>

</td><td>

</td><td>

**_(Experimental)_** Returns the [Extension](./puppeteer.extension.md) that created this realm, if applicable. This is typically populated when the realm was created by an extension content script injected into a page.

</td></tr>
<tr><td>

<span id="waitforfunction">[waitForFunction(pageFunction, options, args)](./puppeteer.realm.waitforfunction.md)</span>

</td><td>

</td><td>

Waits for a function to return a truthy value when evaluated in the realm's context.

Arguments can be passed from Node.js to `pageFunction`.

</td></tr>
</tbody></table>
