# Changelog

## [2.7.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.6.1...browsers-v2.7.0) (2025-01-09)


### Features

* resolve relative paths to absolute before unpacking ([#13466](https://github.com/puppeteer/puppeteer/issues/13466)) ([f23c391](https://github.com/puppeteer/puppeteer/commit/f23c391e3c22bf9c9e9ff2c400f5a0c6b07effad))


### Bug Fixes

* skip retries for same URL ([#13469](https://github.com/puppeteer/puppeteer/issues/13469)) ([04135ec](https://github.com/puppeteer/puppeteer/commit/04135ec6571312e4dbec0fead182beb8ec9f39d0))

## [2.6.1](https://github.com/puppeteer/puppeteer/compare/browsers-v2.6.0...browsers-v2.6.1) (2024-12-10)


### Bug Fixes

* support .tar.xz archives for Firefox 135+ ([#13391](https://github.com/puppeteer/puppeteer/issues/13391)) ([d247a7f](https://github.com/puppeteer/puppeteer/commit/d247a7fcd4fc01cf0c53d733632a1e9687b8004d))

## [2.6.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.5.0...browsers-v2.6.0) (2024-12-09)


### Features

* allow listing installed browsers ([#13385](https://github.com/puppeteer/puppeteer/issues/13385)) ([8b814bf](https://github.com/puppeteer/puppeteer/commit/8b814bfd1bfb5156d4d1334c7d2d3292ea17fbfc))

## [2.5.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.4.1...browsers-v2.5.0) (2024-12-03)


### Features

* support LaunchOptions in executablePath() ([#13340](https://github.com/puppeteer/puppeteer/issues/13340)) ([6acfee6](https://github.com/puppeteer/puppeteer/commit/6acfee6810da378844d4dca7f28d539dd46a3529))

## [2.4.1](https://github.com/puppeteer/puppeteer/compare/browsers-v2.4.0...browsers-v2.4.1) (2024-11-04)


### Bug Fixes

* **browsers:** correctly import yargs for esm module ([#13249](https://github.com/puppeteer/puppeteer/issues/13249)) ([694fef9](https://github.com/puppeteer/puppeteer/commit/694fef9f4ea61a9fa65a8dddff73dc6b81e8986a))

## [2.4.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.3.1...browsers-v2.4.0) (2024-09-04)


### Features

* support --install-deps flag in the browsers CLI ([#12580](https://github.com/puppeteer/puppeteer/issues/12580)) ([b832417](https://github.com/puppeteer/puppeteer/commit/b832417eede8506b0fb70d4e4fceb0fa9655cdf5))

## [2.3.1](https://github.com/puppeteer/puppeteer/compare/browsers-v2.3.0...browsers-v2.3.1) (2024-08-14)


### Bug Fixes

* **firefox:** back up user.js as well ([#12943](https://github.com/puppeteer/puppeteer/issues/12943)) ([9feda9c](https://github.com/puppeteer/puppeteer/commit/9feda9cdfce81cb375193d0efa9efa0c13b2818d))

## [2.3.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.2.4...browsers-v2.3.0) (2024-07-25)


### Features

* allow downloading of all pinned browsers ([#12806](https://github.com/puppeteer/puppeteer/issues/12806)) ([e72e7ab](https://github.com/puppeteer/puppeteer/commit/e72e7ab515f31d805f89860bbac6aced5a63a868))


### Bug Fixes

* configure sandbox permissions for Chrome on Windows ([#12430](https://github.com/puppeteer/puppeteer/issues/12430)) ([b1bf89d](https://github.com/puppeteer/puppeteer/commit/b1bf89d482a830aa7d43af7b53779f6c9988f0d9))

## [2.2.4](https://github.com/puppeteer/puppeteer/compare/browsers-v2.2.3...browsers-v2.2.4) (2024-07-17)


### Bug Fixes

* use spawn instead of exec in fileUtil ([#12758](https://github.com/puppeteer/puppeteer/issues/12758)) ([9ce6a85](https://github.com/puppeteer/puppeteer/commit/9ce6a8528969f3895899e3556c527ffd0d3f5c1c))

## [2.2.3](https://github.com/puppeteer/puppeteer/compare/browsers-v2.2.2...browsers-v2.2.3) (2024-04-25)


### Bug Fixes

* **performance:** speed up Firefox profile creation ([#12320](https://github.com/puppeteer/puppeteer/issues/12320)) ([c9a5644](https://github.com/puppeteer/puppeteer/commit/c9a5644c65197a7458995092c332545482d04ee2))

## [2.2.2](https://github.com/puppeteer/puppeteer/compare/browsers-v2.2.1...browsers-v2.2.2) (2024-04-15)


### Bug Fixes

* remove NetworkServiceInProcess2 set by default ([#12261](https://github.com/puppeteer/puppeteer/issues/12261)) ([ff4f70f](https://github.com/puppeteer/puppeteer/commit/ff4f70f4ae7ca8deb0becbec2e49b35322dba336)), closes [#12257](https://github.com/puppeteer/puppeteer/issues/12257)

## [2.2.1](https://github.com/puppeteer/puppeteer/compare/browsers-v2.2.0...browsers-v2.2.1) (2024-04-05)


### Bug Fixes

* do not use fallback download URLs if custom baseUrl is provided ([#12206](https://github.com/puppeteer/puppeteer/issues/12206)) ([ab560bc](https://github.com/puppeteer/puppeteer/commit/ab560bcf6fee57cabde94d9d261d28ffc2112948))
* only set up a single process event listener in launch ([#12200](https://github.com/puppeteer/puppeteer/issues/12200)) ([7bc5e0f](https://github.com/puppeteer/puppeteer/commit/7bc5e0fb2dc443765e2512e4dc15fb2bcc1cb4be))

## [2.2.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.1.0...browsers-v2.2.0) (2024-03-15)


### Features

* allow downloading Firefox channels other than nightly ([#12051](https://github.com/puppeteer/puppeteer/issues/12051)) ([e4cc2f9](https://github.com/puppeteer/puppeteer/commit/e4cc2f9ee944f2507a03cf8f5af99759c97ee2ec))


### Bug Fixes

* don't keep connection alive ([#12096](https://github.com/puppeteer/puppeteer/issues/12096)) ([0a142bf](https://github.com/puppeteer/puppeteer/commit/0a142bf0aa8a6666d1ca230d05a1ece0e03ad7d4))

## [2.1.0](https://github.com/puppeteer/puppeteer/compare/browsers-v2.0.1...browsers-v2.1.0) (2024-02-21)


### Features

* allow comparing browser versions ([#11954](https://github.com/puppeteer/puppeteer/issues/11954)) ([bf71b34](https://github.com/puppeteer/puppeteer/commit/bf71b34fca73ed14eeb23616682799ff545fc371))
* support local aliases when launching a browser ([#11947](https://github.com/puppeteer/puppeteer/issues/11947)) ([561e4cd](https://github.com/puppeteer/puppeteer/commit/561e4cd6ee79b19ac43f2c2fceaa1fce51052c02))


### Bug Fixes

* check if executable exists ([#11946](https://github.com/puppeteer/puppeteer/issues/11946)) ([e95a308](https://github.com/puppeteer/puppeteer/commit/e95a308c33021a80c9eb27a4ac02c607af60ff99))
* implement a fallback to download URLs provided by dashboard ([#11951](https://github.com/puppeteer/puppeteer/issues/11951)) ([73c1f9b](https://github.com/puppeteer/puppeteer/commit/73c1f9bbf3c862decded533401e3bd26a18f8194))

## [2.0.1](https://github.com/puppeteer/puppeteer/compare/browsers-v2.0.0...browsers-v2.0.1) (2024-02-17)


### Bug Fixes

* Chrome for Testing downloads have a new URL ([#11923](https://github.com/puppeteer/puppeteer/issues/11923)) ([f00a94a](https://github.com/puppeteer/puppeteer/commit/f00a94a809d38ee1c2c8cfc8597c66db9f3d243d))

## [2.0.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.9.1...browsers-v2.0.0) (2024-02-05)


### ⚠ BREAKING CHANGES

* drop support for node16 ([#10912](https://github.com/puppeteer/puppeteer/issues/10912))

### Features

* drop support for node16 ([#10912](https://github.com/puppeteer/puppeteer/issues/10912)) ([953f420](https://github.com/puppeteer/puppeteer/commit/953f4207b17210fa7231225e6f29a826f77e0832))

## [1.9.1](https://github.com/puppeteer/puppeteer/compare/browsers-v1.9.0...browsers-v1.9.1) (2024-01-04)


### Bug Fixes

* disable GFX sanity window for Firefox and enable WebDriver BiDi CI jobs for Windows ([#11578](https://github.com/puppeteer/puppeteer/issues/11578)) ([e41a265](https://github.com/puppeteer/puppeteer/commit/e41a2656d9e1f3f037b298457fbd6c6e08f5a371))

## [1.9.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.8.0...browsers-v1.9.0) (2023-12-05)


### Features

* implement the Puppeteer CLI ([#11344](https://github.com/puppeteer/puppeteer/issues/11344)) ([53fb69b](https://github.com/puppeteer/puppeteer/commit/53fb69bf7f2bf06fa4fd7bb6d3cf21382386f6e7))


### Bug Fixes

* ng-schematics install Windows ([#11487](https://github.com/puppeteer/puppeteer/issues/11487)) ([02af748](https://github.com/puppeteer/puppeteer/commit/02af7482d9bf2163b90dfe623b0af18c513d5a3b))
* remove CDP-specific preferences from defaults for Firefox ([#11477](https://github.com/puppeteer/puppeteer/issues/11477)) ([f8c9469](https://github.com/puppeteer/puppeteer/commit/f8c94699c7f5b15c7bb96f299c2c8217d74230cd))

## [1.8.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.7.1...browsers-v1.8.0) (2023-10-20)


### Features

* enable tab targets ([#11099](https://github.com/puppeteer/puppeteer/issues/11099)) ([8324c16](https://github.com/puppeteer/puppeteer/commit/8324c1634883d97ed83f32a1e62acc9b5e64e0bd))

## [1.7.1](https://github.com/puppeteer/puppeteer/compare/browsers-v1.7.0...browsers-v1.7.1) (2023-09-13)


### Bug Fixes

* use supported node range for types ([#10896](https://github.com/puppeteer/puppeteer/issues/10896)) ([2d851c1](https://github.com/puppeteer/puppeteer/commit/2d851c1398e5efcdabdb5304dc78e68cbd3fadd2))

## [1.7.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.6.0...browsers-v1.7.0) (2023-08-18)


### Features

* support chrome-headless-shell ([#10739](https://github.com/puppeteer/puppeteer/issues/10739)) ([416843b](https://github.com/puppeteer/puppeteer/commit/416843ba68aaab7ae14bbc74c2ac705e877e91a7))

## [1.6.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.5.1...browsers-v1.6.0) (2023-08-10)


### Features

* allow installing chrome/chromedriver by milestone and version prefix ([#10720](https://github.com/puppeteer/puppeteer/issues/10720)) ([bec2357](https://github.com/puppeteer/puppeteer/commit/bec2357aeedda42cfaf3096c6293c2f49ceb825e))

## [1.5.1](https://github.com/puppeteer/puppeteer/compare/browsers-v1.5.0...browsers-v1.5.1) (2023-08-08)


### Bug Fixes

* add buildId to archive path ([#10699](https://github.com/puppeteer/puppeteer/issues/10699)) ([21461b0](https://github.com/puppeteer/puppeteer/commit/21461b02c65062f5ed240e8ea357e9b7f2d26b32))

## [1.5.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.6...browsers-v1.5.0) (2023-08-02)


### Features

* add executablePath to InstalledBrowser ([#10594](https://github.com/puppeteer/puppeteer/issues/10594)) ([87522e7](https://github.com/puppeteer/puppeteer/commit/87522e778a6487111931458755e701f1c4b717d9))


### Bug Fixes

* clear pending TLS socket handle ([#10667](https://github.com/puppeteer/puppeteer/issues/10667)) ([87bd791](https://github.com/puppeteer/puppeteer/commit/87bd791ddc10c247bf154bbac2aa912327a4cf20))
* remove typescript from peer dependencies ([#10593](https://github.com/puppeteer/puppeteer/issues/10593)) ([c60572a](https://github.com/puppeteer/puppeteer/commit/c60572a1ca36ea5946d287bd629ac31798d84cb0))

## [1.4.6](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.5...browsers-v1.4.6) (2023-07-20)


### Bug Fixes

* restore proxy-agent ([#10569](https://github.com/puppeteer/puppeteer/issues/10569)) ([bf6304e](https://github.com/puppeteer/puppeteer/commit/bf6304e064eb52d39d7f993f1ea868da06f7f006))

## [1.4.5](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.4...browsers-v1.4.5) (2023-07-13)


### Bug Fixes

* stop relying on vm2 (via proxy agent) ([#10548](https://github.com/puppeteer/puppeteer/issues/10548)) ([4070cd6](https://github.com/puppeteer/puppeteer/commit/4070cd68b6d01fb9a1643da2662ce0b6f53cf37d))

## [1.4.4](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.3...browsers-v1.4.4) (2023-07-11)


### Bug Fixes

* correctly parse the default buildId ([#10535](https://github.com/puppeteer/puppeteer/issues/10535)) ([c308266](https://github.com/puppeteer/puppeteer/commit/c3082661113b4b55534f25da86e3b261d3952953))
* remove Chromium channels ([#10536](https://github.com/puppeteer/puppeteer/issues/10536)) ([c0dc8ad](https://github.com/puppeteer/puppeteer/commit/c0dc8ad8a82446752e29f98d8eee617b9a67c942))

## [1.4.3](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.2...browsers-v1.4.3) (2023-06-29)


### Bug Fixes

* negative timeout doesn't break launch ([#10480](https://github.com/puppeteer/puppeteer/issues/10480)) ([6a89a2a](https://github.com/puppeteer/puppeteer/commit/6a89a2aadcaf683fe57f1e0e13886f1fa937e194))

## [1.4.2](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.1...browsers-v1.4.2) (2023-06-20)


### Bug Fixes

* include src into published package ([#10415](https://github.com/puppeteer/puppeteer/issues/10415)) ([d1ffad0](https://github.com/puppeteer/puppeteer/commit/d1ffad059ae66104842b92dc814d362c123b9646))

## [1.4.1](https://github.com/puppeteer/puppeteer/compare/browsers-v1.4.0...browsers-v1.4.1) (2023-05-31)


### Bug Fixes

* pass on the auth from the download URL ([#10271](https://github.com/puppeteer/puppeteer/issues/10271)) ([3a1f4f0](https://github.com/puppeteer/puppeteer/commit/3a1f4f0f8f5fe4e20c4ed69f5485a827a841cf54))

## [1.4.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.3.0...browsers-v1.4.0) (2023-05-24)


### Features

* use proxy-agent to support various proxies ([#10227](https://github.com/puppeteer/puppeteer/issues/10227)) ([2c0bd54](https://github.com/puppeteer/puppeteer/commit/2c0bd54d2e3b778818b9b4b32f436778f571b918))

## [1.3.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.2.0...browsers-v1.3.0) (2023-05-15)


### Features

* add ability to uninstall a browser ([#10179](https://github.com/puppeteer/puppeteer/issues/10179)) ([d388a6e](https://github.com/puppeteer/puppeteer/commit/d388a6edfd164548b008cb0d8e9cb5c0d03cdcda))


### Bug Fixes

* update the command name ([#10178](https://github.com/puppeteer/puppeteer/issues/10178)) ([ccbb82d](https://github.com/puppeteer/puppeteer/commit/ccbb82d9cd5b77f8262c143a5663fc1f9938a8c4))

## [1.2.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.1.0...browsers-v1.2.0) (2023-05-11)


### Features

* support Chrome channels for ChromeDriver ([#10158](https://github.com/puppeteer/puppeteer/issues/10158)) ([e313b05](https://github.com/puppeteer/puppeteer/commit/e313b054e658887e2c062ea55d8ee99f3f4f3789))

## [1.1.0](https://github.com/puppeteer/puppeteer/compare/browsers-v1.0.1...browsers-v1.1.0) (2023-05-08)


### Features

* support stable/dev/beta/canary keywords for chrome and chromium ([#10140](https://github.com/puppeteer/puppeteer/issues/10140)) ([90ed263](https://github.com/puppeteer/puppeteer/commit/90ed263eafb0ca0420ea1918d7c1f326eaa58e20))

## [1.0.1](https://github.com/puppeteer/puppeteer/compare/browsers-v1.0.0...browsers-v1.0.1) (2023-05-05)


### Bug Fixes

* rename PUPPETEER_DOWNLOAD_HOST to PUPPETEER_DOWNLOAD_BASE_URL ([#10130](https://github.com/puppeteer/puppeteer/issues/10130)) ([9758cae](https://github.com/puppeteer/puppeteer/commit/9758cae029f90908c4b5340561d9c51c26aa2f21))

## [1.0.0](https://github.com/puppeteer/puppeteer/compare/browsers-v0.5.0...browsers-v1.0.0) (2023-05-02)


### ⚠ BREAKING CHANGES

* drop support for node14 ([#10019](https://github.com/puppeteer/puppeteer/issues/10019))
* switch to Chrome for Testing instead of Chromium ([#10054](https://github.com/puppeteer/puppeteer/issues/10054))

### Features

* drop support for node14 ([#10019](https://github.com/puppeteer/puppeteer/issues/10019)) ([7405d65](https://github.com/puppeteer/puppeteer/commit/7405d6585aa09b240fbab09aa360674d4442b3d9))
* switch to Chrome for Testing instead of Chromium ([#10054](https://github.com/puppeteer/puppeteer/issues/10054)) ([df4d60c](https://github.com/puppeteer/puppeteer/commit/df4d60c187aa11c4ad783827242e9511f4ec2aab))


### Bug Fixes

* add Host header when used with http_proxy ([#10080](https://github.com/puppeteer/puppeteer/issues/10080)) ([edbfff7](https://github.com/puppeteer/puppeteer/commit/edbfff7b04baffc29c01c37c595d6b3355c0dea0))

## [0.5.0](https://github.com/puppeteer/puppeteer/compare/browsers-v0.4.1...browsers-v0.5.0) (2023-04-21)


### Features

* **browser:** add a method to get installed browsers ([#10057](https://github.com/puppeteer/puppeteer/issues/10057)) ([e16e2a9](https://github.com/puppeteer/puppeteer/commit/e16e2a97284f5e7ab4073f375254572a6a89e800))

## [0.4.1](https://github.com/puppeteer/puppeteer/compare/browsers-v0.4.0...browsers-v0.4.1) (2023-04-13)


### Bug Fixes

* report install errors properly ([#10016](https://github.com/puppeteer/puppeteer/issues/10016)) ([7381229](https://github.com/puppeteer/puppeteer/commit/7381229a164e598e7523862f2438cd0cd1cd796a))

## [0.4.0](https://github.com/puppeteer/puppeteer/compare/browsers-v0.3.3...browsers-v0.4.0) (2023-04-06)


### Features

* **browsers:** support downloading chromedriver ([#9990](https://github.com/puppeteer/puppeteer/issues/9990)) ([ef0fb5d](https://github.com/puppeteer/puppeteer/commit/ef0fb5d87299c604af2387ac1c72be317c50316d))

## [0.3.3](https://github.com/puppeteer/puppeteer/compare/browsers-v0.3.2...browsers-v0.3.3) (2023-04-06)


### Bug Fixes

* **browsers:** update package json ([#9968](https://github.com/puppeteer/puppeteer/issues/9968)) ([817288c](https://github.com/puppeteer/puppeteer/commit/817288cd901121ddc8a44226eda689bb784cee61))
* **browsers:** various fixes and improvements ([#9966](https://github.com/puppeteer/puppeteer/issues/9966)) ([f1211cb](https://github.com/puppeteer/puppeteer/commit/f1211cbec091ec669de019aeb7fb4f011a81c1d7))
* consider downloadHost as baseUrl ([#9973](https://github.com/puppeteer/puppeteer/issues/9973)) ([05a44af](https://github.com/puppeteer/puppeteer/commit/05a44afe5affcac9fe0f0a2e83f17807c99b2f0c))

## [0.3.2](https://github.com/puppeteer/puppeteer/compare/browsers-v0.3.1...browsers-v0.3.2) (2023-04-03)


### Bug Fixes

* typo in the browsers package ([#9957](https://github.com/puppeteer/puppeteer/issues/9957)) ([c780384](https://github.com/puppeteer/puppeteer/commit/c7803844cf10b6edaa2da83134029b7acf5b45b2))

## [0.3.1](https://github.com/puppeteer/puppeteer/compare/browsers-v0.3.0...browsers-v0.3.1) (2023-03-29)


### Bug Fixes

* bump @puppeteer/browsers ([#9938](https://github.com/puppeteer/puppeteer/issues/9938)) ([2a29d30](https://github.com/puppeteer/puppeteer/commit/2a29d30d1790b47c99f8d196b3844364d351acbd))

## [0.3.0](https://github.com/puppeteer/puppeteer/compare/browsers-v0.2.0...browsers-v0.3.0) (2023-03-27)


### Features

* update Chrome browser binaries ([#9917](https://github.com/puppeteer/puppeteer/issues/9917)) ([fcb233c](https://github.com/puppeteer/puppeteer/commit/fcb233ce949f5f716aee39253e910104b04aa000))

## [0.2.0](https://github.com/puppeteer/puppeteer/compare/browsers-v0.1.1...browsers-v0.2.0) (2023-03-24)


### Features

* implement a command to clear the cache ([#9868](https://github.com/puppeteer/puppeteer/issues/9868)) ([b8d38cb](https://github.com/puppeteer/puppeteer/commit/b8d38cb05f7eedf554ed46f2f7428b621197d1cc))

## [0.1.1](https://github.com/puppeteer/puppeteer/compare/browsers-v0.1.0...browsers-v0.1.1) (2023-03-14)


### Bug Fixes

* export ChromeReleaseChannel ([#9851](https://github.com/puppeteer/puppeteer/issues/9851)) ([3e7a514](https://github.com/puppeteer/puppeteer/commit/3e7a514e556ddb4306aa3c15f24c512beaac65f4))

## [0.1.0](https://github.com/puppeteer/puppeteer/compare/browsers-v0.0.5...browsers-v0.1.0) (2023-03-14)


### Features

* implement system channels for chrome in browsers ([#9844](https://github.com/puppeteer/puppeteer/issues/9844)) ([dec48a9](https://github.com/puppeteer/puppeteer/commit/dec48a95923e21a054c1d70d22c14001a0150293))


### Bug Fixes

* add browsers entry point ([#9846](https://github.com/puppeteer/puppeteer/issues/9846)) ([1a1e79d](https://github.com/puppeteer/puppeteer/commit/1a1e79d046ccad6fe843aa219501c17da08bc498))

## [0.0.5](https://github.com/puppeteer/puppeteer/compare/browsers-v0.0.4...browsers-v0.0.5) (2023-03-07)


### Bug Fixes

* change the install output to include the executable path ([#9797](https://github.com/puppeteer/puppeteer/issues/9797)) ([8cca7bb](https://github.com/puppeteer/puppeteer/commit/8cca7bb7a2a1cdf62919d9c7eca62d6774e698db))

## [0.0.4](https://github.com/puppeteer/puppeteer/compare/browsers-v0.0.3...browsers-v0.0.4) (2023-03-06)


### Features

* browsers: recognize chromium as a valid browser ([#9760](https://github.com/puppeteer/puppeteer/issues/9760)) ([04247a4](https://github.com/puppeteer/puppeteer/commit/04247a4e00b43683977bd8aa309d493eee663735))

## [0.0.3](https://github.com/puppeteer/puppeteer/compare/browsers-v0.0.2...browsers-v0.0.3) (2023-02-22)


### Bug Fixes

* define options per command ([#9733](https://github.com/puppeteer/puppeteer/issues/9733)) ([8bae054](https://github.com/puppeteer/puppeteer/commit/8bae0545b7321d398dae3f522952dd981111587e))

## [0.0.2](https://github.com/puppeteer/puppeteer/compare/browsers-v0.0.1...browsers-v0.0.2) (2023-02-22)


### Bug Fixes

* permissions for the browser CLI ([#9731](https://github.com/puppeteer/puppeteer/issues/9731)) ([e944931](https://github.com/puppeteer/puppeteer/commit/e944931de22726f35c5c83052892f8ab4667b035))

## 0.0.1 (2023-02-22)


### Features

* initial release of browsers ([#9722](https://github.com/puppeteer/puppeteer/issues/9722)) ([#9727](https://github.com/puppeteer/puppeteer/issues/9727)) ([86a2d1d](https://github.com/puppeteer/puppeteer/commit/86a2d1dd3b2c024b886c6280e08a2d7dc8caabc5))
