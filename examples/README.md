# Running the examples

Assuming you have a checkout of the Puppeteer repo and install the dependencies:

```bash npm2yarn
npm install
```

Build the project:

```bash npm2yarn
npm run build
```

The examples can be run from the root folder like so:

```bash
NODE_PATH=../ node examples/search.js
```

## Larger examples

More complex and use case driven examples can be found at [github.com/GoogleChromeLabs/puppeteer-examples](https://github.com/GoogleChromeLabs/puppeteer-examples).

# Other resources

Other useful tools, articles, and projects that use Puppeteer.

## Rendering and web scraping

- [Puppetron](https://github.com/cheeaun/puppetron) - Demo site that shows how to use Puppeteer and Headless Chrome to render pages. Inspired by [GoogleChrome/rendertron](https://github.com/GoogleChrome/rendertron).
- [Thal](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e 'An article on medium') - Getting started with Puppeteer and Chrome Headless for Web Scraping.
- [pupperender](https://github.com/LasaleFamine/pupperender) - Express middleware that checks the User-Agent header of incoming requests, and if it matches one of a configurable set of bots, render the page using Puppeteer. Useful for PWA rendering.
- [headless-chrome-crawler](https://github.com/yujiosaka/headless-chrome-crawler) - Crawler that provides simple APIs to manipulate Headless Chrome and allows you to crawl dynamic websites.
- [puppeteer-examples](https://github.com/checkly/puppeteer-examples) - Puppeteer Headless Chrome examples for real life use cases such as getting useful info from the web pages or common login scenarios.
- [browserless](https://github.com/joelgriffith/browserless) - Headless Chrome as a service letting you execute Puppeteer scripts remotely. Provides a docker image with configuration for concurrency, launch arguments and more.
- [Puppeteer on AWS Lambda](https://github.com/jay-deshmukh/headless-chrome-with-puppeteer-on-AWS-lambda-with-serverless-framework) - Running puppeteer on AWS Lambda with Serverless framework
- [Apify SDK](https://github.com/apifytech/apify-js) - The scalable web crawling and scraping library for JavaScript. Automatically manages a pool of Puppeteer browsers and provides easy error handling, task management, proxy rotation and more.

## Testing

- [angular-puppeteer-demo](https://github.com/Quramy/angular-puppeteer-demo) - Demo repository explaining how to use Puppeteer in Karma.
- [mocha-headless-chrome](https://github.com/direct-adv-interfaces/mocha-headless-chrome) - Tool which runs client-side **mocha** tests in the command line through headless Chrome.
- [puppeteer-to-istanbul-example](https://github.com/bcoe/puppeteer-to-istanbul-example) - Demo repository demonstrating how to output Puppeteer coverage in Istanbul format.
- [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) - (almost) Zero configuration tool for setting up and running Jest and Puppeteer easily. Also includes an assertion library for Puppeteer.
- [puppeteer-har](https://github.com/Everettss/puppeteer-har) - Generate HAR file with puppeteer.
- [puppetry](https://puppetry.app/) - A desktop app to build Puppeteer/Jest driven tests without coding.
- [puppeteer-loadtest](https://github.com/svenkatreddy/puppeteer-loadtest) - commandline interface for performing load test on puppeteer scripts.
- [cucumber-puppeteer-example](https://github.com/mlampedx/cucumber-puppeteer-example) - Example repository demonstrating how to use Puppeeteer and Cucumber for integration testing.

Also, see the [community list of Puppeteer resources](https://github.com/transitive-bullshit/awesome-puppeteer) for more examples.
