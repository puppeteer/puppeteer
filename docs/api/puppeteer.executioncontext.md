---
sidebar_label: ExecutionContext
---

# ExecutionContext class

Represents a context for JavaScript execution.

**Signature:**

```typescript
export declare class ExecutionContext
```

## Remarks

Besides pages, execution contexts can be found in [workers](./puppeteer.webworker.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ExecutionContext` class.

## Example

A [Page](./puppeteer.page.md) can have several execution contexts:

- Each [Frame](./puppeteer.frame.md) of a [page](./puppeteer.page.md) has a "default" execution context that is always created after frame is attached to DOM. This context is returned by the [Frame.executionContext()](./puppeteer.frame.executioncontext.md) method. - Each [Chrome extensions](https://developer.chrome.com/extensions) creates additional execution contexts to isolate their code.

## Methods

| Method                                                                               | Modifiers | Description                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [evaluate(pageFunction, args)](./puppeteer.executioncontext.evaluate.md)             |           | Evaluates the given function.                                                                                                                                                                                                                                                                            |
| [evaluateHandle(pageFunction, args)](./puppeteer.executioncontext.evaluatehandle.md) |           | <p>Evaluates the given function.</p><p>Unlike [evaluate](./puppeteer.executioncontext.evaluate.md), this method returns a handle to the result of the function.</p><p>This method may be better suited if the object cannot be serialized (e.g. <code>Map</code>) and requires further manipulation.</p> |
| [frame()](./puppeteer.executioncontext.frame.md)                                     |           |                                                                                                                                                                                                                                                                                                          |
| [queryObjects(prototypeHandle)](./puppeteer.executioncontext.queryobjects.md)        |           | Iterates through the JavaScript heap and finds all the objects with the given prototype.                                                                                                                                                                                                                 |
