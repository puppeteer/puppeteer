# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
