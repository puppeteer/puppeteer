# Changelog

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
