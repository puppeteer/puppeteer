---
sidebar_label: Locator.last
---

# Locator.last() method

Trying to locate all the elements for locator array in parallel and return the last locator that locate element.

#### Signature:

```typescript
class Locator {
  static last<Locators extends readonly unknown[] | []>(
    locators: Locators
  ): Locator<AwaitedLocator<Locators[number]>>;
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

locators

</td><td>

Locators

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;[AwaitedLocator](./puppeteer.awaitedlocator.md)&lt;Locators\[number\]&gt;&gt;
