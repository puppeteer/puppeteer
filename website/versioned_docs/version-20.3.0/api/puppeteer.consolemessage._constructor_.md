---
sidebar_label: ConsoleMessage.(constructor)
---

# ConsoleMessage.(constructor)

Constructs a new instance of the `ConsoleMessage` class

#### Signature:

```typescript
class ConsoleMessage {
  constructor(
    type: ConsoleMessageType,
    text: string,
    args: JSHandle[],
    stackTraceLocations: ConsoleMessageLocation[]
  );
}
```

## Parameters

| Parameter           | Type                                                                | Description |
| ------------------- | ------------------------------------------------------------------- | ----------- |
| type                | [ConsoleMessageType](./puppeteer.consolemessagetype.md)             |             |
| text                | string                                                              |             |
| args                | [JSHandle](./puppeteer.jshandle.md)\[\]                             |             |
| stackTraceLocations | [ConsoleMessageLocation](./puppeteer.consolemessagelocation.md)\[\] |             |
