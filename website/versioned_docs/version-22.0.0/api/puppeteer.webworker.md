---
sidebar_label: WebWorker
---

# WebWorker class

This class represents a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

#### Signature:

```typescript
export declare abstract class WebWorker extends EventEmitter<Record<EventType, unknown>>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;Record&lt;[EventType](./puppeteer.eventtype.md), unknown&gt;&gt;

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

| Method                                                                | Modifiers | Description                                                           |
| --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| [evaluate(func, args)](./puppeteer.webworker.evaluate.md)             |           | Evaluates a given function in the [worker](./puppeteer.webworker.md). |
| [evaluateHandle(func, args)](./puppeteer.webworker.evaluatehandle.md) |           | Evaluates a given function in the [worker](./puppeteer.webworker.md). |
| [url()](./puppeteer.webworker.url.md)                                 |           | The URL of this web worker.                                           |
