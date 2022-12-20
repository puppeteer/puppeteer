# Environmental Variables

There are some environmental variables that are useful for configuring
Puppeteer. These can be used to simplify pipeline execution. Notable
configuration variables include.

## Variables to configure browser location

These variables for setting the path to the browser executables, these will
automatically set `PUPPETEER_PRODUCT`, and disable the download of the browser.

- `CHROME_BIN`: (preferred) Sets the path to the Chrome executable.
- `FIREFOX_BIN`: (preferred) Sets the path to the FireFox executable.

Further, you have these which can provide the same thing.

- `PUPPETEER_PRODUCT`: Can be `chrome` or `firefox`, defaults to `chrome`
- `PUPPETEER_EXECUTABLE_PATH`: Sets the path to a browser executable.
- `PUPPETEER_SKIP_DOWNLOAD`: Disable the download of a browser, defaults to
  being set if `PUPPETEER_EXECUTABLE_PATH` is set.

## Variables to configure browser downloader

If you're not providing the path to the browser, and you want it download you
have these options which can help with configuration of the download:

- `PUPPETEER_PRODUCT`: Can be `chrome` or `firefox`, defaults to `chrome`.
- `PUPPETEER_BROWSER_REVISION`: The revision of the browser to download
- `PUPPETEER_DOWNLOAD_HOST`: The host where to download, useful for caching or reverse proxy.
- `PUPPETEER_DOWNLOAD_PATH`: Where to store the downloaded artifact.

## Variables to configure browser execution and logging

- `PUPPETEER_TMP_DIR`: Where to store temp files
- `PUPPETEER_CACHE_DIR`: Where to store browser cache
- `PUPPETEER_LOGLEVEL`: Can be `silent`, `error`, or `warn`
