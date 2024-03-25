---
sidebar_label: Page.emulateTimezone
---

# Page.emulateTimezone() method

#### Signature:

```typescript
class Page {
  abstract emulateTimezone(timezoneId?: string): Promise<void>;
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

timezoneId

</td><td>

string

</td><td>

_(Optional)_ Changes the timezone of the page. See [ICU’s metaZones.txt](https://source.chromium.org/chromium/chromium/deps/icu.git/+/faee8bc70570192d82d2978a71e2a615788597d1:source/data/misc/metaZones.txt) for a list of supported timezone IDs. Passing `null` disables timezone emulation.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
