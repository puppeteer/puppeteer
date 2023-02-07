---
sidebar_label: JSHandle.remoteObject
---

# JSHandle.remoteObject() method

Provides access to the \[Protocol.Runtime.RemoteObject\](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/\#type-RemoteObject) OR \[Bidi.Script.RemoteReference\](https://w3c.github.io/webdriver-bidi/\#data-types-reference) backing this handle.

#### Signature:

```typescript
class JSHandle {
  remoteObject(): Protocol.Runtime.RemoteObject | any;
}
```

**Returns:**

Protocol.Runtime.RemoteObject \| any
