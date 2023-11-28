---
sidebar_label: Connection.(constructor)
---

# Connection.(constructor)

Constructs a new instance of the `Connection` class

#### Signature:

```typescript
class Connection {
  constructor(
    url: string,
    transport: ConnectionTransport,
    delay?: number,
    timeout?: number
  );
}
```

## Parameters

| Parameter | Type                                                      | Description  |
| --------- | --------------------------------------------------------- | ------------ |
| url       | string                                                    |              |
| transport | [ConnectionTransport](./puppeteer.connectiontransport.md) |              |
| delay     | number                                                    | _(Optional)_ |
| timeout   | number                                                    | _(Optional)_ |
