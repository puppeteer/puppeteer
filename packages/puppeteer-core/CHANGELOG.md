# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [19.7.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.7.1...puppeteer-core-v19.7.2) (2023-02-20)


### Bug Fixes

* bump chromium-bidi to a version that does not declare mitt as a peer dependency ([#9701](https://github.com/puppeteer/puppeteer/issues/9701)) ([82916c1](https://github.com/puppeteer/puppeteer/commit/82916c102b2c399093ba9019e272207b5ce81849))

## [19.7.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.7.0...puppeteer-core-v19.7.1) (2023-02-15)


### Bug Fixes

* fix circularity on JSHandle interface ([#9661](https://github.com/puppeteer/puppeteer/issues/9661)) ([eb13863](https://github.com/puppeteer/puppeteer/commit/eb138635d661d3cdaf2940959fece5aca482178a))
* make chromium-bidi an opt peer dep ([#9667](https://github.com/puppeteer/puppeteer/issues/9667)) ([c6054ac](https://github.com/puppeteer/puppeteer/commit/c6054ac1a56c08ee7bf01321878699b7b4ab4e0b))

## [19.7.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.6.3...puppeteer-core-v19.7.0) (2023-02-13)


### Features

* add touchstart, touchmove and touchend methods ([#9622](https://github.com/puppeteer/puppeteer/issues/9622)) ([c8bb11a](https://github.com/puppeteer/puppeteer/commit/c8bb11adfcf1537032730a91baa3c36a6e324926))
* **chromium:** roll to Chromium 111.0.5556.0 (r1095492) ([#9656](https://github.com/puppeteer/puppeteer/issues/9656)) ([df59d01](https://github.com/puppeteer/puppeteer/commit/df59d010c20644da06eb4c4e28a11c4eea164aba))


### Bug Fixes

* `page.goto` error throwing on 40x/50x responses with an empty body ([#9523](https://github.com/puppeteer/puppeteer/issues/9523)) ([#9577](https://github.com/puppeteer/puppeteer/issues/9577)) ([ddb0cc1](https://github.com/puppeteer/puppeteer/commit/ddb0cc174d2a14c0948dcdaf9bae78620937c667))

## [19.6.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.6.2...puppeteer-core-v19.6.3) (2023-02-01)


### Bug Fixes

* ignore not found contexts for console messages ([#9595](https://github.com/puppeteer/puppeteer/issues/9595)) ([390685b](https://github.com/puppeteer/puppeteer/commit/390685bbe52c22b686fc0e3119b4ac7b1073c581))
* restore WaitTask terminate  condition ([#9612](https://github.com/puppeteer/puppeteer/issues/9612)) ([e16cbc6](https://github.com/puppeteer/puppeteer/commit/e16cbc6626cffd40d0caa30801620e7293455006))

## [19.6.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.6.1...puppeteer-core-v19.6.2) (2023-01-27)


### Bug Fixes

* atomically get Puppeteer utilities ([#9597](https://github.com/puppeteer/puppeteer/issues/9597)) ([050a7b0](https://github.com/puppeteer/puppeteer/commit/050a7b062415ebaf10bcb71c405143eacc4e5d4b))

## [19.6.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.6.0...puppeteer-core-v19.6.1) (2023-01-26)


### Bug Fixes

* don't clean up previous browser versions ([#9568](https://github.com/puppeteer/puppeteer/issues/9568)) ([344bc2a](https://github.com/puppeteer/puppeteer/commit/344bc2af62e4068fe2cb8162d4b6c8242aac843b)), closes [#9533](https://github.com/puppeteer/puppeteer/issues/9533)
* mimic rejection for PuppeteerUtil on early call ([#9589](https://github.com/puppeteer/puppeteer/issues/9589)) ([1980de9](https://github.com/puppeteer/puppeteer/commit/1980de91a161523c7098a79919b20e6d8d2e5d81))
* **revert:** use LazyArg for puppeteer utilities ([#9590](https://github.com/puppeteer/puppeteer/issues/9590)) ([6edd996](https://github.com/puppeteer/puppeteer/commit/6edd99676827de2c83f7a858e4f903b1c34e7d35))
* use LazyArg for puppeteer utilities ([#9575](https://github.com/puppeteer/puppeteer/issues/9575)) ([496658f](https://github.com/puppeteer/puppeteer/commit/496658f02945b53096483f36cb3d64556cff045e))

## [19.6.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.5.2...puppeteer-core-v19.6.0) (2023-01-23)


### Features

* **chromium:** roll to Chromium 110.0.5479.0 (r1083080) ([#9500](https://github.com/puppeteer/puppeteer/issues/9500)) ([06e816b](https://github.com/puppeteer/puppeteer/commit/06e816bbfa7b9ca84284929f654de7288c51169d)), closes [#9470](https://github.com/puppeteer/puppeteer/issues/9470)
* **page:** Adding support for referrerPolicy in `page.goto` ([#9561](https://github.com/puppeteer/puppeteer/issues/9561)) ([e3d69ec](https://github.com/puppeteer/puppeteer/commit/e3d69ec554beeac37bd206a21921d2fed3cb968c))


### Bug Fixes

* firefox revision resolution should not update chrome revision ([#9507](https://github.com/puppeteer/puppeteer/issues/9507)) ([f59bbf4](https://github.com/puppeteer/puppeteer/commit/f59bbf4014644dec6f395713e8403939aebe06ea)), closes [#9461](https://github.com/puppeteer/puppeteer/issues/9461)
* improve screenshot method types ([#9529](https://github.com/puppeteer/puppeteer/issues/9529)) ([6847f88](https://github.com/puppeteer/puppeteer/commit/6847f8835f28e97edba6fce76a4cbf85561482b9))

## [19.5.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.5.1...puppeteer-core-v19.5.2) (2023-01-11)


### Bug Fixes

* make sure browser fetcher in launchers uses configuration ([#9493](https://github.com/puppeteer/puppeteer/issues/9493)) ([df55439](https://github.com/puppeteer/puppeteer/commit/df554397b51e97aea2765b325f9a887b50b9263a)), closes [#9470](https://github.com/puppeteer/puppeteer/issues/9470)

## [19.5.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.5.0...puppeteer-core-v19.5.1) (2023-01-11)


### Bug Fixes

* use puppeteer node for installation script ([#9489](https://github.com/puppeteer/puppeteer/issues/9489)) ([9bf90d9](https://github.com/puppeteer/puppeteer/commit/9bf90d9f4b5aeab06f8b433714712cad3259d36e))

## [19.5.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.4.1...puppeteer-core-v19.5.0) (2023-01-05)


### Features

* add element validation ([#9352](https://github.com/puppeteer/puppeteer/issues/9352)) ([c7a063a](https://github.com/puppeteer/puppeteer/commit/c7a063a15274856184356e15f2ae4be41191d309))


### Bug Fixes

* **puppeteer-core:** target interceptor is not async ([#9430](https://github.com/puppeteer/puppeteer/issues/9430)) ([e3e9cc6](https://github.com/puppeteer/puppeteer/commit/e3e9cc622ac32f2067b6e74b5e8706c63169a157))

## [19.4.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.4.0...puppeteer-core-v19.4.1) (2022-12-16)


### Bug Fixes

* improve a11y snapshot handling if the tree is not correct ([#9405](https://github.com/puppeteer/puppeteer/issues/9405)) ([02fe501](https://github.com/puppeteer/puppeteer/commit/02fe50194e60bd14c3a82539473a0313ab88c766)), closes [#9404](https://github.com/puppeteer/puppeteer/issues/9404)
* remove oopif expectations and fix oopif flakiness ([#9375](https://github.com/puppeteer/puppeteer/issues/9375)) ([810e0cd](https://github.com/puppeteer/puppeteer/commit/810e0cd74ecef353cfa43746c18bd5f580a3233d))

## [19.4.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.3.0...puppeteer-core-v19.4.0) (2022-12-07)


### Features

* ability to send headers via ws connection to browser in node.js environment ([#9314](https://github.com/puppeteer/puppeteer/issues/9314)) ([937fffa](https://github.com/puppeteer/puppeteer/commit/937fffaedc340ea12d5f6636d3ba6598cb22e397)), closes [#7218](https://github.com/puppeteer/puppeteer/issues/7218)
* **chromium:** roll to Chromium 109.0.5412.0 (r1069273) ([#9364](https://github.com/puppeteer/puppeteer/issues/9364)) ([1875da6](https://github.com/puppeteer/puppeteer/commit/1875da61916df1fbcf98047858c01075bd9af189)), closes [#9233](https://github.com/puppeteer/puppeteer/issues/9233)
* **puppeteer-core:** keydown supports commands ([#9357](https://github.com/puppeteer/puppeteer/issues/9357)) ([b7ebc5d](https://github.com/puppeteer/puppeteer/commit/b7ebc5d9bb9b9940ffdf470e51d007f709587d40))


### Bug Fixes

* **puppeteer-core:** avoid type instantiation errors ([#9370](https://github.com/puppeteer/puppeteer/issues/9370)) ([17f31a9](https://github.com/puppeteer/puppeteer/commit/17f31a9ee408ca5a08fe6dbceb8915e710156bd3)), closes [#9369](https://github.com/puppeteer/puppeteer/issues/9369)

## [19.3.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.2.2...puppeteer-core-v19.3.0) (2022-11-23)


### Features

* **puppeteer-core:** Infer element type from complex selector ([#9253](https://github.com/puppeteer/puppeteer/issues/9253)) ([bef1061](https://github.com/puppeteer/puppeteer/commit/bef1061c064e5135d86a48fffd7278f3e7f4a29e))
* **puppeteer-core:** update Chrome launcher flags ([#9239](https://github.com/puppeteer/puppeteer/issues/9239)) ([ae87bfc](https://github.com/puppeteer/puppeteer/commit/ae87bfc2b4361556e3660a1de2c6db348ce663ae))


### Bug Fixes

* remove boundary conditions for visibility ([#9249](https://github.com/puppeteer/puppeteer/issues/9249)) ([e003513](https://github.com/puppeteer/puppeteer/commit/e003513c0c049aad38e374a16dc96c3e54ab0de5))

## [19.2.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.2.1...puppeteer-core-v19.2.2) (2022-11-03)


### Bug Fixes

* update missing product message ([#9207](https://github.com/puppeteer/puppeteer/issues/9207)) ([29f47e2](https://github.com/puppeteer/puppeteer/commit/29f47e2e150ff7bfd89e38a4ce4ca34eac7f2fdf))

## [19.2.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.2.0...puppeteer-core-v19.2.1) (2022-10-28)


### Bug Fixes

* resolve navigation requests when request fails ([#9178](https://github.com/puppeteer/puppeteer/issues/9178)) ([c11297b](https://github.com/puppeteer/puppeteer/commit/c11297baa5124eb89f7686c3eb446d2ba1b7123a)), closes [#9175](https://github.com/puppeteer/puppeteer/issues/9175)

## [19.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.1.1...puppeteer-core-v19.2.0) (2022-10-26)


### Features

* **chromium:** roll to Chromium 108.0.5351.0 (r1056772) ([#9153](https://github.com/puppeteer/puppeteer/issues/9153)) ([e78a4e8](https://github.com/puppeteer/puppeteer/commit/e78a4e89c22bb1180e72d180c16b39673ff9125e))

## [19.1.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.1.0...puppeteer-core-v19.1.1) (2022-10-24)


### Bug Fixes

* update documentation on configuring puppeteer ([#9150](https://github.com/puppeteer/puppeteer/issues/9150)) ([f07ad2c](https://github.com/puppeteer/puppeteer/commit/f07ad2c6616ecd2a959b0c1a65b167ba77611d61))

## [19.1.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v19.0.0...puppeteer-core-v19.1.0) (2022-10-21)


### Features

* expose browser context id ([#9134](https://github.com/puppeteer/puppeteer/issues/9134)) ([122778a](https://github.com/puppeteer/puppeteer/commit/122778a1f8b60e0dcc6f0ffcb2097e95ae98f4a3)), closes [#9132](https://github.com/puppeteer/puppeteer/issues/9132)
* use configuration files ([#9140](https://github.com/puppeteer/puppeteer/issues/9140)) ([ec20174](https://github.com/puppeteer/puppeteer/commit/ec201744f077987b288e3dff52c0906fe700f6fb)), closes [#9128](https://github.com/puppeteer/puppeteer/issues/9128)


### Bug Fixes

* update `BrowserFetcher` deprecation message ([#9141](https://github.com/puppeteer/puppeteer/issues/9141)) ([efcbc97](https://github.com/puppeteer/puppeteer/commit/efcbc97c60e4cfd49a9ed25a900f6133d06b290b))

## [19.0.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v18.2.1...puppeteer-core-v19.0.0) (2022-10-14)


### ⚠ BREAKING CHANGES

* use `~/.cache/puppeteer` for browser downloads (#9095)
* deprecate `createBrowserFetcher` in favor of `BrowserFetcher` (#9079)
* refactor custom query handler API (#9078)
* remove `puppeteer.devices` in favor of `KnownDevices` (#9075)
* deprecate indirect network condition imports (#9074)
* deprecate indirect error imports (#9072)

### Features

* add ability to collect JS code coverage at the function level ([#9027](https://github.com/puppeteer/puppeteer/issues/9027)) ([a032583](https://github.com/puppeteer/puppeteer/commit/a032583b6c9b469bda699bca200b180206d61247))
* deprecate `createBrowserFetcher` in favor of `BrowserFetcher` ([#9079](https://github.com/puppeteer/puppeteer/issues/9079)) ([7294dfe](https://github.com/puppeteer/puppeteer/commit/7294dfe9c6c3b224f95ba6d59b5ef33d379fd09a)), closes [#8999](https://github.com/puppeteer/puppeteer/issues/8999)
* use `~/.cache/puppeteer` for browser downloads ([#9095](https://github.com/puppeteer/puppeteer/issues/9095)) ([3df375b](https://github.com/puppeteer/puppeteer/commit/3df375baedad64b8773bb1e1e6f81b604ed18989))


### Bug Fixes

* deprecate indirect error imports ([#9072](https://github.com/puppeteer/puppeteer/issues/9072)) ([9f4f43a](https://github.com/puppeteer/puppeteer/commit/9f4f43a28b06787a1cf97efe904ccfe7237dffdd))
* deprecate indirect network condition imports ([#9074](https://github.com/puppeteer/puppeteer/issues/9074)) ([41d0122](https://github.com/puppeteer/puppeteer/commit/41d0122b94f41b308536c48ced345dec8c272a49))
* refactor custom query handler API ([#9078](https://github.com/puppeteer/puppeteer/issues/9078)) ([1847704](https://github.com/puppeteer/puppeteer/commit/1847704789e2888c755de8c739d567364b8ad645))
* remove `puppeteer.devices` in favor of `KnownDevices` ([#9075](https://github.com/puppeteer/puppeteer/issues/9075)) ([87c08fd](https://github.com/puppeteer/puppeteer/commit/87c08fd86a79b63308ad8d46c5f7acd1927505f8))
* remove viewport conditions in `waitForSelector` ([#9087](https://github.com/puppeteer/puppeteer/issues/9087)) ([acbc599](https://github.com/puppeteer/puppeteer/commit/acbc59999bf800eeac75c4045b75a32b4357c79e))

## [18.2.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v18.2.0...puppeteer-core-v18.2.1) (2022-10-06)


### Bug Fixes

* add README to package during prepack ([#9057](https://github.com/puppeteer/puppeteer/issues/9057)) ([9374e23](https://github.com/puppeteer/puppeteer/commit/9374e23d3da5e40378461ed08db24649730a445a))
* waitForRequest works with async predicate ([#9058](https://github.com/puppeteer/puppeteer/issues/9058)) ([8f6b2c9](https://github.com/puppeteer/puppeteer/commit/8f6b2c9b7c219d405c954bf7af082d3d29fd48ff))

## [18.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-core-v18.1.0...puppeteer-core-v18.2.0) (2022-10-05)


### Features

* separate puppeteer and puppeteer-core ([#9023](https://github.com/puppeteer/puppeteer/issues/9023)) ([f42336c](https://github.com/puppeteer/puppeteer/commit/f42336cf83982332829ca7e14ee48d8676e11545))


## [18.1.0](https://github.com/puppeteer/puppeteer/compare/v18.0.5...v18.1.0) (2022-10-05)

### Features

* **chromium:** roll to Chromium 107.0.5296.0 (r1045629) ([#9039](https://github.com/puppeteer/puppeteer/issues/9039)) ([022fbde](https://github.com/puppeteer/puppeteer/commit/022fbde85e067e8c419cf42dd571f9a1187c343c))

## [18.0.5](https://github.com/puppeteer/puppeteer/compare/v18.0.4...v18.0.5) (2022-09-22)


### Bug Fixes

* add missing npm config environment variable ([#8996](https://github.com/puppeteer/puppeteer/issues/8996)) ([7c1be20](https://github.com/puppeteer/puppeteer/commit/7c1be20aef46aaf5029732a580ec65aa8008aa9c))

## [18.0.4](https://github.com/puppeteer/puppeteer/compare/v18.0.3...v18.0.4) (2022-09-21)


### Bug Fixes

* hardcode binding names ([#8993](https://github.com/puppeteer/puppeteer/issues/8993)) ([7e20554](https://github.com/puppeteer/puppeteer/commit/7e2055433e79ef20f6dcdf02f92e1d64564b7d33))

## [18.0.3](https://github.com/puppeteer/puppeteer/compare/v18.0.2...v18.0.3) (2022-09-20)


### Bug Fixes

* change injected.ts imports ([#8987](https://github.com/puppeteer/puppeteer/issues/8987)) ([10a114d](https://github.com/puppeteer/puppeteer/commit/10a114d36f2add90860950f61b3f8b93258edb5c))

## [18.0.2](https://github.com/puppeteer/puppeteer/compare/v18.0.1...v18.0.2) (2022-09-19)


### Bug Fixes

* mark internal objects ([#8984](https://github.com/puppeteer/puppeteer/issues/8984)) ([181a148](https://github.com/puppeteer/puppeteer/commit/181a148269fce1575f5e37056929ecdec0517586))

## [18.0.1](https://github.com/puppeteer/puppeteer/compare/v18.0.0...v18.0.1) (2022-09-19)


### Bug Fixes

* internal lazy params ([#8982](https://github.com/puppeteer/puppeteer/issues/8982)) ([d504597](https://github.com/puppeteer/puppeteer/commit/d5045976a6dd321bbd265b84c2474ff1ad5d0b77))

## [18.0.0](https://github.com/puppeteer/puppeteer/compare/v17.1.3...v18.0.0) (2022-09-19)


### ⚠ BREAKING CHANGES

* fix bounding box visibility conditions (#8954)

### Features

* add text query handler ([#8956](https://github.com/puppeteer/puppeteer/issues/8956)) ([633e7cf](https://github.com/puppeteer/puppeteer/commit/633e7cfdf99d42f420d0af381394bd1f6ac7bcd1))


### Bug Fixes

* fix bounding box visibility conditions ([#8954](https://github.com/puppeteer/puppeteer/issues/8954)) ([ac9929d](https://github.com/puppeteer/puppeteer/commit/ac9929d80f6f7d4905a39183ae235500e29b4f53))
* suppress init errors if the target is closed ([#8947](https://github.com/puppeteer/puppeteer/issues/8947)) ([cfaaa5e](https://github.com/puppeteer/puppeteer/commit/cfaaa5e2c07e5f98baeb7de99e303aa840a351e8))
* use win64 version of chromium when on arm64 windows ([#8927](https://github.com/puppeteer/puppeteer/issues/8927)) ([64843b8](https://github.com/puppeteer/puppeteer/commit/64843b88853210314677ab1b434729513ce615a7))

## [17.1.3](https://github.com/puppeteer/puppeteer/compare/v17.1.2...v17.1.3) (2022-09-08)


### Bug Fixes

* FirefoxLauncher should not use BrowserFetcher in puppeteer-core ([#8920](https://github.com/puppeteer/puppeteer/issues/8920)) ([f2e8de7](https://github.com/puppeteer/puppeteer/commit/f2e8de777fc5d547778fdc6cac658add84ed4082)), closes [#8919](https://github.com/puppeteer/puppeteer/issues/8919)
* linux arm64 check on windows arm ([#8917](https://github.com/puppeteer/puppeteer/issues/8917)) ([f02b926](https://github.com/puppeteer/puppeteer/commit/f02b926245e28b5671087c051dbdbb3165696f08)), closes [#8915](https://github.com/puppeteer/puppeteer/issues/8915)

## [17.1.2](https://github.com/puppeteer/puppeteer/compare/v17.1.1...v17.1.2) (2022-09-07)


### Bug Fixes

* add missing code coverage ranges that span only a single character ([#8911](https://github.com/puppeteer/puppeteer/issues/8911)) ([0c577b9](https://github.com/puppeteer/puppeteer/commit/0c577b9bf8855dc0ccb6098cd43a25c528f6d7f5))
* add Page.getDefaultTimeout getter ([#8903](https://github.com/puppeteer/puppeteer/issues/8903)) ([3240095](https://github.com/puppeteer/puppeteer/commit/32400954c50cbddc48468ad118c3f8a47653b9d3)), closes [#8901](https://github.com/puppeteer/puppeteer/issues/8901)
* don't detect project root for puppeteer-core ([#8907](https://github.com/puppeteer/puppeteer/issues/8907)) ([b4f5ea1](https://github.com/puppeteer/puppeteer/commit/b4f5ea1167a60c870194c70d22f5372ada5b7c4c)), closes [#8896](https://github.com/puppeteer/puppeteer/issues/8896)
* support scale for screenshot clips ([#8908](https://github.com/puppeteer/puppeteer/issues/8908)) ([260e428](https://github.com/puppeteer/puppeteer/commit/260e4282275ab1d05c86e5643e2a02c01f269a9c)), closes [#5329](https://github.com/puppeteer/puppeteer/issues/5329)
* work around a race in waitForFileChooser ([#8905](https://github.com/puppeteer/puppeteer/issues/8905)) ([053d960](https://github.com/puppeteer/puppeteer/commit/053d960fb593e514e7914d7da9af436afc39a12f)), closes [#6040](https://github.com/puppeteer/puppeteer/issues/6040)

## [17.1.1](https://github.com/puppeteer/puppeteer/compare/v17.1.0...v17.1.1) (2022-09-05)


### Bug Fixes

* restore deferred promise debugging ([#8895](https://github.com/puppeteer/puppeteer/issues/8895)) ([7b42250](https://github.com/puppeteer/puppeteer/commit/7b42250c7bb91ac873307acda493726ffc4c54a8))

## [17.1.0](https://github.com/puppeteer/puppeteer/compare/v17.0.0...v17.1.0) (2022-09-02)


### Features

* **chromium:** roll to Chromium 106.0.5249.0 (r1036745) ([#8869](https://github.com/puppeteer/puppeteer/issues/8869)) ([6e9a47a](https://github.com/puppeteer/puppeteer/commit/6e9a47a6faa06d241dec0bcf7bcdf49370517008))


### Bug Fixes

* allow getting a frame from an elementhandle ([#8875](https://github.com/puppeteer/puppeteer/issues/8875)) ([3732757](https://github.com/puppeteer/puppeteer/commit/3732757450b4363041ccbacc3b236289a156abb0))
* typos in documentation ([#8858](https://github.com/puppeteer/puppeteer/issues/8858)) ([8d95a9b](https://github.com/puppeteer/puppeteer/commit/8d95a9bc920b98820aa655ad4eb2d8fd9b2b893a))
* use the timeout setting in waitForFileChooser ([#8856](https://github.com/puppeteer/puppeteer/issues/8856)) ([f477b46](https://github.com/puppeteer/puppeteer/commit/f477b46f212da9206102da695697760eea539f05))

## [17.0.0](https://github.com/puppeteer/puppeteer/compare/v16.2.0...v17.0.0) (2022-08-26)


### ⚠ BREAKING CHANGES

* remove `root` from `WaitForSelectorOptions` (#8848)
* internalize execution context (#8844)

### Bug Fixes

* allow multiple navigations to happen in LifecycleWatcher ([#8826](https://github.com/puppeteer/puppeteer/issues/8826)) ([341b669](https://github.com/puppeteer/puppeteer/commit/341b669a5e45ecbb9ffb0f28c45b520660f27ad2)), closes [#8811](https://github.com/puppeteer/puppeteer/issues/8811)
* internalize execution context ([#8844](https://github.com/puppeteer/puppeteer/issues/8844)) ([2f33237](https://github.com/puppeteer/puppeteer/commit/2f33237d0443de77d58dca4454b0c9a1d2b57d03))
* remove `root` from `WaitForSelectorOptions` ([#8848](https://github.com/puppeteer/puppeteer/issues/8848)) ([1155c8e](https://github.com/puppeteer/puppeteer/commit/1155c8eac85b176c3334cc3d98adfe7d943dfbe6))
* remove deferred promise timeouts ([#8835](https://github.com/puppeteer/puppeteer/issues/8835)) ([202ffce](https://github.com/puppeteer/puppeteer/commit/202ffce0aa4f34dba35fbb8e7d740af16efee35f)), closes [#8832](https://github.com/puppeteer/puppeteer/issues/8832)

## [16.2.0](https://github.com/puppeteer/puppeteer/compare/v16.1.1...v16.2.0) (2022-08-18)


### Features

* add Khmer (Cambodian) language support ([#8809](https://github.com/puppeteer/puppeteer/issues/8809)) ([34f8737](https://github.com/puppeteer/puppeteer/commit/34f873721804d57a5faf3eab8ef50340c69ed180))


### Bug Fixes

* handle service workers in extensions ([#8807](https://github.com/puppeteer/puppeteer/issues/8807)) ([2a0eefb](https://github.com/puppeteer/puppeteer/commit/2a0eefb99f0ae00dacc9e768a253308c0d18a4c3)), closes [#8800](https://github.com/puppeteer/puppeteer/issues/8800)

## [16.1.1](https://github.com/puppeteer/puppeteer/compare/v16.1.0...v16.1.1) (2022-08-16)


### Bug Fixes

* custom sessions should not emit targetcreated events ([#8788](https://github.com/puppeteer/puppeteer/issues/8788)) ([3fad05d](https://github.com/puppeteer/puppeteer/commit/3fad05d333b79f41a7b58582c4ca493200bb5a79)), closes [#8787](https://github.com/puppeteer/puppeteer/issues/8787)
* deprecate `ExecutionContext` ([#8792](https://github.com/puppeteer/puppeteer/issues/8792)) ([b5da718](https://github.com/puppeteer/puppeteer/commit/b5da718e2e4a2004a36cf23cad555e1fc3b50333))
* deprecate `root` in `WaitForSelectorOptions` ([#8795](https://github.com/puppeteer/puppeteer/issues/8795)) ([65a5ce8](https://github.com/puppeteer/puppeteer/commit/65a5ce8464c56fcc55e5ac3ed490f31311bbe32a))
* deprecate `waitForTimeout` ([#8793](https://github.com/puppeteer/puppeteer/issues/8793)) ([8f612d5](https://github.com/puppeteer/puppeteer/commit/8f612d5ff855d48ae4b38bdaacf2a8fbda8e9ce8))
* make sure there is a check for targets when timeout=0 ([#8765](https://github.com/puppeteer/puppeteer/issues/8765)) ([c23cdb7](https://github.com/puppeteer/puppeteer/commit/c23cdb73a7b113c1dd29f7e4a7a61326422c4080)), closes [#8763](https://github.com/puppeteer/puppeteer/issues/8763)
* resolve navigation flakiness ([#8768](https://github.com/puppeteer/puppeteer/issues/8768)) ([2580347](https://github.com/puppeteer/puppeteer/commit/2580347b50091d172b2a5591138a2e41ede072fe)), closes [#8644](https://github.com/puppeteer/puppeteer/issues/8644)
* specify Puppeteer version for Chromium 105.0.5173.0 ([#8766](https://github.com/puppeteer/puppeteer/issues/8766)) ([b5064b7](https://github.com/puppeteer/puppeteer/commit/b5064b7b8bd3bd9eb481b6807c65d9d06d23b9dd))
* use targetFilter in puppeteer.launch ([#8774](https://github.com/puppeteer/puppeteer/issues/8774)) ([ee2540b](https://github.com/puppeteer/puppeteer/commit/ee2540baefeced44f6b336f2b979af5c3a4cb040)), closes [#8772](https://github.com/puppeteer/puppeteer/issues/8772)

## [16.1.0](https://github.com/puppeteer/puppeteer/compare/v16.0.0...v16.1.0) (2022-08-06)


### Features

* use an `xpath` query handler ([#8730](https://github.com/puppeteer/puppeteer/issues/8730)) ([5cf9b4d](https://github.com/puppeteer/puppeteer/commit/5cf9b4de8d50bd056db82bcaa23279b72c9313c5))


### Bug Fixes

* resolve target manager init if no existing targets detected ([#8748](https://github.com/puppeteer/puppeteer/issues/8748)) ([8cb5043](https://github.com/puppeteer/puppeteer/commit/8cb5043868f69cdff7f34f1cfe0c003ff09e281b)), closes [#8747](https://github.com/puppeteer/puppeteer/issues/8747)
* specify the target filter in setDiscoverTargets ([#8742](https://github.com/puppeteer/puppeteer/issues/8742)) ([49193cb](https://github.com/puppeteer/puppeteer/commit/49193cbf1c17f16f0ca59a9fd2ebf306f812f52b))

## [16.0.0](https://github.com/puppeteer/puppeteer/compare/v15.5.0...v16.0.0) (2022-08-02)


### ⚠ BREAKING CHANGES

* With Chromium, Puppeteer will now attach to page/iframe targets immediately to allow reliable configuration of targets.

### Features

* add Dockerfile ([#8315](https://github.com/puppeteer/puppeteer/issues/8315)) ([936ed86](https://github.com/puppeteer/puppeteer/commit/936ed8607ec0c3798d2b22b590d0be0ad361a888))
* detect Firefox in connect() automatically ([#8718](https://github.com/puppeteer/puppeteer/issues/8718)) ([2abd772](https://github.com/puppeteer/puppeteer/commit/2abd772c9c3d2b86deb71541eaac41aceef94356))
* use CDP's auto-attach mechanism ([#8520](https://github.com/puppeteer/puppeteer/issues/8520)) ([2cbfdeb](https://github.com/puppeteer/puppeteer/commit/2cbfdeb0ca388a45cedfae865266230e1291bd29))


### Bug Fixes

* address flakiness in frame handling ([#8688](https://github.com/puppeteer/puppeteer/issues/8688)) ([6f81b23](https://github.com/puppeteer/puppeteer/commit/6f81b23728a511f7b89eaa2b8f850b22d6c4ab24))
* disable AcceptCHFrame ([#8706](https://github.com/puppeteer/puppeteer/issues/8706)) ([96d9608](https://github.com/puppeteer/puppeteer/commit/96d9608d1de17877414a649a0737661894dd96c8)), closes [#8479](https://github.com/puppeteer/puppeteer/issues/8479)
* use loaderId to reduce test flakiness ([#8717](https://github.com/puppeteer/puppeteer/issues/8717)) ([d2f6db2](https://github.com/puppeteer/puppeteer/commit/d2f6db20735342bb3f419e85adbd51ed10470044))

## [15.5.0](https://github.com/puppeteer/puppeteer/compare/v15.4.2...v15.5.0) (2022-07-21)


### Features

* **chromium:** roll to Chromium 105.0.5173.0 (r1022525) ([#8682](https://github.com/puppeteer/puppeteer/issues/8682)) ([f1b8ad3](https://github.com/puppeteer/puppeteer/commit/f1b8ad3269286800d31818ea4b6b3ee23f7437c3))

## [15.4.2](https://github.com/puppeteer/puppeteer/compare/v15.4.1...v15.4.2) (2022-07-21)


### Bug Fixes

* taking a screenshot with null viewport should be possible ([#8680](https://github.com/puppeteer/puppeteer/issues/8680)) ([2abb9f0](https://github.com/puppeteer/puppeteer/commit/2abb9f0c144779d555ecbf337a759440d0282cba)), closes [#8673](https://github.com/puppeteer/puppeteer/issues/8673)

## [15.4.1](https://github.com/puppeteer/puppeteer/compare/v15.4.0...v15.4.1) (2022-07-21)


### Bug Fixes

* import URL ([#8670](https://github.com/puppeteer/puppeteer/issues/8670)) ([34ab5ca](https://github.com/puppeteer/puppeteer/commit/34ab5ca50353ffb6a6345a8984b724a6f42fb726))

## [15.4.0](https://github.com/puppeteer/puppeteer/compare/v15.3.2...v15.4.0) (2022-07-13)


### Features

* expose the page getter on Frame ([#8657](https://github.com/puppeteer/puppeteer/issues/8657)) ([af08c5c](https://github.com/puppeteer/puppeteer/commit/af08c5c90380c853e8257a51298bfed4b0635779))


### Bug Fixes

* ignore *.tsbuildinfo ([#8662](https://github.com/puppeteer/puppeteer/issues/8662)) ([edcdf21](https://github.com/puppeteer/puppeteer/commit/edcdf217cefbf31aee5a2f571abac429dd81f3a0))

## [15.3.2](https://github.com/puppeteer/puppeteer/compare/v15.3.1...v15.3.2) (2022-07-08)


### Bug Fixes

* cache dynamic imports ([#8652](https://github.com/puppeteer/puppeteer/issues/8652)) ([1de0383](https://github.com/puppeteer/puppeteer/commit/1de0383abf6be31cf06faede3e59b087a2958227))
* expose a RemoteObject getter ([#8642](https://github.com/puppeteer/puppeteer/issues/8642)) ([d0c4291](https://github.com/puppeteer/puppeteer/commit/d0c42919956bd36ad7993a0fc1de86e886e39f62)), closes [#8639](https://github.com/puppeteer/puppeteer/issues/8639)
* **page:** fix page.#scrollIntoViewIfNeeded method ([#8631](https://github.com/puppeteer/puppeteer/issues/8631)) ([b47f066](https://github.com/puppeteer/puppeteer/commit/b47f066c2c068825e3b65cfe17b6923c77ad30b9))

## [15.3.1](https://github.com/puppeteer/puppeteer/compare/v15.3.0...v15.3.1) (2022-07-06)


### Bug Fixes

* extends `ElementHandle` to `Node`s ([#8552](https://github.com/puppeteer/puppeteer/issues/8552)) ([5ff205d](https://github.com/puppeteer/puppeteer/commit/5ff205dc8b659eb8864b4b1862105d21dd334c8f))

## [15.3.0](https://github.com/puppeteer/puppeteer/compare/v15.2.0...v15.3.0) (2022-07-01)


### Features

* add documentation ([#8593](https://github.com/puppeteer/puppeteer/issues/8593)) ([066f440](https://github.com/puppeteer/puppeteer/commit/066f440ba7bdc9aca9423d7205adf36f2858bd78))


### Bug Fixes

* remove unused imports ([#8613](https://github.com/puppeteer/puppeteer/issues/8613)) ([0cf4832](https://github.com/puppeteer/puppeteer/commit/0cf4832878731ffcfc84570315f326eb851d7629))

## [15.2.0](https://github.com/puppeteer/puppeteer/compare/v15.1.1...v15.2.0) (2022-06-29)


### Features

* add fromSurface option to page.screenshot ([#8496](https://github.com/puppeteer/puppeteer/issues/8496)) ([79e1198](https://github.com/puppeteer/puppeteer/commit/79e11985ba44b72b1ad6b8cd861fe316f1945e64))
* export public types only ([#8584](https://github.com/puppeteer/puppeteer/issues/8584)) ([7001322](https://github.com/puppeteer/puppeteer/commit/7001322cd1cf9f77ee2c370d50a6707e7aaad72d))


### Bug Fixes

* clean up tmp profile dirs when browser is closed ([#8580](https://github.com/puppeteer/puppeteer/issues/8580)) ([9787a1d](https://github.com/puppeteer/puppeteer/commit/9787a1d8df7768017b36d42327faab402695c4bb))

## [15.1.1](https://github.com/puppeteer/puppeteer/compare/v15.1.0...v15.1.1) (2022-06-25)


### Bug Fixes

* export `ElementHandle` ([e0198a7](https://github.com/puppeteer/puppeteer/commit/e0198a79e06c8bb72dde554db0246a3db5fec4c2))

## [15.1.0](https://github.com/puppeteer/puppeteer/compare/v15.0.2...v15.1.0) (2022-06-24)


### Features

* **chromium:** roll to Chromium 104.0.5109.0 (r1011831) ([#8569](https://github.com/puppeteer/puppeteer/issues/8569)) ([fb7d31e](https://github.com/puppeteer/puppeteer/commit/fb7d31e3698428560e1f654d33782d241192f48f))

## [15.0.2](https://github.com/puppeteer/puppeteer/compare/v15.0.1...v15.0.2) (2022-06-24)


### Bug Fixes

* CSS coverage should work with empty stylesheets ([#8570](https://github.com/puppeteer/puppeteer/issues/8570)) ([383e855](https://github.com/puppeteer/puppeteer/commit/383e8558477fae7708734ab2160ef50f385e2983)), closes [#8535](https://github.com/puppeteer/puppeteer/issues/8535)

## [15.0.1](https://github.com/puppeteer/puppeteer/compare/v15.0.0...v15.0.1) (2022-06-24)


### Bug Fixes

* infer unioned handles ([#8562](https://github.com/puppeteer/puppeteer/issues/8562)) ([8100cbb](https://github.com/puppeteer/puppeteer/commit/8100cbb29569541541f61001983efb9a80d89890))

## [15.0.0](https://github.com/puppeteer/puppeteer/compare/v14.4.1...v15.0.0) (2022-06-23)


### ⚠ BREAKING CHANGES

* type inference for evaluation types (#8547)

### Features

* add experimental `client` to `HTTPRequest` ([#8556](https://github.com/puppeteer/puppeteer/issues/8556)) ([ec79f3a](https://github.com/puppeteer/puppeteer/commit/ec79f3a58a44c9ea60a82f9cd2df4c8f19e82ab8))
* type inference for evaluation types ([#8547](https://github.com/puppeteer/puppeteer/issues/8547)) ([26c3acb](https://github.com/puppeteer/puppeteer/commit/26c3acbb0795eb66f29479f442e156832f794f01))

## [14.4.1](https://github.com/puppeteer/puppeteer/compare/v14.4.0...v14.4.1) (2022-06-17)


### Bug Fixes

* avoid `instanceof Object` check in `isErrorLike` ([#8527](https://github.com/puppeteer/puppeteer/issues/8527)) ([6cd5cd0](https://github.com/puppeteer/puppeteer/commit/6cd5cd043997699edca6e3458f90adc1118cf4a5))
* export `devices`, `errors`, and more ([cba58a1](https://github.com/puppeteer/puppeteer/commit/cba58a12c4e2043f6a5acf7d4754e4a7b7f6e198))

## [14.4.0](https://github.com/puppeteer/puppeteer/compare/v14.3.0...v14.4.0) (2022-06-13)


### Features

* export puppeteer methods ([#8493](https://github.com/puppeteer/puppeteer/issues/8493)) ([465a7c4](https://github.com/puppeteer/puppeteer/commit/465a7c405f01fcef99380ffa69d86042a1f5618f))
* support node-like environments ([#8490](https://github.com/puppeteer/puppeteer/issues/8490)) ([f64ec20](https://github.com/puppeteer/puppeteer/commit/f64ec2051b9b2d12225abba6ffe9551da9751bf7))


### Bug Fixes

* parse empty options in \<select\> ([#8489](https://github.com/puppeteer/puppeteer/issues/8489)) ([b30f3f4](https://github.com/puppeteer/puppeteer/commit/b30f3f44cdabd9545c4661cd755b9d49e5c144cd))
* use error-like ([#8504](https://github.com/puppeteer/puppeteer/issues/8504)) ([4d35990](https://github.com/puppeteer/puppeteer/commit/4d359906a44e4ddd5ec54a523cfd9076048d3433))
* use OS-independent abs. path check ([#8505](https://github.com/puppeteer/puppeteer/issues/8505)) ([bfd4e68](https://github.com/puppeteer/puppeteer/commit/bfd4e68f25bec6e00fd5cbf261813f8297d362ee))

## [14.3.0](https://github.com/puppeteer/puppeteer/compare/v14.2.1...v14.3.0) (2022-06-07)


### Features

* use absolute URL for EVALUATION_SCRIPT_URL ([#8481](https://github.com/puppeteer/puppeteer/issues/8481)) ([e142560](https://github.com/puppeteer/puppeteer/commit/e14256010d2d84d613cd3c6e7999b0705115d4bf)), closes [#8424](https://github.com/puppeteer/puppeteer/issues/8424)


### Bug Fixes

* don't throw on bad access ([#8472](https://github.com/puppeteer/puppeteer/issues/8472)) ([e837866](https://github.com/puppeteer/puppeteer/commit/e8378666c671e5703aec4f52912de2aac94e1828))
* Kill browser process when killing process group fails ([#8477](https://github.com/puppeteer/puppeteer/issues/8477)) ([7dc8e37](https://github.com/puppeteer/puppeteer/commit/7dc8e37a23d025bb2c31efb9c060c7f6e00179b4))
* only lookup `localhost` for DNS lookups ([1b025b4](https://github.com/puppeteer/puppeteer/commit/1b025b4c8466fe64da0fa2050eaa02b7764770b1))
* robustly check for launch executable ([#8468](https://github.com/puppeteer/puppeteer/issues/8468)) ([b54dc55](https://github.com/puppeteer/puppeteer/commit/b54dc55f7622ee2b75afd3bd9fe118dd2f144f40))

## [14.2.1](https://github.com/puppeteer/puppeteer/compare/v14.2.0...v14.2.1) (2022-06-02)


### Bug Fixes

* use isPageTargetCallback in Browser::pages() ([#8460](https://github.com/puppeteer/puppeteer/issues/8460)) ([5c9050a](https://github.com/puppeteer/puppeteer/commit/5c9050aea0fe8d57114130fe38bd33ed2b4955d6))

## [14.2.0](https://github.com/puppeteer/puppeteer/compare/v14.1.2...v14.2.0) (2022-06-01)


### Features

* **chromium:** roll to Chromium 103.0.5059.0 (r1002410) ([#8410](https://github.com/puppeteer/puppeteer/issues/8410)) ([54efc2c](https://github.com/puppeteer/puppeteer/commit/54efc2c949be1d6ef22f4d2630620e33d14d2597))
* support node 18 ([#8447](https://github.com/puppeteer/puppeteer/issues/8447)) ([f2d8276](https://github.com/puppeteer/puppeteer/commit/f2d8276d6e745a7547b8ce54c3f50934bb70de0b))
* use strict typescript ([#8401](https://github.com/puppeteer/puppeteer/issues/8401)) ([b4e751f](https://github.com/puppeteer/puppeteer/commit/b4e751f29cb6fd4c3cc41fe702de83721f0eb6dc))


### Bug Fixes

* multiple same request event listener ([#8404](https://github.com/puppeteer/puppeteer/issues/8404)) ([9211015](https://github.com/puppeteer/puppeteer/commit/92110151d9a33f26abc07bc805f4f2f3943697a0))
* NodeNext incompatibility in package.json ([#8445](https://github.com/puppeteer/puppeteer/issues/8445)) ([c4898a7](https://github.com/puppeteer/puppeteer/commit/c4898a7a2e69681baac55366848da6688f0d8790))
* process documentation during publishing ([#8433](https://github.com/puppeteer/puppeteer/issues/8433)) ([d111d19](https://github.com/puppeteer/puppeteer/commit/d111d19f788d88d984dcf4ad7542f59acd2f4c1e))

## [14.1.2](https://github.com/puppeteer/puppeteer/compare/v14.1.1...v14.1.2) (2022-05-30)


### Bug Fixes

* do not use loaderId for lifecycle events ([#8395](https://github.com/puppeteer/puppeteer/issues/8395)) ([c96c915](https://github.com/puppeteer/puppeteer/commit/c96c915b535dcf414038677bd3d3ed6b980a4901))
* fix release-please bot ([#8400](https://github.com/puppeteer/puppeteer/issues/8400)) ([5c235c7](https://github.com/puppeteer/puppeteer/commit/5c235c701fc55380f09d09ac2cf63f2c94b60e3d))
* use strict TS in Input.ts ([#8392](https://github.com/puppeteer/puppeteer/issues/8392)) ([af92a24](https://github.com/puppeteer/puppeteer/commit/af92a24ba9fc8efea1ba41f96d87515cf760da65))

### [14.1.1](https://github.com/puppeteer/puppeteer/compare/v14.1.0...v14.1.1) (2022-05-19)


### Bug Fixes

* kill browser process when 'taskkill' fails on Windows ([#8352](https://github.com/puppeteer/puppeteer/issues/8352)) ([dccfadb](https://github.com/puppeteer/puppeteer/commit/dccfadb90e8947cae3f33d7a209b6f5752f97b46))
* only check loading iframe in lifecycling ([#8348](https://github.com/puppeteer/puppeteer/issues/8348)) ([7438030](https://github.com/puppeteer/puppeteer/commit/74380303ac6cc6e2d84948a10920d56e665ccebe))
* recompile before funit and unit commands ([#8363](https://github.com/puppeteer/puppeteer/issues/8363)) ([8735b78](https://github.com/puppeteer/puppeteer/commit/8735b784ba7838c1002b521a7f9f23bb27263d03)), closes [#8362](https://github.com/puppeteer/puppeteer/issues/8362)

## [14.1.0](https://github.com/puppeteer/puppeteer/compare/v14.0.0...v14.1.0) (2022-05-13)


### Features

* add waitForXPath to ElementHandle ([#8329](https://github.com/puppeteer/puppeteer/issues/8329)) ([7eaadaf](https://github.com/puppeteer/puppeteer/commit/7eaadafe197279a7d1753e7274d2e24dfc11abdf))
* allow handling other targets as pages internally ([#8336](https://github.com/puppeteer/puppeteer/issues/8336)) ([3b66a2c](https://github.com/puppeteer/puppeteer/commit/3b66a2c47ee36785a6a72c9afedd768fab3d040a))


### Bug Fixes

* disable AvoidUnnecessaryBeforeUnloadCheckSync to fix navigations ([#8330](https://github.com/puppeteer/puppeteer/issues/8330)) ([4854ad5](https://github.com/puppeteer/puppeteer/commit/4854ad5b15c9bdf93c06dcb758393e7cbacd7469))
* If currentNode and root are the same, do not include them in the result ([#8332](https://github.com/puppeteer/puppeteer/issues/8332)) ([a61144d](https://github.com/puppeteer/puppeteer/commit/a61144d43780b5c32197427d7682b9b6c433f2bb))

## [14.0.0](https://github.com/puppeteer/puppeteer/compare/v13.7.0...v14.0.0) (2022-05-09)


### ⚠ BREAKING CHANGES

* strict mode fixes for HTTPRequest/Response classes (#8297)
* Node 12 is no longer supported.

### Features

* add support for Apple Silicon chromium builds ([#7546](https://github.com/puppeteer/puppeteer/issues/7546)) ([baa017d](https://github.com/puppeteer/puppeteer/commit/baa017db92b1fecf2e3584d5b3161371ae60f55b)), closes [#6622](https://github.com/puppeteer/puppeteer/issues/6622)
* **chromium:** roll to Chromium 102.0.5002.0 (r991974) ([#8319](https://github.com/puppeteer/puppeteer/issues/8319)) ([be4c930](https://github.com/puppeteer/puppeteer/commit/be4c930c60164f681a966d0f8cb745f6c263fe2b))
* support ES modules ([#8306](https://github.com/puppeteer/puppeteer/issues/8306)) ([6841bd6](https://github.com/puppeteer/puppeteer/commit/6841bd68d85e3b3952c5e7ce454ac4d23f84262d))


### Bug Fixes

* apparent typo SUPPORTER_PLATFORMS ([#8294](https://github.com/puppeteer/puppeteer/issues/8294)) ([e09287f](https://github.com/puppeteer/puppeteer/commit/e09287f4e9a1ff3c637dd165d65f221394970e2c))
* make sure inner OOPIFs can be attached to ([#8304](https://github.com/puppeteer/puppeteer/issues/8304)) ([5539598](https://github.com/puppeteer/puppeteer/commit/553959884f4edb4deab760fa8ca38fc1c85c05c5))
* strict mode fixes for HTTPRequest/Response classes ([#8297](https://github.com/puppeteer/puppeteer/issues/8297)) ([2804ae8](https://github.com/puppeteer/puppeteer/commit/2804ae8cdbc4c90bf942510bce656275a2d409e1)), closes [#6769](https://github.com/puppeteer/puppeteer/issues/6769)
* tests failing in headful ([#8273](https://github.com/puppeteer/puppeteer/issues/8273)) ([e841d7f](https://github.com/puppeteer/puppeteer/commit/e841d7f9f3f407c02dbc48e107b545b91db104e6))


* drop Node 12 support ([#8299](https://github.com/puppeteer/puppeteer/issues/8299)) ([274bd6b](https://github.com/puppeteer/puppeteer/commit/274bd6b3b98c305ed014909d8053e4c54187971b))

## [13.7.0](https://github.com/puppeteer/puppeteer/compare/v13.6.0...v13.7.0) (2022-04-28)


### Features

* add `back` and `forward` mouse buttons ([#8284](https://github.com/puppeteer/puppeteer/issues/8284)) ([7a51bff](https://github.com/puppeteer/puppeteer/commit/7a51bff47f6436fc29d0df7eb74f12f69102ca5b))
* support chrome headless mode ([#8260](https://github.com/puppeteer/puppeteer/issues/8260)) ([1308d9a](https://github.com/puppeteer/puppeteer/commit/1308d9aa6a5920b20da02dca8db03c63e43c8b84))


### Bug Fixes

* doc typo ([#8263](https://github.com/puppeteer/puppeteer/issues/8263)) ([952a2ae](https://github.com/puppeteer/puppeteer/commit/952a2ae0bc4f059f8e8b4d1de809d0a486a74551))
* use different test names for browser specific tests in launcher.spec.ts ([#8250](https://github.com/puppeteer/puppeteer/issues/8250)) ([c6cf1a9](https://github.com/puppeteer/puppeteer/commit/c6cf1a9f27621c8a619cfbdc9d0821541768ac94))

## [13.6.0](https://github.com/puppeteer/puppeteer/compare/v13.5.2...v13.6.0) (2022-04-19)


### Features

* **chromium:** roll to Chromium 101.0.4950.0 (r982053) ([#8213](https://github.com/puppeteer/puppeteer/issues/8213)) ([ec74bd8](https://github.com/puppeteer/puppeteer/commit/ec74bd811d9b7fbaf600068e86f13a63d7b0bc6f))
* respond multiple headers with same key ([#8183](https://github.com/puppeteer/puppeteer/issues/8183)) ([c1dcd85](https://github.com/puppeteer/puppeteer/commit/c1dcd857e3bc17769f02474a41bbedee01f471dc))


### Bug Fixes

* also kill Firefox when temporary profile is used ([#8233](https://github.com/puppeteer/puppeteer/issues/8233)) ([b6504d7](https://github.com/puppeteer/puppeteer/commit/b6504d7186336a2fc0b41c3878c843b7409ba5fb))
* consider existing frames when waiting for a frame ([#8200](https://github.com/puppeteer/puppeteer/issues/8200)) ([0955225](https://github.com/puppeteer/puppeteer/commit/0955225b51421663288523a3dfb63103b51775b4))
* disable bfcache in the launcher ([#8196](https://github.com/puppeteer/puppeteer/issues/8196)) ([9ac7318](https://github.com/puppeteer/puppeteer/commit/9ac7318506ac858b3465e9b4ede8ad75fbbcee11)), closes [#8182](https://github.com/puppeteer/puppeteer/issues/8182)
* enable page.spec event handler test for firefox ([#8214](https://github.com/puppeteer/puppeteer/issues/8214)) ([2b45027](https://github.com/puppeteer/puppeteer/commit/2b45027d256f85f21a0c824183696b237e00ad33))
* forget queuedEventGroup when emitting response in responseReceivedExtraInfo ([#8234](https://github.com/puppeteer/puppeteer/issues/8234)) ([#8239](https://github.com/puppeteer/puppeteer/issues/8239)) ([91a8e73](https://github.com/puppeteer/puppeteer/commit/91a8e73b1196e4128b1e7c25e08080f2faaf3cf7))
* forget request will be sent from the _requestWillBeSentMap list. ([#8226](https://github.com/puppeteer/puppeteer/issues/8226)) ([4b786c9](https://github.com/puppeteer/puppeteer/commit/4b786c904cbfe3f059322292f3b788b8a5ebd9bf))
* ignore favicon requests in page.spec event handler tests ([#8208](https://github.com/puppeteer/puppeteer/issues/8208)) ([04e5c88](https://github.com/puppeteer/puppeteer/commit/04e5c889973432c6163a8539cdec23c0e8726bff))
* **network.spec.ts:** typo in the word should ([#8223](https://github.com/puppeteer/puppeteer/issues/8223)) ([e93faad](https://github.com/puppeteer/puppeteer/commit/e93faadc21b7fcb1e03b69c451c28b769f9cde51))

### [13.5.2](https://github.com/puppeteer/puppeteer/compare/v13.5.1...v13.5.2) (2022-03-31)


### Bug Fixes

* chromium downloading hung at 99% ([#8169](https://github.com/puppeteer/puppeteer/issues/8169)) ([8f13470](https://github.com/puppeteer/puppeteer/commit/8f13470af06045857f32496f03e77b14f3ecff98))
* get extra headers from Fetch.requestPaused event ([#8162](https://github.com/puppeteer/puppeteer/issues/8162)) ([37ede68](https://github.com/puppeteer/puppeteer/commit/37ede6877017a8dc6c946a3dff4ec6d79c3ebc59))

### [13.5.1](https://github.com/puppeteer/puppeteer/compare/v13.5.0...v13.5.1) (2022-03-09)


### Bug Fixes

* waitForNavigation in OOPIFs ([#8117](https://github.com/puppeteer/puppeteer/issues/8117)) ([34775e5](https://github.com/puppeteer/puppeteer/commit/34775e58316be49d8bc5a13209a1f570bc66b448))

## [13.5.0](https://github.com/puppeteer/puppeteer/compare/v13.4.1...v13.5.0) (2022-03-07)


### Features

* **chromium:** roll to Chromium 100.0.4889.0 (r970485) ([#8108](https://github.com/puppeteer/puppeteer/issues/8108)) ([d12f427](https://github.com/puppeteer/puppeteer/commit/d12f42754f7013b5ec0a2198cf2d9cf945d3cb38))


### Bug Fixes

* Inherit browser-level proxy settings from incognito context ([#7770](https://github.com/puppeteer/puppeteer/issues/7770)) ([3feca32](https://github.com/puppeteer/puppeteer/commit/3feca325a9472ee36f7e866ebe375c7f083e0e36))
* **page:** page.createIsolatedWorld error catching has been added ([#7848](https://github.com/puppeteer/puppeteer/issues/7848)) ([309e8b8](https://github.com/puppeteer/puppeteer/commit/309e8b80da0519327bc37b44a3ebb6f2e2d357a7))
* **tests:** ensure all tests honour BINARY envvar ([#8092](https://github.com/puppeteer/puppeteer/issues/8092)) ([3b8b9ad](https://github.com/puppeteer/puppeteer/commit/3b8b9adde5d18892af96329b6f9303979f9c04f5))

### [13.4.1](https://github.com/puppeteer/puppeteer/compare/v13.4.0...v13.4.1) (2022-03-01)


### Bug Fixes

* regression in --user-data-dir handling ([#8060](https://github.com/puppeteer/puppeteer/issues/8060)) ([85decdc](https://github.com/puppeteer/puppeteer/commit/85decdc28d7d2128e6d2946a72f4d99dd5dbb48a))

## [13.4.0](https://github.com/puppeteer/puppeteer/compare/v13.3.2...v13.4.0) (2022-02-22)


### Features

* add support for async waitForTarget ([#7885](https://github.com/puppeteer/puppeteer/issues/7885)) ([dbf0639](https://github.com/puppeteer/puppeteer/commit/dbf0639822d0b2736993de52c0bfe1dbf4e58f25))
* export `Frame._client` through getter ([#8041](https://github.com/puppeteer/puppeteer/issues/8041)) ([e9278fc](https://github.com/puppeteer/puppeteer/commit/e9278fcfcffe2558de63ce7542483445bcb6e74f))
* **HTTPResponse:** expose timing information ([#8025](https://github.com/puppeteer/puppeteer/issues/8025)) ([30b3d49](https://github.com/puppeteer/puppeteer/commit/30b3d49b0de46d812b7485e708174a07c73dbdd0))


### Bug Fixes

* change kill to signal the whole process group to terminate  ([#6859](https://github.com/puppeteer/puppeteer/issues/6859)) ([0eb9c78](https://github.com/puppeteer/puppeteer/commit/0eb9c7861717ebba7012c03e76b7a46063e4e5dd))
* element screenshot issue in headful mode ([#8018](https://github.com/puppeteer/puppeteer/issues/8018)) ([5346e70](https://github.com/puppeteer/puppeteer/commit/5346e70ffc15b33c1949657cf1b465f1acc5d84d)), closes [#7999](https://github.com/puppeteer/puppeteer/issues/7999)
* ensure dom binding is not called after detach ([#8024](https://github.com/puppeteer/puppeteer/issues/8024)) ([5c308b0](https://github.com/puppeteer/puppeteer/commit/5c308b0704123736ddb085f97596c201ea18cf4a)), closes [#7814](https://github.com/puppeteer/puppeteer/issues/7814)
* use both __dirname and require.resolve to support different bundlers ([#8046](https://github.com/puppeteer/puppeteer/issues/8046)) ([e6a6295](https://github.com/puppeteer/puppeteer/commit/e6a6295d9a7480bb59ee58a2cc7785171fa0fa2c)), closes [#8044](https://github.com/puppeteer/puppeteer/issues/8044)

### [13.3.2](https://github.com/puppeteer/puppeteer/compare/v13.3.1...v13.3.2) (2022-02-14)


### Bug Fixes

* always use ENV executable path when present ([#7985](https://github.com/puppeteer/puppeteer/issues/7985)) ([6d6ea9b](https://github.com/puppeteer/puppeteer/commit/6d6ea9bf59daa3fb851b3da8baa27887e0aa2c28))
* use require.resolve instead of __dirname ([#8003](https://github.com/puppeteer/puppeteer/issues/8003)) ([bbb186d](https://github.com/puppeteer/puppeteer/commit/bbb186d88cb99e4914299c983c822fa41a80f356))

### [13.3.1](https://github.com/puppeteer/puppeteer/compare/v13.3.0...v13.3.1) (2022-02-10)


### Bug Fixes

* **puppeteer:** revert: esm modules ([#7986](https://github.com/puppeteer/puppeteer/issues/7986)) ([179eded](https://github.com/puppeteer/puppeteer/commit/179ededa1400c35c1f2edc015548e0f2a1bcee14))

## [13.3.0](https://github.com/puppeteer/puppeteer/compare/v13.2.0...v13.3.0) (2022-02-09)


### Features

* **puppeteer:** export esm modules in package.json ([#7964](https://github.com/puppeteer/puppeteer/issues/7964)) ([523b487](https://github.com/puppeteer/puppeteer/commit/523b487e8802824cecff86d256b4f7dbc4c47c8a))

## [13.2.0](https://github.com/puppeteer/puppeteer/compare/v13.1.3...v13.2.0) (2022-02-07)


### Features

* add more models to DeviceDescriptors ([#7904](https://github.com/puppeteer/puppeteer/issues/7904)) ([6a655cb](https://github.com/puppeteer/puppeteer/commit/6a655cb647e12eaf1055be0b298908d83bebac25))
* **chromium:** roll to Chromium 99.0.4844.16 (r961656) ([#7960](https://github.com/puppeteer/puppeteer/issues/7960)) ([96c3f94](https://github.com/puppeteer/puppeteer/commit/96c3f943b2f6e26bd871ecfcce71b6a33e214ebf))


### Bug Fixes

* make projectRoot optional in Puppeteer and launchers ([#7967](https://github.com/puppeteer/puppeteer/issues/7967)) ([9afdc63](https://github.com/puppeteer/puppeteer/commit/9afdc6300b80f01091dc4cb42d4ebe952c7d60f0))
* migrate more files to strict-mode TypeScript ([#7950](https://github.com/puppeteer/puppeteer/issues/7950)) ([aaac8d9](https://github.com/puppeteer/puppeteer/commit/aaac8d9c44327a2c503ffd6c97b7f21e8010c3e4))
* typos in documentation ([#7968](https://github.com/puppeteer/puppeteer/issues/7968)) ([41ab4e9](https://github.com/puppeteer/puppeteer/commit/41ab4e9127df64baa6c43ecde2f7ddd702ba7b0c))

### [13.1.3](https://github.com/puppeteer/puppeteer/compare/v13.1.2...v13.1.3) (2022-01-31)


### Bug Fixes

* issue with reading versions.js in doclint ([#7940](https://github.com/puppeteer/puppeteer/issues/7940)) ([06ba963](https://github.com/puppeteer/puppeteer/commit/06ba9632a4c63859244068d32c312817d90daf63))
* make more files work in strict-mode TypeScript ([#7936](https://github.com/puppeteer/puppeteer/issues/7936)) ([0636513](https://github.com/puppeteer/puppeteer/commit/0636513e34046f4d40b5e88beb2b18b16dab80aa))
* page.pdf producing an invalid pdf ([#7868](https://github.com/puppeteer/puppeteer/issues/7868)) ([afea509](https://github.com/puppeteer/puppeteer/commit/afea509544fb99bfffe5b0bebe6f3575c53802f0)), closes [#7757](https://github.com/puppeteer/puppeteer/issues/7757)

### [13.1.2](https://github.com/puppeteer/puppeteer/compare/v13.1.1...v13.1.2) (2022-01-25)


### Bug Fixes

* **package.json:** update node-fetch package ([#7924](https://github.com/puppeteer/puppeteer/issues/7924)) ([e4c48d3](https://github.com/puppeteer/puppeteer/commit/e4c48d3b8c2a812752094ed8163e4f2f32c4b6cb))
* types in Browser.ts to be compatible with strict mode Typescript ([#7918](https://github.com/puppeteer/puppeteer/issues/7918)) ([a8ec0aa](https://github.com/puppeteer/puppeteer/commit/a8ec0aadc9c90d224d568d9e418d14261e6e85b1)), closes [#6769](https://github.com/puppeteer/puppeteer/issues/6769)
* types in Connection.ts to be compatible with strict mode Typescript ([#7919](https://github.com/puppeteer/puppeteer/issues/7919)) ([d80d602](https://github.com/puppeteer/puppeteer/commit/d80d6027ea8e1b7fcdaf045398629cf8e6512658)), closes [#6769](https://github.com/puppeteer/puppeteer/issues/6769)

### [13.1.1](https://github.com/puppeteer/puppeteer/compare/v13.1.0...v13.1.1) (2022-01-18)


### Bug Fixes

* use content box for OOPIF offset calculations ([#7911](https://github.com/puppeteer/puppeteer/issues/7911)) ([344feb5](https://github.com/puppeteer/puppeteer/commit/344feb53c28ce018a4c600d408468f6d9d741eee))

## [13.1.0](https://github.com/puppeteer/puppeteer/compare/v13.0.1...v13.1.0) (2022-01-17)


### Features

* **chromium:** roll to Chromium 98.0.4758.0 (r950341) ([#7907](https://github.com/puppeteer/puppeteer/issues/7907)) ([a55c86f](https://github.com/puppeteer/puppeteer/commit/a55c86fac504b5e89ba23735fb3a1b1d54a4e1e5))


### Bug Fixes

* apply OOPIF offsets to bounding box and box model calls ([#7906](https://github.com/puppeteer/puppeteer/issues/7906)) ([a566263](https://github.com/puppeteer/puppeteer/commit/a566263ba28e58ff648bffbdb628606f75d5876f))
* correctly compute clickable points for elements inside OOPIFs ([#7900](https://github.com/puppeteer/puppeteer/issues/7900)) ([486bbe0](https://github.com/puppeteer/puppeteer/commit/486bbe010d5ee5c446d9e8daf61a080232379c3f)), closes [#7849](https://github.com/puppeteer/puppeteer/issues/7849)
* error for pre-existing OOPIFs ([#7899](https://github.com/puppeteer/puppeteer/issues/7899)) ([d7937b8](https://github.com/puppeteer/puppeteer/commit/d7937b806d331bf16c2016aaf16e932b1334eac8)), closes [#7844](https://github.com/puppeteer/puppeteer/issues/7844) [#7896](https://github.com/puppeteer/puppeteer/issues/7896)

### [13.0.1](https://github.com/puppeteer/puppeteer/compare/v13.0.0...v13.0.1) (2021-12-22)


### Bug Fixes

* disable a test failing on Firefox ([#7846](https://github.com/puppeteer/puppeteer/issues/7846)) ([36207c5](https://github.com/puppeteer/puppeteer/commit/36207c5efe8ca21f4b3fc5b00212700326a701d2))
* make sure ElementHandle.waitForSelector is evaluated in the right context ([#7843](https://github.com/puppeteer/puppeteer/issues/7843)) ([8d8e874](https://github.com/puppeteer/puppeteer/commit/8d8e874b072b17fc763f33d08e51c046b7435244))
* predicate arguments for waitForFunction ([#7845](https://github.com/puppeteer/puppeteer/issues/7845)) ([1c44551](https://github.com/puppeteer/puppeteer/commit/1c44551f1b5bb19455b4a1eb7061715717ec880e)), closes [#7836](https://github.com/puppeteer/puppeteer/issues/7836)

## [13.0.0](https://github.com/puppeteer/puppeteer/compare/v12.0.1...v13.0.0) (2021-12-10)


### ⚠ BREAKING CHANGES

* typo in 'already-handled' constant of the request interception API (#7813)

### Features

* expose HTTPRequest intercept resolution state and clarify docs ([#7796](https://github.com/puppeteer/puppeteer/issues/7796)) ([dc23b75](https://github.com/puppeteer/puppeteer/commit/dc23b7535cb958c00d1eecfe85b4ee26e52e2e39))
* implement Element.waitForSelector ([#7825](https://github.com/puppeteer/puppeteer/issues/7825)) ([c034294](https://github.com/puppeteer/puppeteer/commit/c03429444d05b39549489ad3da67d93b2be59f51))


### Bug Fixes

* handle multiple/duplicate Fetch.requestPaused events ([#7802](https://github.com/puppeteer/puppeteer/issues/7802)) ([636b086](https://github.com/puppeteer/puppeteer/commit/636b0863a169da132e333eb53b17eb2601daabe6)), closes [#7475](https://github.com/puppeteer/puppeteer/issues/7475) [#6696](https://github.com/puppeteer/puppeteer/issues/6696) [#7225](https://github.com/puppeteer/puppeteer/issues/7225)
* revert "feat(typescript): allow using puppeteer without dom lib" ([02c9af6](https://github.com/puppeteer/puppeteer/commit/02c9af62d64060a83f53368640f343ae2e30e38a)), closes [#6998](https://github.com/puppeteer/puppeteer/issues/6998)
* typo in 'already-handled' constant of the request interception API ([#7813](https://github.com/puppeteer/puppeteer/issues/7813)) ([8242422](https://github.com/puppeteer/puppeteer/commit/824242246de9e158aacb85f71350a79cb386ed92)), closes [#7745](https://github.com/puppeteer/puppeteer/issues/7745) [#7747](https://github.com/puppeteer/puppeteer/issues/7747) [#7780](https://github.com/puppeteer/puppeteer/issues/7780)

### [12.0.1](https://github.com/puppeteer/puppeteer/compare/v12.0.0...v12.0.1) (2021-11-29)


### Bug Fixes

* handle extraInfo events even if event.hasExtraInfo === false ([#7808](https://github.com/puppeteer/puppeteer/issues/7808)) ([6ee2feb](https://github.com/puppeteer/puppeteer/commit/6ee2feb1eafdd399f0af50cdc4517f21bcb55121)), closes [#7805](https://github.com/puppeteer/puppeteer/issues/7805)

## [12.0.0](https://github.com/puppeteer/puppeteer/compare/v11.0.0...v12.0.0) (2021-11-26)


### ⚠ BREAKING CHANGES

* **chromium:** roll to Chromium 97.0.4692.0 (r938248)

### Features

* **chromium:** roll to Chromium 97.0.4692.0 (r938248) ([ac162c5](https://github.com/puppeteer/puppeteer/commit/ac162c561ee43dd69eff38e1b354a41bb42c9eba)), closes [#7458](https://github.com/puppeteer/puppeteer/issues/7458)
* support for custom user data (profile) directory for Firefox ([#7684](https://github.com/puppeteer/puppeteer/issues/7684)) ([790c7a0](https://github.com/puppeteer/puppeteer/commit/790c7a0eb92291efebaa37e80c72f5cb5f46bbdb))


### Bug Fixes

* **ariaqueryhandler:** allow single quotes in aria attribute selector ([#7750](https://github.com/puppeteer/puppeteer/issues/7750)) ([b0319ec](https://github.com/puppeteer/puppeteer/commit/b0319ecc89f8ea3d31ab9aee5e1cd33d2a4e62be)), closes [#7721](https://github.com/puppeteer/puppeteer/issues/7721)
* clearer jsdoc for behavior of `headless` when `devtools` is true ([#7748](https://github.com/puppeteer/puppeteer/issues/7748)) ([9f9b4ed](https://github.com/puppeteer/puppeteer/commit/9f9b4ed72ab0bb43d002a0024122d6f5eab231aa))
* null check for frame in FrameManager ([#7773](https://github.com/puppeteer/puppeteer/issues/7773)) ([23ee295](https://github.com/puppeteer/puppeteer/commit/23ee295f348d114617f2a86d0bb792936f413ac5)), closes [#7749](https://github.com/puppeteer/puppeteer/issues/7749)
* only kill the process when there is no browser instance available ([#7762](https://github.com/puppeteer/puppeteer/issues/7762)) ([51e6169](https://github.com/puppeteer/puppeteer/commit/51e61696c1c20cc09bd4fc068ae1dfa259c41745)), closes [#7668](https://github.com/puppeteer/puppeteer/issues/7668)
* parse statusText from the extraInfo event ([#7798](https://github.com/puppeteer/puppeteer/issues/7798)) ([a26b12b](https://github.com/puppeteer/puppeteer/commit/a26b12b7c775c36271cd4c98e39bbd59f4356320)), closes [#7458](https://github.com/puppeteer/puppeteer/issues/7458)
* try to remove the temporary user data directory after the process has been killed ([#7761](https://github.com/puppeteer/puppeteer/issues/7761)) ([fc94a28](https://github.com/puppeteer/puppeteer/commit/fc94a28778cfdb3cb8bcd882af3ebcdacf85c94e))

## [11.0.0](https://github.com/puppeteer/puppeteer/compare/v10.4.0...v11.0.0) (2021-11-02)


### ⚠ BREAKING CHANGES

* **oop iframes:** integrate OOP iframes with the frame manager (#7556)

### Features

* improve error message for response.buffer() ([#7669](https://github.com/puppeteer/puppeteer/issues/7669)) ([03c9ecc](https://github.com/puppeteer/puppeteer/commit/03c9ecca400a02684cd60229550dbad1190a5b6e))
* **oop iframes:** integrate OOP iframes with the frame manager ([#7556](https://github.com/puppeteer/puppeteer/issues/7556)) ([4d9dc8c](https://github.com/puppeteer/puppeteer/commit/4d9dc8c0e613f22d4cdf237e8bd0b0da3c588edb)), closes [#2548](https://github.com/puppeteer/puppeteer/issues/2548)
* add custom debugging port option ([#4993](https://github.com/puppeteer/puppeteer/issues/4993)) ([26145e9](https://github.com/puppeteer/puppeteer/commit/26145e9a24af7caed6ece61031f2cafa6abd505f))
* add initiator to HTTPRequest ([#7614](https://github.com/puppeteer/puppeteer/issues/7614)) ([a271145](https://github.com/puppeteer/puppeteer/commit/a271145b0663ef9de1903dd0eb9fd5366465bed7))
* allow to customize tmpdir ([#7243](https://github.com/puppeteer/puppeteer/issues/7243)) ([b1f6e86](https://github.com/puppeteer/puppeteer/commit/b1f6e8692b0bc7e8551b2a78169c830cd80a7acb))
* handle unhandled promise rejections in tests ([#7722](https://github.com/puppeteer/puppeteer/issues/7722)) ([07febca](https://github.com/puppeteer/puppeteer/commit/07febca04b391893cfc872250e4391da142d4fe2))


### Bug Fixes

* add support for relative install paths to BrowserFetcher ([#7613](https://github.com/puppeteer/puppeteer/issues/7613)) ([eebf452](https://github.com/puppeteer/puppeteer/commit/eebf452d38b79bb2ea1a1ba84c3d2ea6f2f9f899)), closes [#7592](https://github.com/puppeteer/puppeteer/issues/7592)
* add webp to screenshot quality option allow list ([#7631](https://github.com/puppeteer/puppeteer/issues/7631)) ([b20c2bf](https://github.com/puppeteer/puppeteer/commit/b20c2bfa24cbdd4a1b9cefca2e0a9407e442baf5))
* prevent Target closed errors on streams ([#7728](https://github.com/puppeteer/puppeteer/issues/7728)) ([5b792de](https://github.com/puppeteer/puppeteer/commit/5b792de7a97611441777d1ac99cb95516301d7dc))
* request an animation frame to fix flaky clickablePoint test ([#7587](https://github.com/puppeteer/puppeteer/issues/7587)) ([7341d9f](https://github.com/puppeteer/puppeteer/commit/7341d9fadd1466a5b2f2bde8631f3b02cf9a7d8a))
* setup husky properly ([#7727](https://github.com/puppeteer/puppeteer/issues/7727)) ([8b712e7](https://github.com/puppeteer/puppeteer/commit/8b712e7b642b58193437f26d4e104a9e412f388d)), closes [#7726](https://github.com/puppeteer/puppeteer/issues/7726)
* updated troubleshooting.md to meet latest dependencies changes ([#7656](https://github.com/puppeteer/puppeteer/issues/7656)) ([edb0197](https://github.com/puppeteer/puppeteer/commit/edb01972b9606d8b05b979a588eda0d622315981))
* **launcher:** launcher.launch() should pass 'timeout' option [#5180](https://github.com/puppeteer/puppeteer/issues/5180) ([#7596](https://github.com/puppeteer/puppeteer/issues/7596)) ([113489d](https://github.com/puppeteer/puppeteer/commit/113489d3b58e2907374a4e6e5133bf46630695d1))
* **page:** fallback to default in exposeFunction when using imported module  ([#6365](https://github.com/puppeteer/puppeteer/issues/6365)) ([44c9ec6](https://github.com/puppeteer/puppeteer/commit/44c9ec67c57dccf3e186c86f14f3a8da9a8eb971))
* **page:** fix page.off method for request event ([#7624](https://github.com/puppeteer/puppeteer/issues/7624)) ([d0cb943](https://github.com/puppeteer/puppeteer/commit/d0cb9436a302418086f6763e0e58ae3732a20b62)), closes [#7572](https://github.com/puppeteer/puppeteer/issues/7572)

## [10.4.0](https://github.com/puppeteer/puppeteer/compare/v10.2.0...v10.4.0) (2021-09-21)


### Features

* add webp to screenshot options ([#7565](https://github.com/puppeteer/puppeteer/issues/7565)) ([43a9268](https://github.com/puppeteer/puppeteer/commit/43a926832505a57922016907a264165676424557))
* **page:** expose page.client() ([#7582](https://github.com/puppeteer/puppeteer/issues/7582)) ([99ca842](https://github.com/puppeteer/puppeteer/commit/99ca842124a1edef5e66426621885141a9feaca5))
* **page:** mark page.client() as internal ([#7585](https://github.com/puppeteer/puppeteer/issues/7585)) ([8451951](https://github.com/puppeteer/puppeteer/commit/84519514831f304f9076ca235fe474f797616b2c))
* add ability to specify offsets for JSHandle.click ([#7573](https://github.com/puppeteer/puppeteer/issues/7573)) ([2b5c001](https://github.com/puppeteer/puppeteer/commit/2b5c0019dc3744196c5858edeaa901dff9973ef5))
* add durableStorage to allowed permissions ([#5295](https://github.com/puppeteer/puppeteer/issues/5295)) ([eda5171](https://github.com/puppeteer/puppeteer/commit/eda51712790b9260626dc53cfb58a72805c45582))
* add id option to addScriptTag ([#5477](https://github.com/puppeteer/puppeteer/issues/5477)) ([300be5d](https://github.com/puppeteer/puppeteer/commit/300be5d167b6e7e532e725fdb86966081a5d0093))
* add more Android models to DeviceDescriptors ([#7210](https://github.com/puppeteer/puppeteer/issues/7210)) ([b5020dc](https://github.com/puppeteer/puppeteer/commit/b5020dc04121b265c77662237dfb177d6de06053)), closes [/github.com/aerokube/moon-deploy/blob/master/moon-local.yaml#L199](https://github.com/puppeteer//github.com/aerokube/moon-deploy/blob/master/moon-local.yaml/issues/L199)
* add proxy and bypass list parameters to createIncognitoBrowserContext ([#7516](https://github.com/puppeteer/puppeteer/issues/7516)) ([8e45a1c](https://github.com/puppeteer/puppeteer/commit/8e45a1c882207cc36e87be2a917b661eb841c4bf)), closes [#678](https://github.com/puppeteer/puppeteer/issues/678)
* add threshold to Page.isIntersectingViewport ([#6497](https://github.com/puppeteer/puppeteer/issues/6497)) ([54c4318](https://github.com/puppeteer/puppeteer/commit/54c43180161c3c512e4698e7f2e85ce3c6f0ab50))
* add unit test support for bisect ([#7553](https://github.com/puppeteer/puppeteer/issues/7553)) ([a0b1f6b](https://github.com/puppeteer/puppeteer/commit/a0b1f6b401abae2fbc5a8987061644adfaa7b482))
* add User-Agent with Puppeteer version to WebSocket request ([#5614](https://github.com/puppeteer/puppeteer/issues/5614)) ([6a2bf0a](https://github.com/puppeteer/puppeteer/commit/6a2bf0aabaa4df72c7838f5a6cd742e8f9c72be6))
* extend husky checks ([#7574](https://github.com/puppeteer/puppeteer/issues/7574)) ([7316086](https://github.com/puppeteer/puppeteer/commit/73160869417275200be19bd37372b6218dbc5f63))
* **api:** implement `Page.waitForNetworkIdle()` ([#5140](https://github.com/puppeteer/puppeteer/issues/5140)) ([3c6029c](https://github.com/puppeteer/puppeteer/commit/3c6029c702291ca7ef637b66e78d72e03156fe58))
* **coverage:** option for raw V8 script coverage ([#6454](https://github.com/puppeteer/puppeteer/issues/6454)) ([cb4470a](https://github.com/puppeteer/puppeteer/commit/cb4470a6d9b0a7f73836458bb3d5779eb85ac5f2))
* support timeout for page.pdf() call ([#7508](https://github.com/puppeteer/puppeteer/issues/7508)) ([f90af66](https://github.com/puppeteer/puppeteer/commit/f90af6639d801e764bdb479b9543b7f8f2b926df))
* **typescript:** allow using puppeteer without dom lib ([#6998](https://github.com/puppeteer/puppeteer/issues/6998)) ([723052d](https://github.com/puppeteer/puppeteer/commit/723052d5bb3c3d1d3908508467512bea4d8fdc80)), closes [#6989](https://github.com/puppeteer/puppeteer/issues/6989)


### Bug Fixes

* **docs:** deploy includes website documentation ([#7469](https://github.com/puppeteer/puppeteer/issues/7469)) ([6fde41c](https://github.com/puppeteer/puppeteer/commit/6fde41c6b6657986df1bbce3f2e0f7aa499f2be4))
* **docs:** names in version 9.1.1 ([#7517](https://github.com/puppeteer/puppeteer/issues/7517)) ([44b22bb](https://github.com/puppeteer/puppeteer/commit/44b22bbc2629e3c75c1494b299a66790b371fb0a))
* **frame:** fix Frame.waitFor's XPath pattern detection ([#5184](https://github.com/puppeteer/puppeteer/issues/5184)) ([caa2b73](https://github.com/puppeteer/puppeteer/commit/caa2b732fe58f32ec03f2a9fa8568f20188203c5))
* **install:** respect environment proxy config when downloading Firef… ([#6577](https://github.com/puppeteer/puppeteer/issues/6577)) ([9399c97](https://github.com/puppeteer/puppeteer/commit/9399c9786fba4e45e1c5485ddbb197d2d4f1735f)), closes [#6573](https://github.com/puppeteer/puppeteer/issues/6573)
* added names in V9.1.1 ([#7547](https://github.com/puppeteer/puppeteer/issues/7547)) ([d132b8b](https://github.com/puppeteer/puppeteer/commit/d132b8b041696e6d5b9a99d0be1acf1cf943efef))
* **test:** tweak waitForNetworkIdle delay in test between downloads ([#7564](https://github.com/puppeteer/puppeteer/issues/7564)) ([a21b737](https://github.com/puppeteer/puppeteer/commit/a21b7376e7feaf23066d67948d52480516f42496))
* **types:** allow evaluate functions to take a readonly array as an argument ([#7072](https://github.com/puppeteer/puppeteer/issues/7072)) ([491614c](https://github.com/puppeteer/puppeteer/commit/491614c7f8cfa50b902d0275064e611c2a48c3b2))
* update firefox prefs documentation link ([#7539](https://github.com/puppeteer/puppeteer/issues/7539)) ([2aec355](https://github.com/puppeteer/puppeteer/commit/2aec35553bc6e0305f40837bb3665ddbd02aa889))
* use non-deprecated tracing categories api ([#7413](https://github.com/puppeteer/puppeteer/issues/7413)) ([040a0e5](https://github.com/puppeteer/puppeteer/commit/040a0e561b4f623f7929130b90be129f94ebb642))

## [10.2.0](https://github.com/puppeteer/puppeteer/compare/v10.1.0...v10.2.0) (2021-08-04)


### Features

* **api:** make `page.isDragInterceptionEnabled` a method ([#7419](https://github.com/puppeteer/puppeteer/issues/7419)) ([dd470c7](https://github.com/puppeteer/puppeteer/commit/dd470c7a226a8422a938a7b0fffa58ffc6b78512)), closes [#7150](https://github.com/puppeteer/puppeteer/issues/7150)
* **chromium:** roll to Chromium 93.0.4577.0 (r901912) ([#7387](https://github.com/puppeteer/puppeteer/issues/7387)) ([e10faad](https://github.com/puppeteer/puppeteer/commit/e10faad4f239b1120491bb54fcba0216acd3a646))
* add channel parameter for puppeteer.launch ([#7389](https://github.com/puppeteer/puppeteer/issues/7389)) ([d70f60e](https://github.com/puppeteer/puppeteer/commit/d70f60e0619b8659d191fa492e3db4bc221ae982))
* add cooperative request intercepts ([#6735](https://github.com/puppeteer/puppeteer/issues/6735)) ([b5e6474](https://github.com/puppeteer/puppeteer/commit/b5e6474374ae6a88fc73cdb1a9906764c2ac5d70))
* add support for useragentdata ([#7378](https://github.com/puppeteer/puppeteer/issues/7378)) ([7200b1a](https://github.com/puppeteer/puppeteer/commit/7200b1a6fb9dfdfb65d50f0000339333e71b1b2a))


### Bug Fixes

* **browser-runner:** reject promise on error ([#7338](https://github.com/puppeteer/puppeteer/issues/7338)) ([5eb20e2](https://github.com/puppeteer/puppeteer/commit/5eb20e29a21ea0e0368fa8937ef38f7c7693ab34))
* add script to remove html comments from docs markdown ([#7394](https://github.com/puppeteer/puppeteer/issues/7394)) ([ea3df80](https://github.com/puppeteer/puppeteer/commit/ea3df80ed136a03d7698d2319106af5df8d48b58))

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
