---
sidebar_label: WebMCP
---

# WebMCP class

The experimental WebMCP class provides an API for the WebMCP API.

See the [WebMCP guide](https://pptr.dev/guides/webmcp) for more details.

### Signature

```typescript
export declare class WebMCP extends EventEmitter<{
    toolsadded: WebMCPToolsAddedEvent;
    toolsremoved: WebMCPToolsRemovedEvent;
    toolinvoked: WebMCPToolCall;
    toolresponded: WebMCPToolCallResult;
}>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;&#123; toolsadded: [WebMCPToolsAddedEvent](./puppeteer.webmcptoolsaddedevent.md); toolsremoved: [WebMCPToolsRemovedEvent](./puppeteer.webmcptoolsremovedevent.md); toolinvoked: [WebMCPToolCall](./puppeteer.webmcptoolcall.md); toolresponded: [WebMCPToolCallResult](./puppeteer.webmcptoolcallresult.md); &#125;&gt;

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `WebMCP` class.

## Example

```ts
await page.goto('https://www.example.com');
const tools = page.webmcp.tools();
for (const tool of tools) {
  console.log(`Tool found: ${tool.name} - ${tool.description}`);
}
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="tools">[tools()](./puppeteer.webmcp.tools.md)</span>

</td><td>

</td><td>

Gets all WebMCP tools defined by the page.

</td></tr>
</tbody></table>
