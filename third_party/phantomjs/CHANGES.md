Short Name: phantomjs
URL: https://github.com/ariya/phantomjs/tree/2.1.1
Version: 2.1.1
License: BSD
License File: LICENSE.BSD
Security Critical: no

Description:
This package is used to aid puppeteer in running phantom.js scripts:
- test/ - testsuite is used to validate puppeteer running phantom.js scripts
- boostrap.js - used to bootstrap puppeteer environment

Local Modifications:

- test/run_test.py was changed to run puppeteer instead of phantomjs
- Certain tests under test/ were changed where tests were unreasonably strict in their expectations
  (e.g. validating the exact format of error messages)
- bootstrap.js was changed to accept native modules as function arguments.
- test/run_test.py was enhanced to support "unsupported" directive
