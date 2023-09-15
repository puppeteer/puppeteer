---
sidebar_label: PageEvents
---

# PageEvents interface

Denotes the objects received by callback functions for page events.

See [PageEvent](./puppeteer.pageevent.md) for more detail on the events and when they are emitted.

#### Signature:

```typescript
export interface PageEvents extends Record<EventType, unknown>
```

**Extends:** Record&lt;EventType, unknown&gt;

## Properties

| Property               | Modifiers | Type                                                           | Description | Default |
| ---------------------- | --------- | -------------------------------------------------------------- | ----------- | ------- |
| close                  |           | undefined                                                      |             |         |
| console                |           | [ConsoleMessage](./puppeteer.consolemessage.md)                |             |         |
| dialog                 |           | [Dialog](./puppeteer.dialog.md)                                |             |         |
| domcontentloaded       |           | undefined                                                      |             |         |
| error                  |           | Error                                                          |             |         |
| frameattached          |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| framedetached          |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| framenavigated         |           | [Frame](./puppeteer.frame.md)                                  |             |         |
| load                   |           | undefined                                                      |             |         |
| metrics                |           | { title: string; metrics: [Metrics](./puppeteer.metrics.md); } |             |         |
| pageerror              |           | Error                                                          |             |         |
| popup                  |           | [Page](./puppeteer.page.md) \| null                            |             |         |
| request                |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| requestfailed          |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| requestfinished        |           | [HTTPRequest](./puppeteer.httprequest.md)                      |             |         |
| requestservedfromcache |           | [HTTPRequest](./puppeteer.httprequest.md) \| undefined         |             |         |
| response               |           | [HTTPResponse](./puppeteer.httpresponse.md)                    |             |         |
| workercreated          |           | [WebWorker](./puppeteer.webworker.md)                          |             |         |
| workerdestroyed        |           | [WebWorker](./puppeteer.webworker.md)                          |             |         |
