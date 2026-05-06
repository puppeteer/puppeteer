---
sidebar_label: JSHandle
---

# JSHandle class

Represents a reference to a JavaScript object. Instances can be created using [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md).

Handles prevent the referenced JavaScript object from being garbage-collected unless the handle is purposely [disposed](./puppeteer.jshandle.dispose.md). JSHandles are auto-disposed when their associated frame is navigated away or the parent context gets destroyed.

Handles can be used as arguments for any evaluation function such as [Page.$eval()](./puppeteer.page._eval.md), [Page.evaluate()](./puppeteer.page.evaluate.md), and [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md). They are resolved to their referenced object.

### Signature

```typescript
export declare abstract class JSHandle<T = unknown>
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `JSHandle` class.

## Example

```ts
const windowHandle = await page.evaluateHandle(() => window);
```

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

Used for nominally typing [JSHandle](./puppeteer.jshandle.md).

</td></tr>
<tr><td>

<span id="move">move</span>

</td><td>

</td><td>

() =&gt; this

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

<span id="aselement">[asElement()](./puppeteer.jshandle.aselement.md)</span>

</td><td>

</td><td>

Either `null` or the handle itself if the handle is an instance of [ElementHandle](./puppeteer.elementhandle.md).

</td></tr>
<tr><td>

<span id="dispose">[dispose()](./puppeteer.jshandle.dispose.md)</span>

</td><td>

</td><td>

Releases the object referenced by the handle for garbage collection.

</td></tr>
<tr><td>

<span id="evaluate">[evaluate(pageFunction, args)](./puppeteer.jshandle.evaluate.md)</span>

</td><td>

</td><td>

Evaluates the given function with the current handle as its first argument.

</td></tr>
<tr><td>

<span id="evaluatehandle">[evaluateHandle(pageFunction, args)](./puppeteer.jshandle.evaluatehandle.md)</span>

</td><td>

</td><td>

Evaluates the given function with the current handle as its first argument.

</td></tr>
<tr><td>

<span id="getproperties">[getProperties()](./puppeteer.jshandle.getproperties.md)</span>

</td><td>

</td><td>

Gets a map of handles representing the properties of the current handle.

</td></tr>
<tr><td>

<span id="getproperty">[getProperty(propertyName)](./puppeteer.jshandle.getproperty.md)</span>

</td><td>

</td><td>

Fetches a single property from the referenced object.

</td></tr>
<tr><td>

<span id="getproperty">[getProperty(propertyName)](./puppeteer.jshandle.getproperty.md#overload-2)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="jsonvalue">[jsonValue()](./puppeteer.jshandle.jsonvalue.md)</span>

</td><td>

</td><td>

A vanilla object representing the serializable portions of the referenced object.

**Remarks:**

If the object has a `toJSON` function, it **will not** be called.

</td></tr>
<tr><td>

<span id="remoteobject">[remoteObject()](./puppeteer.jshandle.remoteobject.md)</span>

</td><td>

</td><td>

Provides access to the [Protocol.Runtime.RemoteObject](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#type-RemoteObject) backing this handle.

</td></tr>
<tr><td>

<span id="tostring">[toString()](./puppeteer.jshandle.tostring.md)</span>

</td><td>

</td><td>

Returns a string representation of the JSHandle.

**Remarks:**

Useful during debugging.

</td></tr>
</tbody></table>
