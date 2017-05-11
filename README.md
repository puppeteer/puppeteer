### Status

Test results on Mac OS X in headless mode:
```
  111 passed
   20 failed as expected
    1 skipped
   49 unsupported
```

### Installing

```bash
npm i
npm link # this adds puppeteer to $PATH
```

### Run

```bash
# run phantomjs script
puppeteer third_party/phantomjs/examples/colorwheel.js

# run 'headful'
puppeteer --no-headless third_party/phantomjs/examples/colorwheel.js

# run puppeteer example
node examples/screenshot.js
```

### Tests

Run phantom.js tests using puppeteer:
```
./third_party/phantomjs/test/run-tests.py
```
