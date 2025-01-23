# Configuration

By default, Puppeteer downloads and uses a specific version of Chrome so its
API is guaranteed to work out of the box. To use Puppeteer with a different
version of Chrome or Chromium, pass in the executable's path when creating a
`Browser` instance:

```ts
const browser = await puppeteer.launch({executablePath: '/path/to/Chrome'});
```

You can also use Puppeteer with Firefox. See
[status of cross-browser support](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support) for
more information.

All defaults in Puppeteer can be customized in two ways:

1. [Configuration files](#configuration-files) (**recommended**)
2. [Environment variables](#environment-variables)

:::caution

Note that some options are only customizable through environment variables (such
as `HTTPS_PROXY`).

:::

:::caution

Puppeteer's configuration files and environment variables are ignored by `puppeteer-core`.

:::

## Configuration files

Configuration files are the **recommended** choice for configuring Puppeteer.
Puppeteer will look up the file tree for any of the following formats:

- `.puppeteerrc.cjs`,
- `.puppeteerrc.js`,
- `.puppeteerrc` (YAML/JSON),
- `.puppeteerrc.json`,
- `.puppeteerrc.yaml`,
- `puppeteer.config.js`, and
- `puppeteer.config.cjs`

See the [`Configuration`](../api/puppeteer.configuration) interface for possible
options.

### Changing download options

When the changes to the configuration include changes to download option,
you will need to re-run postinstall scripts for them to take effect.

This can most easily be done with running:

```bash npm2yarn
npx puppeteer browsers install
```

### Examples

#### Downloading multiple browsers

Starting with v23.0.0, Puppeteer allows downloading multiple browser
without the need to run multiple commands.

Update the Puppeteer configuration file:

```js title="project-directory/.puppeteerrc.cjs"
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Download Chrome (default `skipDownload: false`).
  chrome: {
    skipDownload: false,
  },
  // Download Firefox (default `skipDownload: true`).
  firefox: {
    skipDownload: false,
  },
};
```

Run CLI to download the new configuration:

```bash npm2yarn
npx puppeteer browsers install
```

#### Changing the default cache directory

Starting in v19.0.0, Puppeteer stores browsers in `~/.cache/puppeteer` to
globally cache browsers between installation. This can cause problems if
`puppeteer` is packed during some build step and moved to a fresh location. The
following configuration can solve this issue (reinstall `puppeteer` to take
effect):

```js title="project-directory/.puppeteerrc.cjs"
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
```

:::note

Notice this is only possible with CommonJS configuration files as information
about the ambient environment is needed (in this case, `__dirname`).

:::

## Environment variables

Along with configuration files, Puppeteer looks for certain
[environment variables](https://en.wikipedia.org/wiki/Environment_variable) for
customizing behavior. Environment variables will always override configuration
file options when applicable.

The following options are _environment-only_ options

- `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` - defines HTTP proxy settings that are
  used to download and run the browser.

All other options can be found in the documentation for the
[`Configuration`](../api/puppeteer.configuration) interface.
