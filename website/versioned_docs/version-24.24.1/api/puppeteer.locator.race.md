---
sidebar_label: Locator.race
---

# Locator.race() method

Creates a race between multiple locators trying to locate elements in parallel but ensures that only a single element receives the action.

### Signature

```typescript
class Locator {
  static race<Locators extends readonly unknown[] | []>(
    locators: Locators,
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
