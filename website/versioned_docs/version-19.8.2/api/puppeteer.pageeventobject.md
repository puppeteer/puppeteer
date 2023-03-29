---
sidebar_label: PageEventObject
---

# PageEventObject interface

Denotes the objects received by callback functions for page events.

See [PageEmittedEvents](./puppeteer.pageemittedevents.md) for more detail on the events and when they are emitted.

#### Signature:

```typescript
export interface PageEventObject
```

## Properties

| Property               | Modifiers | Type                                                           | Description | Default |
| ---------------------- | --------- | -------------------------------------------------------------- | ----------- | ------- |
| close                  |           | never                                                          |             |         |
| console                |           | [ConsoleMessage](./puppeteer.consolemessage.md)                |             |         |
| dialog                 |           | [Dialog](./puppeteer.dialog.md)                                |             |         |
| domcontentloaded       |           | never                                                          |             |         |
| error                  |           | Error                                                          |             |         |
| frameattached          |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| framedetached          |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| framenavigated         |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| load                   |           | never                                                          |             |         |
| metrics                |           | { title: string; metrics: [Metrics](./puppeteer.metrics.md); } |             |         |
| pageerror              |           | Error                                                          |             |         |
| popup                  |           | [Page](./puppeteer.page.md)                                    |             |         |
| request                |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| requestfailed          |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| requestfinished        |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| requestservedfromcache |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| response               |           | [HTTPResponse](./puppeteer.httpresponse.md)                    |             |         |
| workercreated          |           | [WebWorker](./puppeteer.webworker.md)                          |             |         |
| workerdestroyed        |           | [WebWorker](./puppeteer.webworker.md)                          |             |         |
