---
sidebar_label: ConsoleMessage
---

# ConsoleMessage class

ConsoleMessage objects are dispatched by page via the 'console' event.

### Signature

```typescript
export declare class ConsoleMessage
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ConsoleMessage` class.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="args">[args()](./puppeteer.consolemessage.args.md)</span>

</td><td>

</td><td>

An array of arguments passed to the console.

</td></tr>
<tr><td>

<span id="frame">[frame()](./puppeteer.consolemessage.frame.md)</span>

</td><td>

</td><td>

The [Frame](./puppeteer.frame.md) that initiated the console message, or `null` if the message originated from a worker.

</td></tr>
<tr><td>

<span id="location">[location()](./puppeteer.consolemessage.location.md)</span>

</td><td>

</td><td>

The location of the console message.

</td></tr>
<tr><td>

<span id="page">[page()](./puppeteer.consolemessage.page.md)</span>

</td><td>

</td><td>

The [Page](./puppeteer.page.md) that the console message originated from, or `null` if the message originated from a worker or outside of a frame context.

</td></tr>
<tr><td>

<span id="stacktrace">[stackTrace()](./puppeteer.consolemessage.stacktrace.md)</span>

</td><td>

</td><td>

The array of locations on the stack of the console message.

</td></tr>
<tr><td>

<span id="text">[text()](./puppeteer.consolemessage.text.md)</span>

</td><td>

</td><td>

The text of the console message.

</td></tr>
<tr><td>

<span id="type">[type()](./puppeteer.consolemessage.type.md)</span>

</td><td>

</td><td>

The type of the console message.

</td></tr>
<tr><td>

<span id="worker">[worker()](./puppeteer.consolemessage.worker.md)</span>

</td><td>

</td><td>

The [WebWorker](./puppeteer.webworker.md) that initiated the console message, or `null` if the message originated from a frame.

</td></tr>
</tbody></table>
