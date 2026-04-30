# WebMCP

:::caution

WebMCP is an experimental API and is subject to change. It is currently only supported in Chrome 149+ and requires specific flags to be enabled.

:::

[WebMCP](https://github.com/webmachinelearning/webmcp) is an experimental API that allows web pages to register tools that can be discovered and invoked by the browser or external agents (like LLMs). Puppeteer provides an experimental API to interact with WebMCP-enabled pages.

## Prerequisites

To use WebMCP with Puppeteer, you need:

1.  **Chrome 149+**: The browser must support the WebMCP CDP domain.
2.  **Enabled Flags**: You must launch the browser with the following flags:
    - `--enable-features=WebMCPTesting,DevToolsWebMCPSupport`

## Enabling WebMCP

In Puppeteer, WebMCP support is available through the [`page.webmcp`](../api/puppeteer.webmcp) property. It is automatically initialized when you navigate to a page if the browser supports it.

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  args: ['--enable-features=WebMCPTesting,DevToolsWebMCPSupport'],
});
const page = await browser.newPage();

// page.webmcp is now available
console.log(page.webmcp);
```

## Discovering tools

You can get a list of all tools registered on the page using `page.webmcp.tools()`. You can also listen for `toolsadded` and `toolsremoved` events to react to changes in the registered tools.

```ts
// Get currently registered tools
const tools = page.webmcp.tools();
for (const tool of tools) {
  console.log(`Tool found: ${tool.name} - ${tool.description}`);
}

// Listen for new tools
page.webmcp.on('toolsadded', event => {
  for (const tool of event.tools) {
    console.log(`New tool added: ${tool.name}`);
  }
});

// Listen for removed tools
page.webmcp.on('toolsremoved', event => {
  for (const tool of event.tools) {
    console.log(`Tool removed: ${tool.name}`);
  }
});
```

## Executing tools

You can execute a discovered tool using the `execute` method on the `WebMCPTool` object. This method returns a promise that resolves with the tool's result.

```ts
const tools = page.webmcp.tools();
const tool = tools.find(t => t.name === 'calculate_sum');

if (tool) {
  const result = await tool.execute({a: 5, b: 10});
  if (result.status === 'Completed') {
    console.log('Result:', result.output);
  } else {
    console.error('Error:', result.errorText);
  }
}
```

## Handling tool invocations

You can observe when a tool is invoked by the page or the browser and when it responds.

```ts
page.webmcp.on('toolinvoked', call => {
  console.log(`Tool ${call.tool.name} was invoked with input:`, call.input);
});

page.webmcp.on('toolresponded', response => {
  console.log(
    `Tool ${response.call?.tool.name} responded with status: ${response.status}`,
  );
  if (response.status === 'Completed') {
    console.log('Output:', response.output);
  } else {
    console.log('Error:', response.errorText);
  }
});
```

## Registering tools in the page

Tools can be registered in the page either imperatively via JavaScript or declaratively via HTML forms.

### Imperative registration

```ts
await page.evaluate(() => {
  window.navigator.modelContext.registerTool({
    name: 'calculate_sum',
    description: 'Calculates the sum of two numbers',
    inputSchema: {
      type: 'object',
      properties: {
        a: {type: 'number'},
        b: {type: 'number'},
      },
      required: ['a', 'b'],
    },
    execute: ({a, b}) => {
      return a + b;
    },
  });
});
```

### Declarative registration

WebMCP also supports discovering tools defined as HTML forms with specific attributes.

```ts
await page.setContent(`
  <form
    toolname="search_products"
    tooldescription="Search for products in the catalog"
  >
    <input name="query" type="text" />
    <button type="submit">Search</button>
  </form>
`);
```

When a tool is registered via a form, you can access the corresponding [`ElementHandle`](../api/puppeteer.elementhandle) using `tool.formElement`.

```ts
const tools = page.webmcp.tools();
const searchTool = tools.find(t => t.name === 'search_products');
const formHandle = await searchTool.formElement;
```
