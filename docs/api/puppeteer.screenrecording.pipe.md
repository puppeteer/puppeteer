---
sidebar_label: ScreenRecording.pipe
---

# ScreenRecording.pipe() method

<h2 id="overload-1">pipe(): Promise&lt;void&gt;</h2>

Pipes the recorded stream to a destination stream.

### Signature

```typescript
class ScreenRecording {
  pipe<T extends WritableStream<Uint8Array>>(destination: T): Promise<void>;
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

destination

</td><td>

T

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

<h2 id="overload-2">pipe(): T</h2>

### Signature

```typescript
class ScreenRecording {
  pipe<T extends WritableDestination>(destination: T): T;
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

destination

</td><td>

T

</td><td>

</td></tr>
</tbody></table>

**Returns:**

T
