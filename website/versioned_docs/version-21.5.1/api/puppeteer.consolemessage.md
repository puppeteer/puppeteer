---
sidebar_label: ConsoleMessage
---

# ConsoleMessage class

ConsoleMessage objects are dispatched by page via the 'console' event.

#### Signature:

```typescript
export declare class ConsoleMessage
```

## Constructors

| Constructor                                                                                         | Modifiers | Description                                                        |
| --------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| [(constructor)(type, text, args, stackTraceLocations)](./puppeteer.consolemessage._constructor_.md) |           | Constructs a new instance of the <code>ConsoleMessage</code> class |

## Methods

| Method                                                   | Modifiers | Description                                                 |
| -------------------------------------------------------- | --------- | ----------------------------------------------------------- |
| [args()](./puppeteer.consolemessage.args.md)             |           | An array of arguments passed to the console.                |
| [location()](./puppeteer.consolemessage.location.md)     |           | The location of the console message.                        |
| [stackTrace()](./puppeteer.consolemessage.stacktrace.md) |           | The array of locations on the stack of the console message. |
| [text()](./puppeteer.consolemessage.text.md)             |           | The text of the console message.                            |
| [type()](./puppeteer.consolemessage.type.md)             |           | The type of the console message.                            |
