# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [10.1.0](https://github.com/puppeteer/puppeteer/compare/v10.0.0...v10.1.0) (2021-06-29)


### Features

* add a streaming version for page.pdf ([e3699e2](https://github.com/puppeteer/puppeteer/commit/e3699e248bc9c1f7a6ead9a07d68ae8b65905443))
* add drag-and-drop support ([#7150](https://github.com/puppeteer/puppeteer/issues/7150)) ([a91b8ac](https://github.com/puppeteer/puppeteer/commit/a91b8aca3728b2c2e310e9446897d729bf983377))
* add page.emulateCPUThrottling ([#7343](https://github.com/puppeteer/puppeteer/issues/7343)) ([4ce4110](https://github.com/puppeteer/puppeteer/commit/4ce41106288938b9d366c550e7a424812920683d))


### Bug Fixes

* remove redundant await while fetching target ([#7351](https://github.com/puppeteer/puppeteer/issues/7351)) ([083b297](https://github.com/puppeteer/puppeteer/commit/083b297a6741c6b1dd23867f441130655fac8f7d))

## [10.0.0](https://github.com/puppeteer/puppeteer/compare/v9.1.1...v10.0.0) (2021-05-31)


### ⚠ BREAKING CHANGES

* Node.js 10 is no longer supported.

### Features

* **chromium:** roll to Chromium 92.0.4512.0 (r884014) ([#7288](https://github.com/puppeteer/puppeteer/issues/7288)) ([f863f4b](https://github.com/puppeteer/puppeteer/commit/f863f4bfe015e57ea1f9fbb322f1cedee468b857))
* **requestinterception:** remove cacheSafe flag ([#7217](https://github.com/puppeteer/puppeteer/issues/7217)) ([d01aa6c](https://github.com/puppeteer/puppeteer/commit/d01aa6c84a1e41f15ffed3a8d36ad26a404a7187))
* expose other sessions from connection ([#6863](https://github.com/puppeteer/puppeteer/issues/6863)) ([cb285a2](https://github.com/puppeteer/puppeteer/commit/cb285a237921259eac99ade1d8b5550e068a55eb))
* **launcher:** add new launcher option `waitForInitialPage` ([#7105](https://github.com/puppeteer/puppeteer/issues/7105)) ([2605309](https://github.com/puppeteer/puppeteer/commit/2605309f74b43da160cda4d214016e4422bf7676)), closes [#3630](https://github.com/puppeteer/puppeteer/issues/3630)


### Bug Fixes

* added comments for browsercontext, startCSSCoverage, and startJSCoverage. ([#7264](https://github.com/puppeteer/puppeteer/issues/7264)) ([b750397](https://github.com/puppeteer/puppeteer/commit/b75039746ac6bddf1411538242b5e70b0f2e6e8a))
* modified comment for method product, platform and newPage ([#7262](https://github.com/puppeteer/puppeteer/issues/7262)) ([159d283](https://github.com/puppeteer/puppeteer/commit/159d2835450697dabea6f9adf6e67d158b5b8ae3))
* **requestinterception:** fix font loading issue ([#7060](https://github.com/puppeteer/puppeteer/issues/7060)) ([c9978d2](https://github.com/puppeteer/puppeteer/commit/c9978d20d5584c9fd2dc902e4b4ac86ed8ea5d6e)), closes [/github.com/puppeteer/puppeteer/pull/6996#issuecomment-811546501](https://github.com/puppeteer//github.com/puppeteer/puppeteer/pull/6996/issues/issuecomment-811546501) [/github.com/puppeteer/puppeteer/pull/6996#issuecomment-813797393](https://github.com/puppeteer//github.com/puppeteer/puppeteer/pull/6996/issues/issuecomment-813797393) [#7038](https://github.com/puppeteer/puppeteer/issues/7038)


* drop support for Node.js 10 ([#7200](https://github.com/puppeteer/puppeteer/issues/7200)) ([97c9fe2](https://github.com/puppeteer/puppeteer/commit/97c9fe2520723d45a5a86da06b888ae888d400be)), closes [#6753](https://github.com/puppeteer/puppeteer/issues/6753)

### [9.1.1](https://github.com/puppeteer/puppeteer/compare/v9.1.0...v9.1.1) (2021-05-05)


### Bug Fixes

* make targetFilter synchronous ([#7203](https://github.com/puppeteer/puppeteer/issues/7203)) ([bcc85a0](https://github.com/puppeteer/puppeteer/commit/bcc85a0969077d122e5d8d2fb5c1061999a8ae48))

## [9.1.0](https://github.com/puppeteer/puppeteer/compare/v9.0.0...v9.1.0) (2021-05-03)


### Features

* add option to filter targets ([#7192](https://github.com/puppeteer/puppeteer/issues/7192)) ([ec3fc2e](https://github.com/puppeteer/puppeteer/commit/ec3fc2e035bb5ca14a576180fff612e1ecf6bad7))


### Bug Fixes

* change rm -rf to rimraf ([#7168](https://github.com/puppeteer/puppeteer/issues/7168)) ([ad6b736](https://github.com/puppeteer/puppeteer/commit/ad6b736039436fcc5c0a262e5b575aa041427be3))

## [9.0.0](https://github.com/puppeteer/puppeteer/compare/v8.0.0...v9.0.0) (2021-04-21)


### ⚠ BREAKING CHANGES

* **filechooser:** FileChooser.cancel() is now synchronous.

### Features

* **chromium:** roll to Chromium 91.0.4469.0 (r869685) ([#7110](https://github.com/puppeteer/puppeteer/issues/7110)) ([715e7a8](https://github.com/puppeteer/puppeteer/commit/715e7a8d62901d1c7ec602425c2fce8d8148b742))
* **launcher:** fix installation error on Apple M1 chips ([#7099](https://github.com/puppeteer/puppeteer/issues/7099)) ([c239d9e](https://github.com/puppeteer/puppeteer/commit/c239d9edc72d85697b4875c98fff3ec592848082)), closes [#6622](https://github.com/puppeteer/puppeteer/issues/6622)
* **network:** request interception and caching compatibility ([#6996](https://github.com/puppeteer/puppeteer/issues/6996)) ([8695759](https://github.com/puppeteer/puppeteer/commit/8695759a223bc1bd31baecb00dc28721216e4c6f))
* **page:** emit the event after removing the Worker ([#7080](https://github.com/puppeteer/puppeteer/issues/7080)) ([e34a6d5](https://github.com/puppeteer/puppeteer/commit/e34a6d53183c3e1f63a375ba6a26bee0dcfcf542))
* **types:** improve type of predicate function ([#6997](https://github.com/puppeteer/puppeteer/issues/6997)) ([943477c](https://github.com/puppeteer/puppeteer/commit/943477cc1eb4b129870142873b3554737d5ef252)), closes [/github.com/DefinitelyTyped/DefinitelyTyped/blob/c43191a8f7a7d2a47bbff0bc3a7d95ecc64d2269/types/puppeteer/index.d.ts#L1883-L1885](https://github.com/puppeteer//github.com/DefinitelyTyped/DefinitelyTyped/blob/c43191a8f7a7d2a47bbff0bc3a7d95ecc64d2269/types/puppeteer/index.d.ts/issues/L1883-L1885)
* accept captureBeyondViewport as optional screenshot param ([#7063](https://github.com/puppeteer/puppeteer/issues/7063)) ([0e092d2](https://github.com/puppeteer/puppeteer/commit/0e092d2ea0ec18ad7f07ad3507deb80f96086e7a))
* **page:** add omitBackground option for page.pdf method ([#6981](https://github.com/puppeteer/puppeteer/issues/6981)) ([dc8ab6d](https://github.com/puppeteer/puppeteer/commit/dc8ab6d8ca1661f8e56d329e6d9c49c891e8b975))


### Bug Fixes

* **aria:** fix parsing of ARIA selectors ([#7037](https://github.com/puppeteer/puppeteer/issues/7037)) ([4426135](https://github.com/puppeteer/puppeteer/commit/4426135692ae3ee7ed2841569dd9375e7ca8286c))
* **page:** fix mouse.click method ([#7097](https://github.com/puppeteer/puppeteer/issues/7097)) ([ba7c367](https://github.com/puppeteer/puppeteer/commit/ba7c367de33ace7753fd9d8b8cc894b2c14ab6c2)), closes [#6462](https://github.com/puppeteer/puppeteer/issues/6462) [#3347](https://github.com/puppeteer/puppeteer/issues/3347)
* make `$` and `$$` selectors generic ([#6883](https://github.com/puppeteer/puppeteer/issues/6883)) ([b349c91](https://github.com/puppeteer/puppeteer/commit/b349c91e7df76630b7411d6645e649945c4609bd))
* type page event listeners correctly ([#6891](https://github.com/puppeteer/puppeteer/issues/6891)) ([866d34e](https://github.com/puppeteer/puppeteer/commit/866d34ee1122e89eab00743246676845bb065968))
* **typescript:** allow defaultViewport to be 'null' ([#6942](https://github.com/puppeteer/puppeteer/issues/6942)) ([e31e68d](https://github.com/puppeteer/puppeteer/commit/e31e68dfa12dd50482b700472bc98876b9031829)), closes [#6885](https://github.com/puppeteer/puppeteer/issues/6885)
* make screenshots work in puppeteer-web ([#6936](https://github.com/puppeteer/puppeteer/issues/6936)) ([5f24f60](https://github.com/puppeteer/puppeteer/commit/5f24f608194fd4252da7b288461427cabc9dabb3))
* **filechooser:** cancel is sync ([#6937](https://github.com/puppeteer/puppeteer/issues/6937)) ([2ba61e0](https://github.com/puppeteer/puppeteer/commit/2ba61e04e923edaac09c92315212552f2d4ce676))
* **network:** don't disable cache for auth challenge ([#6962](https://github.com/puppeteer/puppeteer/issues/6962)) ([1c2479a](https://github.com/puppeteer/puppeteer/commit/1c2479a6cd4bd09a577175ffd31c40ca6f4279b8))

## [8.0.0](https://github.com/puppeteer/puppeteer/compare/v7.1.0...v8.0.0) (2021-02-26)


### ⚠ BREAKING CHANGES

* renamed type `ChromeArgOptions` to `BrowserLaunchArgumentOptions`
* renamed type `BrowserOptions` to `BrowserConnectOptions`

### Features

* **chromium:** roll Chromium to r856583 ([#6927](https://github.com/puppeteer/puppeteer/issues/6927)) ([0c688bd](https://github.com/puppeteer/puppeteer/commit/0c688bd75ef1d1fc3afd14cbe8966757ecda68fb))


### Bug Fixes

* explicit HTTPRequest.resourceType type defs ([#6882](https://github.com/puppeteer/puppeteer/issues/6882)) ([ff26c62](https://github.com/puppeteer/puppeteer/commit/ff26c62647b60cd0d8d7ea66ee998adaadc3fcc2)), closes [#6854](https://github.com/puppeteer/puppeteer/issues/6854)
* expose `Viewport` type ([#6881](https://github.com/puppeteer/puppeteer/issues/6881)) ([be7c229](https://github.com/puppeteer/puppeteer/commit/be7c22933c1dcf5eee797d61463171bd0ef44582))
* improve TS types for launching browsers ([#6888](https://github.com/puppeteer/puppeteer/issues/6888)) ([98c8145](https://github.com/puppeteer/puppeteer/commit/98c81458c27f378eb66c38e1620e79e2ffde418e))
* move CI npm config out of .npmrc ([#6901](https://github.com/puppeteer/puppeteer/issues/6901)) ([f7de60b](https://github.com/puppeteer/puppeteer/commit/f7de60be22d9bc6433ada7bfefeaa7f6f6f62047))

## [7.1.0](https://github.com/puppeteer/puppeteer/compare/v7.0.4...v7.1.0) (2021-02-12)


### Features

* **page:** add color-gamut support to Page.emulateMediaFeatures ([#6857](https://github.com/puppeteer/puppeteer/issues/6857)) ([ad59357](https://github.com/puppeteer/puppeteer/commit/ad5935738d869cfce386a0d28b4bc6131457f962)), closes [#6761](https://github.com/puppeteer/puppeteer/issues/6761)


### Bug Fixes

* add favicon test asset ([#6868](https://github.com/puppeteer/puppeteer/issues/6868)) ([a63f53c](https://github.com/puppeteer/puppeteer/commit/a63f53c9380545550503f5539494c72c607e19ac))
* expose `ScreenshotOptions` type in type defs ([#6869](https://github.com/puppeteer/puppeteer/issues/6869)) ([63d48b2](https://github.com/puppeteer/puppeteer/commit/63d48b2ecba317b6c0a3acad87a7a3671c769dbc)), closes [#6866](https://github.com/puppeteer/puppeteer/issues/6866)
* expose puppeteer.Permission type ([#6856](https://github.com/puppeteer/puppeteer/issues/6856)) ([a5e174f](https://github.com/puppeteer/puppeteer/commit/a5e174f696eb192c541db64a603ea5cdf385a643))
* jsonValue() type is generic ([#6865](https://github.com/puppeteer/puppeteer/issues/6865)) ([bdaba78](https://github.com/puppeteer/puppeteer/commit/bdaba7829da366aabbc81885d84bb2401ab3eaff))
* wider compat TS types and CI checks to ensure correct type defs ([#6855](https://github.com/puppeteer/puppeteer/issues/6855)) ([6a0eb78](https://github.com/puppeteer/puppeteer/commit/6a0eb7841fd82493903b0b9fa153d2de181350eb))

### [7.0.4](https://github.com/puppeteer/puppeteer/compare/v7.0.3...v7.0.4) (2021-02-09)


### Bug Fixes

* make publish bot run full build, not just tsc ([#6848](https://github.com/puppeteer/puppeteer/issues/6848)) ([f718b14](https://github.com/puppeteer/puppeteer/commit/f718b14b64df8be492d344ddd35e40961ff750c5))

### [7.0.3](https://github.com/puppeteer/puppeteer/compare/v7.0.2...v7.0.3) (2021-02-09)


### Bug Fixes

* include lib/types.d.ts in files list ([#6844](https://github.com/puppeteer/puppeteer/issues/6844)) ([e34f317](https://github.com/puppeteer/puppeteer/commit/e34f317b37533256a063c1238609b488d263b998))

### [7.0.2](https://github.com/puppeteer/puppeteer/compare/v7.0.1...v7.0.2) (2021-02-09)


### Bug Fixes

* much better TypeScript definitions ([#6837](https://github.com/puppeteer/puppeteer/issues/6837)) ([f1b46ab](https://github.com/puppeteer/puppeteer/commit/f1b46ab5faa262f893c17923579d0cf52268a764))
* **domworld:** reset bindings when context changes ([#6766](https://github.com/puppeteer/puppeteer/issues/6766)) ([#6836](https://github.com/puppeteer/puppeteer/issues/6836)) ([4e8d074](https://github.com/puppeteer/puppeteer/commit/4e8d074c2f8384a2f283f5edf9ef69c40bd8464f))
* **launcher:** output correct error message for browser ([#6815](https://github.com/puppeteer/puppeteer/issues/6815)) ([6c61874](https://github.com/puppeteer/puppeteer/commit/6c618747979c3a08f2727e9e22fe45cade8c926a))

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
