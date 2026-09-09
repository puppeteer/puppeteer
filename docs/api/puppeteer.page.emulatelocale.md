---
sidebar_label: Page.emulateLocale
---

# Page.emulateLocale() method

### Signature

```typescript
class Page {
  abstract emulateLocale(locale?: string): Promise<void>;
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

locale

</td><td>

string

</td><td>

_(Optional)_ Locale to emulate on the page. Passing no locale disables locale emulation.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
