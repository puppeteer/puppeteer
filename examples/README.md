# Running the examples

Assuming you have a checkout of the Puppeteer repo and have run npm i (or yarn) to install the dependencies, the examples can be run from the root folder like so:

```sh
NODE_PATH=../ node examples/search.js
```

## Larger examples

More complex and use case driven examples can be found at https://github.com/GoogleChromeLabs/puppeteer-examples.

# Tips & Tricks

## Load a Chrome extension

By default, Puppeteer disables extensions when launching Chrome. You can load a specific
extension using:

```js
const browser = await puppeteer.launch({
  headless: false,
  args: [
    '--disable-extensions-except=/path/to/extension/',
    '--load-extension=/path/to/extension/',
  ]
});
```

# Other resources

> Other useful tools, articles, and projects that use Puppeteer.

## Rendering and web scraping

- [Puppetron](https://github.com/cheeaun/puppetron) - Demo site that shows how to use Puppeteer and Headless Chrome to render pages. Inspired by [GoogleChrome/rendertron](https://github.com/GoogleChrome/rendertron).
- [Thal](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e "An article on medium") - Getting started with Puppeteer and Chrome Headless for Web Scraping.
- [pupperender](https://github.com/LasaleFamine/pupperender) - Express middleware that checks the User-Agent header of incoming requests, and if it matches one of a configurable set of bots, render the page using Puppeteer. Useful for PWA rendering.
- [headless-chrome-crawler](https://github.com/yujiosaka/headless-chrome-crawler) - Crawler that provides simple APIs to manipulate Headless Chrome and allows you to crawl dynamic websites.
- [puppeteer-examples](https://github.com/checkly/puppeteer-examples) - Puppeteer Headless Chrome examples for real life use cases such as getting useful info from the web pages or common login scenarios.
- [browserless](https://github.com/joelgriffith/browserless) - Headless Chrome as a service letting you execute Puppeteer scripts remotely. Provides a docker image with configuration for concurrency, launch arguments and more.
- [Puppeteer Sandbox](https://puppeteersandbox.com) - Puppeteer sandbox environment as a service. Runs Puppeteer scripts and allows saving and embedding them in external sites and markdown files.

## Testing

- [angular-puppeteer-demo](https://github.com/Quramy/angular-puppeteer-demo) - Demo repository explaining how to use Puppeteer in Karma.
- [mocha-headless-chrome](https://github.com/direct-adv-interfaces/mocha-headless-chrome) - Tool which runs client-side **mocha** tests in the command line through headless Chrome.
- [puppeteer-to-istanbul-example](https://github.com/bcoe/puppeteer-to-istanbul-example) - Demo repository demonstrating how to output Puppeteer coverage in Istanbul format.

## Services
- [Checkly](https://checklyhq.com) - Monitoring SaaS that uses Puppeteer to check availability and correctness of web pages and apps.
