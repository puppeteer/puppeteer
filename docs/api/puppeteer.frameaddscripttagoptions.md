---
sidebar_label: FrameAddScriptTagOptions
---

# FrameAddScriptTagOptions interface

#### Signature:

```typescript
export interface FrameAddScriptTagOptions
```

## Properties

| Property | Modifiers             | Type   | Description                                                                                          | Default |
| -------- | --------------------- | ------ | ---------------------------------------------------------------------------------------------------- | ------- |
| content  | <code>optional</code> | string | JavaScript to be injected into the frame.                                                            |         |
| id       | <code>optional</code> | string | Sets the <code>id</code> of the script.                                                              |         |
| path     | <code>optional</code> | string | Path to a JavaScript file to be injected into the frame.                                             |         |
| type     | <code>optional</code> | string | Sets the <code>type</code> of the script. Use <code>module</code> in order to load an ES2015 module. |         |
| url      | <code>optional</code> | string | URL of the script to be added.                                                                       |         |
