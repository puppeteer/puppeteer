---
sidebar_label: JSHandle
---

# JSHandle class

Represents an in-page JavaScript object. JSHandles can be created with the [page.evaluateHandle](./puppeteer.page.evaluatehandle.md) method.

**Signature:**

```typescript
export declare class JSHandle<T = unknown>
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `JSHandle` class.

## Example

```ts
const windowHandle = await page.evaluateHandle(() => window);
```

JSHandle prevents the referenced JavaScript object from being garbage-collected unless the handle is [disposed](./puppeteer.jshandle.dispose.md). JSHandles are auto- disposed when their origin frame gets navigated or the parent context gets destroyed.

JSHandle instances can be used as arguments for [Page.$eval()](./puppeteer.page._eval.md), [Page.evaluate()](./puppeteer.page.evaluate.md), and [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md).

## Properties

| Property                                                              | Modifiers | Type | Description                                                                      |
| --------------------------------------------------------------------- | --------- | ---- | -------------------------------------------------------------------------------- |
| [\[\_\_JSHandleSymbol\]?](./puppeteer.jshandle.___jshandlesymbol_.md) |           | T    | <i>(Optional)</i> Used for nominally typing [JSHandle](./puppeteer.jshandle.md). |

## Methods

| Method                                                                       | Modifiers | Description                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [asElement()](./puppeteer.jshandle.aselement.md)                             |           |                                                                                                                                                                                                                                  |
| [dispose()](./puppeteer.jshandle.dispose.md)                                 |           | Stops referencing the element handle, and resolves when the object handle is successfully disposed of.                                                                                                                           |
| [evaluate(pageFunction, args)](./puppeteer.jshandle.evaluate.md)             |           | This method passes this handle as the first argument to <code>pageFunction</code>. If <code>pageFunction</code> returns a Promise, then <code>handle.evaluate</code> would wait for the promise to resolve and return its value. |
| [evaluateHandle(pageFunction, args)](./puppeteer.jshandle.evaluatehandle.md) |           | This method passes this handle as the first argument to <code>pageFunction</code>.                                                                                                                                               |
| [executionContext()](./puppeteer.jshandle.executioncontext.md)               |           | Returns the execution context the handle belongs to.                                                                                                                                                                             |
| [getProperties()](./puppeteer.jshandle.getproperties.md)                     |           | The method returns a map with property names as keys and JSHandle instances for the property values.                                                                                                                             |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty.md)             |           | Fetches a single property from the referenced object.                                                                                                                                                                            |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty_1.md)           |           |                                                                                                                                                                                                                                  |
| [jsonValue()](./puppeteer.jshandle.jsonvalue.md)                             |           |                                                                                                                                                                                                                                  |
| [remoteObject()](./puppeteer.jshandle.remoteobject.md)                       |           | Provides access to \[Protocol.Runtime.RemoteObject\](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/\#type-RemoteObject) backing this JSHandle.                                                                  |
| [toString()](./puppeteer.jshandle.tostring.md)                               |           | Returns a string representation of the JSHandle.                                                                                                                                                                                 |
