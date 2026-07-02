---
sidebar_label: Page.setOfflineMode
---

# Page.setOfflineMode() method

Emulates the offline mode.

It does not change the download/upload/latency parameters set by [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md)

### Signature

```typescript
class Page {
  abstract setOfflineMode(enabled: boolean): Promise<void>;
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

enabled

</td><td>

boolean

</td><td>

When `true`, enables offline mode for the page.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
