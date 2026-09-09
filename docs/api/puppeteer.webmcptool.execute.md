---
sidebar_label: WebMCPTool.execute
---

# WebMCPTool.execute() method

Executes tool with input parameters, matching tool's `inputSchema`.

### Signature

```typescript
class WebMCPTool {
  execute(
    input?: object,
    options?: WebMCPToolExecuteOptions,
  ): Promise<WebMCPToolCallResult>;
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

input

</td><td>

object

</td><td>

_(Optional)_

</td></tr>
<tr><td>

options

</td><td>

[WebMCPToolExecuteOptions](./puppeteer.webmcptoolexecuteoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[WebMCPToolCallResult](./puppeteer.webmcptoolcallresult.md)&gt;
