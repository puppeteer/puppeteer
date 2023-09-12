---
sidebar_label: Page.emulateTimezone
---

# Page.emulateTimezone() method

#### Signature:

```typescript
class Page {
  emulateTimezone(timezoneId?: string): Promise<void>;
}
```

## Parameters

| Parameter  | Type   | Description                                                                                                                                                                                                                                                                                                 |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| timezoneId | string | _(Optional)_ Changes the timezone of the page. See [ICU’s metaZones.txt](https://source.chromium.org/chromium/chromium/deps/icu.git/+/faee8bc70570192d82d2978a71e2a615788597d1:source/data/misc/metaZones.txt) for a list of supported timezone IDs. Passing <code>null</code> disables timezone emulation. |

**Returns:**

Promise&lt;void&gt;
