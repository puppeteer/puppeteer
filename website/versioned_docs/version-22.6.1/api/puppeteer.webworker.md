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

client

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

[close()](./puppeteer.webworker.close.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[evaluate(func, args)](./puppeteer.webworker.evaluate.md)

</td><td>

</td><td>

Evaluates a given function in the [worker](./puppeteer.webworker.md).

</td></tr>
<tr><td>

[evaluateHandle(func, args)](./puppeteer.webworker.evaluatehandle.md)

</td><td>

</td><td>

Evaluates a given function in the [worker](./puppeteer.webworker.md).

</td></tr>
<tr><td>

[url()](./puppeteer.webworker.url.md)

</td><td>

</td><td>

The URL of this web worker.

</td></tr>
</tbody></table>
