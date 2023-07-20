---
sidebar_label: WebWorker
---

# WebWorker class

This class represents a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

#### Signature:

```typescript
export declare class WebWorker extends EventEmitter
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)

## Remarks

The events `workercreated` and `workerdestroyed` are emitted on the page object to signal the worker lifecycle.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `WebWorker` class.

## Example

```ts
page.on('workercreated', worker =>
  console.log('Worker created: ' + worker.url())
);
page.on('workerdestroyed', worker =>
  console.log('Worker destroyed: ' + worker.url())
);

console.log('Current workers:');
for (const worker of page.workers()) {
  console.log('  ' + worker.url());
}
```

## Properties

| Property | Modifiers             | Type                                    | Description                                      |
| -------- | --------------------- | --------------------------------------- | ------------------------------------------------ |
| client   | <code>readonly</code> | [CDPSession](./puppeteer.cdpsession.md) | The CDP session client the WebWorker belongs to. |

## Methods

| Method                                                                        | Modifiers | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [evaluate(pageFunction, args)](./puppeteer.webworker.evaluate.md)             |           | If the function passed to the <code>worker.evaluate</code> returns a Promise, then <code>worker.evaluate</code> would wait for the promise to resolve and return its value. If the function passed to the <code>worker.evaluate</code> returns a non-serializable value, then <code>worker.evaluate</code> resolves to <code>undefined</code>. DevTools Protocol also supports transferring some additional values that are not serializable by <code>JSON</code>: <code>-0</code>, <code>NaN</code>, <code>Infinity</code>, <code>-Infinity</code>, and bigint literals. Shortcut for <code>await worker.executionContext()).evaluate(pageFunction, ...args)</code>. |
| [evaluateHandle(pageFunction, args)](./puppeteer.webworker.evaluatehandle.md) |           | The only difference between <code>worker.evaluate</code> and <code>worker.evaluateHandle</code> is that <code>worker.evaluateHandle</code> returns in-page object (JSHandle). If the function passed to the <code>worker.evaluateHandle</code> returns a <code>Promise</code>, then <code>worker.evaluateHandle</code> would wait for the promise to resolve and return its value. Shortcut for <code>await worker.executionContext()).evaluateHandle(pageFunction, ...args)</code>                                                                                                                                                                                   |
| [url()](./puppeteer.webworker.url.md)                                         |           | The URL of this web worker.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
