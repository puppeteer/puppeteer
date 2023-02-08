---
sidebar_label: JSHandle
---

# JSHandle class

Represents a reference to a JavaScript object. Instances can be created using [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md).

Handles prevent the referenced JavaScript object from being garbage-collected unless the handle is purposely [disposed](./puppeteer.jshandle.dispose.md). JSHandles are auto-disposed when their associated frame is navigated away or the parent context gets destroyed.

Handles can be used as arguments for any evaluation function such as [Page.$eval()](./puppeteer.page._eval.md), [Page.evaluate()](./puppeteer.page.evaluate.md), and [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md). They are resolved to their referenced object.

#### Signature:

```typescript
export declare class JSHandle<T = unknown>
```

## Example

```ts
const windowHandle = await page.evaluateHandle(() => window);
```

## Properties

| Property                                                              | Modifiers | Type | Description                                                                      |
| --------------------------------------------------------------------- | --------- | ---- | -------------------------------------------------------------------------------- |
| [\[\_\_JSHandleSymbol\]?](./puppeteer.jshandle.___jshandlesymbol_.md) |           | T    | <i>(Optional)</i> Used for nominally typing [JSHandle](./puppeteer.jshandle.md). |

## Methods

| Method                                                                       | Modifiers | Description                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [asElement()](./puppeteer.jshandle.aselement.md)                             |           |                                                                                                                                                                                                                                                                   |
| [dispose()](./puppeteer.jshandle.dispose.md)                                 |           | Releases the object referenced by the handle for garbage collection.                                                                                                                                                                                              |
| [evaluate(pageFunction, args)](./puppeteer.jshandle.evaluate.md)             |           | Evaluates the given function with the current handle as its first argument.                                                                                                                                                                                       |
| [evaluateHandle(pageFunction, args)](./puppeteer.jshandle.evaluatehandle.md) |           | Evaluates the given function with the current handle as its first argument.                                                                                                                                                                                       |
| [getProperties()](./puppeteer.jshandle.getproperties.md)                     |           | Gets a map of handles representing the properties of the current handle.                                                                                                                                                                                          |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty.md)             |           | Fetches a single property from the referenced object.                                                                                                                                                                                                             |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty_1.md)           |           |                                                                                                                                                                                                                                                                   |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty_2.md)           |           |                                                                                                                                                                                                                                                                   |
| [jsonValue()](./puppeteer.jshandle.jsonvalue.md)                             |           |                                                                                                                                                                                                                                                                   |
| [remoteObject()](./puppeteer.jshandle.remoteobject.md)                       |           | Provides access to the \[Protocol.Runtime.RemoteObject\](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/\#type-RemoteObject) OR \[Bidi.Script.RemoteReference\](https://w3c.github.io/webdriver-bidi/\#data-types-reference) backing this handle. |
| [toString()](./puppeteer.jshandle.tostring.md)                               |           | Returns a string representation of the JSHandle.                                                                                                                                                                                                                  |
