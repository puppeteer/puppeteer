# Changelog

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
