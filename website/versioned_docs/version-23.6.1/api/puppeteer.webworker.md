---
sidebar_label: WebWorker
---

# WebWorker class

This class represents a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

### Signature

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
  console.log('Worker created: ' + worker.url()),
);
page.on('workerdestroyed', worker =>
  console.log('Worker destroyed: ' + worker.url()),
);

console.log('Current workers:');
for (const worker of page.workers()) {
  console.log('  ' + worker.url());
}
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

<span id="client">client</span>

</td><td>

`readonly`

</td><td>

[CDPSession](./puppeteer.cdpsession.md)

</td><td>

The CDP session client the WebWorker belongs to.

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

<span id="close">[close()](./puppeteer.webworker.close.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="evaluate">[evaluate(func, args)](./puppeteer.webworker.evaluate.md)</span>

</td><td>

</td><td>

Evaluates a given function in the [worker](./puppeteer.webworker.md).

**Remarks:**

If the given function returns a promise, [evaluate](./puppeteer.webworker.evaluate.md) will wait for the promise to resolve.

As a rule of thumb, if the return value of the given function is more complicated than a JSON object (e.g. most classes), then [evaluate](./puppeteer.webworker.evaluate.md) will \_likely\_ return some truncated value (or `{}`). This is because we are not returning the actual return value, but a deserialized version as a result of transferring the return value through a protocol to Puppeteer.

In general, you should use [evaluateHandle](./puppeteer.webworker.evaluatehandle.md) if [evaluate](./puppeteer.webworker.evaluate.md) cannot serialize the return value properly or you need a mutable [handle](./puppeteer.jshandle.md) to the return object.

</td></tr>
<tr><td>

<span id="evaluatehandle">[evaluateHandle(func, args)](./puppeteer.webworker.evaluatehandle.md)</span>

</td><td>

</td><td>

Evaluates a given function in the [worker](./puppeteer.webworker.md).

**Remarks:**

If the given function returns a promise, [evaluate](./puppeteer.webworker.evaluate.md) will wait for the promise to resolve.

In general, you should use [evaluateHandle](./puppeteer.webworker.evaluatehandle.md) if [evaluate](./puppeteer.webworker.evaluate.md) cannot serialize the return value properly or you need a mutable [handle](./puppeteer.jshandle.md) to the return object.

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.webworker.url.md)</span>

</td><td>

</td><td>

The URL of this web worker.

</td></tr>
</tbody></table>
