---
sidebar_label: HTTPRequest.redirectChain
---

# HTTPRequest.redirectChain() method

A `redirectChain` is a chain of requests initiated to fetch a resource.

#### Signature:

```typescript
class HTTPRequest {
  abstract redirectChain(): HTTPRequest[];
}
```

**Returns:**

[HTTPRequest](./puppeteer.httprequest.md)\[\]

the chain of requests - if a server responds with at least a single redirect, this chain will contain all requests that were redirected.

## Remarks

`redirectChain` is shared between all the requests of the same chain.

For example, if the website `http://example.com` has a single redirect to `https://example.com`, then the chain will contain one request:

```ts
const response = await page.goto('http://example.com');
const chain = response.request().redirectChain();
console.log(chain.length); // 1
console.log(chain[0].url()); // 'http://example.com'
```

If the website `https://google.com` has no redirects, then the chain will be empty:

```ts
const response = await page.goto('https://google.com');
const chain = response.request().redirectChain();
console.log(chain.length); // 0
```
