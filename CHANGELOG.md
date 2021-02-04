# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [7.0.1](https://github.com/puppeteer/puppeteer/compare/v7.0.0...v7.0.1) (2021-02-04)


### Bug Fixes

* **typescript:** ship .d.ts file in npm package ([#6811](https://github.com/puppeteer/puppeteer/issues/6811)) ([a7e3c2e](https://github.com/puppeteer/puppeteer/commit/a7e3c2e09e9163eee2f15221aafa4400e6a75f91))

## [7.0.0](https://github.com/puppeteer/puppeteer/compare/v6.0.0...v7.0.0) (2021-02-03)


### ⚠ BREAKING CHANGES

* - `page.screenshot` makes a screenshot with the clip dimensions, not cutting it by the ViewPort size.
* **chromium:** - `page.screenshot` cuts screenshot content by the ViewPort size, not ViewPort position.

### Features

* use `captureBeyondViewport` in `Page.captureScreenshot` ([#6805](https://github.com/puppeteer/puppeteer/issues/6805)) ([401d84e](https://github.com/puppeteer/puppeteer/commit/401d84e4a3508f9ca5c24dbfcad2a71571b1b8eb))
* **chromium:** roll Chromium to r848005 ([#6801](https://github.com/puppeteer/puppeteer/issues/6801)) ([890d5c2](https://github.com/puppeteer/puppeteer/commit/890d5c2e57cdee7d73915a878bda86b72e26b608))

## [6.0.0](https://github.com/puppeteer/puppeteer/compare/v5.5.0...v6.0.0) (2021-02-02)


### ⚠ BREAKING CHANGES

* **chromium:** The built-in `aria/` selector query handler doesn’t return ignored elements anymore.

### Features

* **chromium:** roll Chromium to r843427 ([#6797](https://github.com/puppeteer/puppeteer/issues/6797)) ([8f9fbdb](https://github.com/puppeteer/puppeteer/commit/8f9fbdbae68254600a9c73ab05f36146c975dba6)), closes [#6758](https://github.com/puppeteer/puppeteer/issues/6758)
* add page.emulateNetworkConditions ([#6759](https://github.com/puppeteer/puppeteer/issues/6759)) ([5ea76e9](https://github.com/puppeteer/puppeteer/commit/5ea76e9333c42ab5a751ca01aa5676a662f6c063))
* **types:** expose typedefs to consumers ([#6745](https://github.com/puppeteer/puppeteer/issues/6745)) ([ebd087a](https://github.com/puppeteer/puppeteer/commit/ebd087a31661a1b701650d0be3e123cc5a813bd8))
* add iPhone 11 models to DeviceDescriptors ([#6467](https://github.com/puppeteer/puppeteer/issues/6467)) ([50b810d](https://github.com/puppeteer/puppeteer/commit/50b810dab7fae5950ba086295462788f91ff1e6f))
* support fetching and launching on Apple M1 ([9a8479a](https://github.com/puppeteer/puppeteer/commit/9a8479a52a7d8b51690b0732b2a10816cd1b8aef)), closes [#6495](https://github.com/puppeteer/puppeteer/issues/6495) [#6634](https://github.com/puppeteer/puppeteer/issues/6634) [#6641](https://github.com/puppeteer/puppeteer/issues/6641) [#6614](https://github.com/puppeteer/puppeteer/issues/6614)
* support promise as return value for page.waitForResponse predicate ([#6624](https://github.com/puppeteer/puppeteer/issues/6624)) ([b57f3fc](https://github.com/puppeteer/puppeteer/commit/b57f3fcd5393c68f51d82e670b004f5b116dcbc3))


### Bug Fixes

* **domworld:** fix waitfor bindings ([#6766](https://github.com/puppeteer/puppeteer/issues/6766)) ([#6775](https://github.com/puppeteer/puppeteer/issues/6775)) ([cac540b](https://github.com/puppeteer/puppeteer/commit/cac540be3ab8799a1d77b0951b16bc22ea1c2adb))
* **launcher:** rename TranslateUI to Translate to match Chrome ([#6692](https://github.com/puppeteer/puppeteer/issues/6692)) ([d901696](https://github.com/puppeteer/puppeteer/commit/d901696e0d8901bcb23cf676a5e5ac562f821a0d))
* do not use old utility world ([#6528](https://github.com/puppeteer/puppeteer/issues/6528)) ([fb85911](https://github.com/puppeteer/puppeteer/commit/fb859115c0e2829bae1d1b32edbf642988e2ef76)), closes [#6527](https://github.com/puppeteer/puppeteer/issues/6527)
* update to https-proxy-agent@^5.0.0 to fix `ERR_INVALID_PROTOCOL` ([#6555](https://github.com/puppeteer/puppeteer/issues/6555)) ([3bf5a55](https://github.com/puppeteer/puppeteer/commit/3bf5a552890ee80cc4326b1e430424b0fdad4363))

## [5.5.0](https://github.com/puppeteer/puppeteer/compare/v5.4.1...v5.5.0) (2020-11-16)


### Features

* **chromium:** roll Chromium to r818858 ([#6526](https://github.com/puppeteer/puppeteer/issues/6526)) ([b549256](https://github.com/puppeteer/puppeteer/commit/b54925695200cad32f470f8eb407259606447a85))


### Bug Fixes

* **common:** fix generic type of `_isClosedPromise` ([#6579](https://github.com/puppeteer/puppeteer/issues/6579)) ([122f074](https://github.com/puppeteer/puppeteer/commit/122f074f92f47a7b9aa08091851e51a07632d23b))
* **domworld:** fix missing binding for waittasks ([#6562](https://github.com/puppeteer/puppeteer/issues/6562)) ([67da1cf](https://github.com/puppeteer/puppeteer/commit/67da1cf866703f5f581c9cce4923697ac38129ef))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
