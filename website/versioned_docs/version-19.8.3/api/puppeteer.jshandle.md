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

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `JSHandle` class.

## Example

```ts
const windowHandle = await page.evaluateHandle(() => window);
```

## Properties

| Property               | Modifiers             | Type | Description                                                    |
| ---------------------- | --------------------- | ---- | -------------------------------------------------------------- |
| \[\_\_JSHandleSymbol\] | <code>optional</code> | T    | Used for nominally typing [JSHandle](./puppeteer.jshandle.md). |

## Methods

| Method                                                                       | Modifiers | Description                                                                                                                                                       |
| ---------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [asElement()](./puppeteer.jshandle.aselement.md)                             |           | Either <code>null</code> or the handle itself if the handle is an instance of [ElementHandle](./puppeteer.elementhandle.md).                                      |
| [dispose()](./puppeteer.jshandle.dispose.md)                                 |           | Releases the object referenced by the handle for garbage collection.                                                                                              |
| [evaluate(pageFunction, args)](./puppeteer.jshandle.evaluate.md)             |           | Evaluates the given function with the current handle as its first argument.                                                                                       |
| [evaluateHandle(pageFunction, args)](./puppeteer.jshandle.evaluatehandle.md) |           | Evaluates the given function with the current handle as its first argument.                                                                                       |
| [getProperties()](./puppeteer.jshandle.getproperties.md)                     |           | Gets a map of handles representing the properties of the current handle.                                                                                          |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty.md)             |           | Fetches a single property from the referenced object.                                                                                                             |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty_1.md)           |           |                                                                                                                                                                   |
| [getProperty(propertyName)](./puppeteer.jshandle.getproperty_2.md)           |           |                                                                                                                                                                   |
| [jsonValue()](./puppeteer.jshandle.jsonvalue.md)                             |           | A vanilla object representing the serializable portions of the referenced object.                                                                                 |
| [remoteObject()](./puppeteer.jshandle.remoteobject.md)                       |           | Provides access to the \[Protocol.Runtime.RemoteObject\](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/\#type-RemoteObject) backing this handle. |
| [toString()](./puppeteer.jshandle.tostring.md)                               |           | Returns a string representation of the JSHandle.                                                                                                                  |
