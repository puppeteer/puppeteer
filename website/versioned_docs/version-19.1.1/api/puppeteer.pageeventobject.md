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

| Property                                                                        | Modifiers | Type                                                           | Description | Default |
| ------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- | ------- |
| [close](./puppeteer.pageeventobject.close.md)                                   |           | never                                                          |             |         |
| [console](./puppeteer.pageeventobject.console.md)                               |           | [ConsoleMessage](./puppeteer.consolemessage.md)                |             |         |
| [dialog](./puppeteer.pageeventobject.dialog.md)                                 |           | [Dialog](./puppeteer.dialog.md)                                |             |         |
| [domcontentloaded](./puppeteer.pageeventobject.domcontentloaded.md)             |           | never                                                          |             |         |
| [error](./puppeteer.pageeventobject.error.md)                                   |           | Error                                                          |             |         |
| [frameattached](./puppeteer.pageeventobject.frameattached.md)                   |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| [framedetached](./puppeteer.pageeventobject.framedetached.md)                   |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| [framenavigated](./puppeteer.pageeventobject.framenavigated.md)                 |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| [load](./puppeteer.pageeventobject.load.md)                                     |           | never                                                          |             |         |
| [metrics](./puppeteer.pageeventobject.metrics.md)                               |           | { title: string; metrics: [Metrics](./puppeteer.metrics.md); } |             |         |
| [pageerror](./puppeteer.pageeventobject.pageerror.md)                           |           | Error                                                          |             |         |
| [popup](./puppeteer.pageeventobject.popup.md)                                   |           | [Page](./puppeteer.page.md)                                    |             |         |
| [request](./puppeteer.pageeventobject.request.md)                               |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| [requestfailed](./puppeteer.pageeventobject.requestfailed.md)                   |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| [requestfinished](./puppeteer.pageeventobject.requestfinished.md)               |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| [requestservedfromcache](./puppeteer.pageeventobject.requestservedfromcache.md) |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| [response](./puppeteer.pageeventobject.response.md)                             |           | [HTTPResponse](./puppeteer.httpresponse.md)                    |             |         |
| [workercreated](./puppeteer.pageeventobject.workercreated.md)                   |           | [WebWorker](./puppeteer.webworker.md)                          |             |         |
| [workerdestroyed](./puppeteer.pageeventobject.workerdestroyed.md)               |           | [WebWorker](./puppeteer.webworker.md)                          |             |         |
