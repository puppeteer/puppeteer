---
sidebar_label: CustomQueryHandler
---

# CustomQueryHandler interface

Contains two functions `queryOne` and `queryAll` that can be [registered](./puppeteer.registercustomqueryhandler.md) as alternative querying strategies. The functions `queryOne` and `queryAll` are executed in the page context. `queryOne` should take an `Element` and a selector string as argument and return a single `Element` or `null` if no element is found. `queryAll` takes the same arguments but should instead return a `NodeListOf<Element>` or `Array<Element>` with all the elements that match the given query selector.

**Signature:**

```typescript
export interface CustomQueryHandler
```

## Properties

| Property                                                | Modifiers | Type                                                 | Description       |
| ------------------------------------------------------- | --------- | ---------------------------------------------------- | ----------------- |
| [queryAll?](./puppeteer.customqueryhandler.queryall.md) |           | (element: Node, selector: string) =&gt; Node\[\]     | <i>(Optional)</i> |
| [queryOne?](./puppeteer.customqueryhandler.queryone.md) |           | (element: Node, selector: string) =&gt; Node \| null | <i>(Optional)</i> |
