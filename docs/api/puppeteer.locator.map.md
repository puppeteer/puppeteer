---
sidebar_label: Locator.map
---

# Locator.map() method

Maps the locator using the provided mapper.

#### Signature:

```typescript
class Locator &#123;map<To>(mapper: Mapper<T, To>): Locator<To>;&#125;
```

## Parameters

| Parameter | Type                                         | Description |
| --------- | -------------------------------------------- | ----------- |
| mapper    | [Mapper](./puppeteer.mapper.md)&lt;T, To&gt; |             |

**Returns:**

[Locator](./puppeteer.locator.md)&lt;To&gt;
