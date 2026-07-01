---
sidebar_label: ExceptionMessage
---

# ExceptionMessage class

ExceptionMessage objects are dispatched by page via the 'exception' event.

### Signature

```typescript
export declare class ExceptionMessage
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ExceptionMessage` class.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="exception">[exception()](./puppeteer.exceptionmessage.exception.md)</span>

</td><td>

</td><td>

The exception object as a JSHandle.

</td></tr>
<tr><td>

<span id="exceptionid">[exceptionId()](./puppeteer.exceptionmessage.exceptionid.md)</span>

</td><td>

</td><td>

The exception ID.

</td></tr>
<tr><td>

<span id="location">[location()](./puppeteer.exceptionmessage.location.md)</span>

</td><td>

</td><td>

The location of the exception message.

</td></tr>
<tr><td>

<span id="stacktrace">[stackTrace()](./puppeteer.exceptionmessage.stacktrace.md)</span>

</td><td>

</td><td>

The array of locations on the stack of the exception message.

</td></tr>
<tr><td>

<span id="text">[text()](./puppeteer.exceptionmessage.text.md)</span>

</td><td>

</td><td>

The text of the exception message.

</td></tr>
</tbody></table>
