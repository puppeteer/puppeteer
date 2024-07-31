---
sidebar_label: Locator.map
---

# Locator.map() method

Maps the locator using the provided mapper.

### Signature

```typescript
class Locator {
  map<To>(mapper: Mapper<T, To>): Locator<To>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

mapper

</td><td>

[Mapper](./puppeteer.mapper.md)&lt;T, To&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;To&gt;
