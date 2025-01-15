# Changelog

Combined changelog for puppeteer and puppeteer-core.

## [24.1.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v24.0.0...puppeteer-v24.1.0) (2025-01-15)


### Features

* roll to Chrome 132.0.6834.83 ([#13507](https://github.com/puppeteer/puppeteer/issues/13507)) ([e282992](https://github.com/puppeteer/puppeteer/commit/e28299296675c018e38b0367c3e9810a8a63f21c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 24.0.0 to 24.1.0


### Bug Fixes

* roll to Firefox 134.0.1 ([#13510](https://github.com/puppeteer/puppeteer/issues/13510)) ([a50357c](https://github.com/puppeteer/puppeteer/commit/a50357cc2c84f59f951bc647ac809303d365231a))


## [24.0.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.11.1...puppeteer-v24.0.0) (2025-01-09)


### Bug Fixes

* include URL fragment into URL returned by HTTPRequest/Response instances ([#13425](https://github.com/puppeteer/puppeteer/issues/13425)) ([8ff26ad](https://github.com/puppeteer/puppeteer/commit/8ff26ad5aff0b366e54e6e85f71577de575ee31d))
* remove erroneous changelog entry ([#13479](https://github.com/puppeteer/puppeteer/issues/13479)) ([6de3238](https://github.com/puppeteer/puppeteer/commit/6de32386c2294a74eb3df3fbc9b179ffeed083f5))
* roll to Chrome 131.0.6778.264 ([#13468](https://github.com/puppeteer/puppeteer/issues/13468)) ([aac759b](https://github.com/puppeteer/puppeteer/commit/aac759b82f0f6427b401bee11ab7c454f0ac6d5b))
* **webdriver:** handle DiscardedBrowsingContextError error ([#13472](https://github.com/puppeteer/puppeteer/issues/13472)) ([b903856](https://github.com/puppeteer/puppeteer/commit/b90385662a7b29e9d36a7cae825e8c0f9f89fac8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.6.1 to 2.7.0


### ⚠ BREAKING CHANGES

* remove support for Firefox over CDP ([#13427](https://github.com/puppeteer/puppeteer/issues/13427))
* remove deprecated Launch and Connect options ([#13426](https://github.com/puppeteer/puppeteer/issues/13426))
* include URL fragment into URL returned by HTTPRequest/Response instances ([#13425](https://github.com/puppeteer/puppeteer/issues/13425))


### Features

* roll to Firefox 134.0 ([#13470](https://github.com/puppeteer/puppeteer/issues/13470)) ([3bd3176](https://github.com/puppeteer/puppeteer/commit/3bd31769b5827305dc553cd36ca40387558b3acd))


### Code Refactoring

* remove deprecated Launch and Connect options ([#13426](https://github.com/puppeteer/puppeteer/issues/13426)) ([20f9f15](https://github.com/puppeteer/puppeteer/commit/20f9f15d5f94832bd6f5c0e9807a1a53182c49f8))
* remove support for Firefox over CDP ([#13427](https://github.com/puppeteer/puppeteer/issues/13427)) ([1a2e91b](https://github.com/puppeteer/puppeteer/commit/1a2e91b04413e2ed90778b2f8e49549a8e63c139))


## [23.11.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.11.0...puppeteer-v23.11.1) (2024-12-19)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.11.0 to 23.11.1


### Bug Fixes

* roll to Chrome 131.0.6778.204 ([#13422](https://github.com/puppeteer/puppeteer/issues/13422)) ([4f3a877](https://github.com/puppeteer/puppeteer/commit/4f3a87789ea271993d418e0e64c6d4e3c940c83b))


## [23.11.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.10.4...puppeteer-v23.11.0) (2024-12-18)


### Bug Fixes

* **deps:** bump chromium-bidi to 0.11.0 ([#13418](https://github.com/puppeteer/puppeteer/issues/13418)) ([771e4b2](https://github.com/puppeteer/puppeteer/commit/771e4b27abf21436dba80d568b82c9235bfb7de3))
* include iframes into the a11y snapshot ([#12579](https://github.com/puppeteer/puppeteer/issues/12579)) ([a8152d4](https://github.com/puppeteer/puppeteer/commit/a8152d46101da918962555404e5a580e2696dd60))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.10.4 to 23.11.0


### Features

* support reducedContrast in Page.emulateVisionDeficiency ([#13408](https://github.com/puppeteer/puppeteer/issues/13408)) ([18e3e6a](https://github.com/puppeteer/puppeteer/commit/18e3e6a42c9517bc3a283fdc23e5c454ad8d27fe))


## [23.10.4](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.10.3...puppeteer-v23.10.4) (2024-12-12)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.10.3 to 23.10.4


### Bug Fixes

* roll to Chrome 131.0.6778.108 ([#13395](https://github.com/puppeteer/puppeteer/issues/13395)) ([cc1aa16](https://github.com/puppeteer/puppeteer/commit/cc1aa167efdb8f229678086618b8b129e7cf96d6))
* roll to Firefox 133.0.3 ([#13399](https://github.com/puppeteer/puppeteer/issues/13399)) ([a163cbf](https://github.com/puppeteer/puppeteer/commit/a163cbf7905059891f68cfe3a31396c9aca64467))


## [23.10.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.10.2...puppeteer-v23.10.3) (2024-12-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.6.0 to 2.6.1


## [23.10.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.10.1...puppeteer-v23.10.2) (2024-12-09)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.5.0 to 2.6.0


### Bug Fixes

* export the PuppeteerLaunchOptions type ([#13376](https://github.com/puppeteer/puppeteer/issues/13376)) ([2202ce8](https://github.com/puppeteer/puppeteer/commit/2202ce8b8a11b6bd36743418ade62b6ae56a67b9))


## [23.10.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.10.0...puppeteer-v23.10.1) (2024-12-04)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.10.0 to 23.10.1


### Bug Fixes

* roll to Chrome 131.0.6778.87 ([#13357](https://github.com/puppeteer/puppeteer/issues/13357)) ([a571bff](https://github.com/puppeteer/puppeteer/commit/a571bff7a47f2e439a59fa1cd94159e8f1b0e1e7))


## [23.10.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.9.0...puppeteer-v23.10.0) (2024-12-03)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.4.1 to 2.5.0


### Features

* adjust browser-level cookie API ([#13331](https://github.com/puppeteer/puppeteer/issues/13331)) ([678eaf0](https://github.com/puppeteer/puppeteer/commit/678eaf09f2f018678181c1b115f850cfa33be411))
* browser level cookies API ([#13316](https://github.com/puppeteer/puppeteer/issues/13316)) ([43dec3b](https://github.com/puppeteer/puppeteer/commit/43dec3b0aa277df0f0b8ed29009d71cd1ba77982))
* implement ElementHandle.backendNodeId ([#13328](https://github.com/puppeteer/puppeteer/issues/13328)) ([ffb31ca](https://github.com/puppeteer/puppeteer/commit/ffb31cacc53f6ca6991b227807a29aa93305a177))
* roll to Firefox 133.0 ([#13333](https://github.com/puppeteer/puppeteer/issues/13333)) ([de314e5](https://github.com/puppeteer/puppeteer/commit/de314e53de38c015748ff4c31f0e178512c4e494))
* support LaunchOptions in executablePath() ([#13340](https://github.com/puppeteer/puppeteer/issues/13340)) ([6acfee6](https://github.com/puppeteer/puppeteer/commit/6acfee6810da378844d4dca7f28d539dd46a3529))


### Bug Fixes

* stop calling bringToFront when taking page screenshots ([#13336](https://github.com/puppeteer/puppeteer/issues/13336)) ([6da2cb4](https://github.com/puppeteer/puppeteer/commit/6da2cb490495193fb7fbdb47a71c95033a4a6fab))


## [23.9.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.8.0...puppeteer-v23.9.0) (2024-11-21)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.8.0 to 23.9.0


### Features

* config download behavior ([#13309](https://github.com/puppeteer/puppeteer/issues/13309)) ([c3ca96c](https://github.com/puppeteer/puppeteer/commit/c3ca96c9d354ea727bfe0954c1ee763ca1ae2a6b))


### Bug Fixes

* correctly resolve OOPIF response bodies ([#13311](https://github.com/puppeteer/puppeteer/issues/13311)) ([e837140](https://github.com/puppeteer/puppeteer/commit/e83714023e1c80e8ab32e0a100f57d7cf5f5e151))
* roll to Chrome 131.0.6778.85 ([#13312](https://github.com/puppeteer/puppeteer/issues/13312)) ([374cead](https://github.com/puppeteer/puppeteer/commit/374cead4b5537cf041dc5a1e38206e1a86333842))


## [23.8.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.7.1...puppeteer-v23.8.0) (2024-11-13)


### Features

* roll to Chrome 131.0.6778.69 ([#13291](https://github.com/puppeteer/puppeteer/issues/13291)) ([34568e0](https://github.com/puppeteer/puppeteer/commit/34568e0b2d9e8a95050bd60e54d1d21b1cd0558c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.7.1 to 23.8.0


### Bug Fixes

* add getDefaultNavigationTimeout to Page ([#13277](https://github.com/puppeteer/puppeteer/issues/13277)) ([8b64c2c](https://github.com/puppeteer/puppeteer/commit/8b64c2cd01f7df44c1b667c4f1f2b676e0fab0a8))
* roll to Firefox 132.0.2 ([#13293](https://github.com/puppeteer/puppeteer/issues/13293)) ([aae6b33](https://github.com/puppeteer/puppeteer/commit/aae6b33cd0053ce75ad66e91d804f288fa8c9794))
* **webdriver:** frameElement() should return handles in the main world ([#13287](https://github.com/puppeteer/puppeteer/issues/13287)) ([2fde1ce](https://github.com/puppeteer/puppeteer/commit/2fde1ce4e09c4b084033537baea77fdd58b0c213))


## [23.7.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.7.0...puppeteer-v23.7.1) (2024-11-07)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.7.0 to 23.7.1


### Bug Fixes

* roll to Chrome 130.0.6723.116 ([#13274](https://github.com/puppeteer/puppeteer/issues/13274)) ([979af2b](https://github.com/puppeteer/puppeteer/commit/979af2bccdd684bb26f61518cc42e248ad2c8cfb))
* roll to Chrome 130.0.6723.93 ([#13268](https://github.com/puppeteer/puppeteer/issues/13268)) ([b7c7785](https://github.com/puppeteer/puppeteer/commit/b7c77852911164a1c167cb7cb0906cb27a70e122))
* roll to Firefox 132.0.1 ([#13265](https://github.com/puppeteer/puppeteer/issues/13265)) ([acd3c72](https://github.com/puppeteer/puppeteer/commit/acd3c7249e06446709830daabd48ce4421496278))
* **webdriver:** report frame URL as console message location ([#13273](https://github.com/puppeteer/puppeteer/issues/13273)) ([33b4f09](https://github.com/puppeteer/puppeteer/commit/33b4f09021faea6a3c639ff7fa7f96099a02ffd4))


## [23.7.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.6.1...puppeteer-v23.7.0) (2024-11-04)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.4.0 to 2.4.1


### Features

* distinguish different Touches ([#13231](https://github.com/puppeteer/puppeteer/issues/13231)) ([a2a205c](https://github.com/puppeteer/puppeteer/commit/a2a205c2e8ffbc5b9c73bee0466ac0bf00fb4657))
* roll to Firefox 132.0 ([#13252](https://github.com/puppeteer/puppeteer/issues/13252)) ([41d3dd9](https://github.com/puppeteer/puppeteer/commit/41d3dd9f0ceec5f551fc111f653645286169209f))


### Bug Fixes

* **browser:** omit file path validation in uploadFile() in browser environments ([#13258](https://github.com/puppeteer/puppeteer/issues/13258)) ([a9e6cd1](https://github.com/puppeteer/puppeteer/commit/a9e6cd1ed231c161ba83712b690fa6aab47a87a5))
* remove event listeners from AbortSignal in WaitTask ([#13257](https://github.com/puppeteer/puppeteer/issues/13257)) ([4e5c0ad](https://github.com/puppeteer/puppeteer/commit/4e5c0ad1c770d6bd1785325cdf5c0a63f285e5c2))
* roll to Chrome 130.0.6723.91 ([#13255](https://github.com/puppeteer/puppeteer/issues/13255)) ([8295e67](https://github.com/puppeteer/puppeteer/commit/8295e67874a31de43570c04b8608073808e5db0d))


## [23.6.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.6.0...puppeteer-v23.6.1) (2024-10-28)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.6.0 to 23.6.1


### Bug Fixes

* correctly handle errors in the ExtensionTransport ([#13244](https://github.com/puppeteer/puppeteer/issues/13244)) ([1fee9ff](https://github.com/puppeteer/puppeteer/commit/1fee9ff269d59e9750b264fe46c9b8be7d36bff1))
* roll to Chrome 130.0.6723.69 ([#13227](https://github.com/puppeteer/puppeteer/issues/13227)) ([76390bf](https://github.com/puppeteer/puppeteer/commit/76390bf5ac1cb6d70962f3a99cbfd43675ed8e4f))
* **webdriver:** consider subdomain in cookie filtering ([#13232](https://github.com/puppeteer/puppeteer/issues/13232)) ([98102ec](https://github.com/puppeteer/puppeteer/commit/98102ececf253ef6f0305d4dfb96e23981ea02f2))
* **webdriver:** partially handle client-side redirects in page.goto ([#13222](https://github.com/puppeteer/puppeteer/issues/13222)) ([442ed05](https://github.com/puppeteer/puppeteer/commit/442ed05b67c806339edf5fffee37fe27e7f410a3))


## [23.6.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.5.3...puppeteer-v23.6.0) (2024-10-16)


### Features

* remove --disable-component-update from default args ([#13201](https://github.com/puppeteer/puppeteer/issues/13201)) ([19dd9c3](https://github.com/puppeteer/puppeteer/commit/19dd9c385a34c01cf6aad4c207165962d888e63f))
* roll to Chrome 130.0.6723.58 ([#13195](https://github.com/puppeteer/puppeteer/issues/13195)) ([1cf5116](https://github.com/puppeteer/puppeteer/commit/1cf5116a2d3dd817cf38e46363e483fee58ed5bc))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.5.3 to 23.6.0


### Bug Fixes

* re-export node reference removed by TS 5.5 ([#13200](https://github.com/puppeteer/puppeteer/issues/13200)) ([1300e59](https://github.com/puppeteer/puppeteer/commit/1300e595cdea37e09f28d68bb06ead47b0883059))
* roll to Firefox 131.0.3 ([#13189](https://github.com/puppeteer/puppeteer/issues/13189)) ([d7bc66e](https://github.com/puppeteer/puppeteer/commit/d7bc66ef9c58e124b61ab20cc4508ca659a4541a))


## [23.5.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.5.2...puppeteer-v23.5.3) (2024-10-10)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.5.2 to 23.5.3


### Bug Fixes

* roll to Chrome 129.0.6668.100 ([#13174](https://github.com/puppeteer/puppeteer/issues/13174)) ([de145c3](https://github.com/puppeteer/puppeteer/commit/de145c3b26e82821b79689da62da73041a4ea7f5))
* roll to Firefox 131.0.2 ([#13171](https://github.com/puppeteer/puppeteer/issues/13171)) ([5b2b1fe](https://github.com/puppeteer/puppeteer/commit/5b2b1fe67dbd215df9acad948b63d39642621171))


## [23.5.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.5.1...puppeteer-v23.5.2) (2024-10-09)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.5.1 to 23.5.2


### Bug Fixes

* roll to Chrome 129.0.6668.91 ([#13166](https://github.com/puppeteer/puppeteer/issues/13166)) ([8a216f1](https://github.com/puppeteer/puppeteer/commit/8a216f19380d792d9f84144fa8d63a6ed81a20c3))


## [23.5.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.5.0...puppeteer-v23.5.1) (2024-10-07)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.5.0 to 23.5.1


### Bug Fixes

* default to RAF polling if visible||hidden is set ([#13153](https://github.com/puppeteer/puppeteer/issues/13153)) ([dd13d5d](https://github.com/puppeteer/puppeteer/commit/dd13d5d65a6d5d1f745ce7cfaa170d0a5f725cfe)), closes [#13152](https://github.com/puppeteer/puppeteer/issues/13152)
* handle shadow DOM in Frame.frameElement ([#13156](https://github.com/puppeteer/puppeteer/issues/13156)) ([57a8df0](https://github.com/puppeteer/puppeteer/commit/57a8df069b10217174ba494a1cd2b594d966778d)), closes [#13155](https://github.com/puppeteer/puppeteer/issues/13155)


## [23.5.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.4.1...puppeteer-v23.5.0) (2024-10-02)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.4.1 to 23.5.0


### Features

* roll to Firefox 131.0 ([#13148](https://github.com/puppeteer/puppeteer/issues/13148)) ([b5b8601](https://github.com/puppeteer/puppeteer/commit/b5b8601a7660b50c16e04f8683f38e6e35f5e2e8))


### Bug Fixes

* handle requestservedfromcache during interception ([#13134](https://github.com/puppeteer/puppeteer/issues/13134)) ([3ad2e45](https://github.com/puppeteer/puppeteer/commit/3ad2e45c295083de6fc72a5041138c620615b755))
* roll to Chrome 129.0.6668.89 ([#13150](https://github.com/puppeteer/puppeteer/issues/13150)) ([cab123e](https://github.com/puppeteer/puppeteer/commit/cab123e68ee2e50a66da434346ec39afe000b2f7))
* **webdriver:** dispose child browsing contexts ([#13137](https://github.com/puppeteer/puppeteer/issues/13137)) ([378762d](https://github.com/puppeteer/puppeteer/commit/378762d6e170040901f5c3ccb66968db37f44051))


## [23.4.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.4.0...puppeteer-v23.4.1) (2024-09-25)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.4.0 to 23.4.1


### Bug Fixes

* roll to Chrome 129.0.6668.70 ([#13125](https://github.com/puppeteer/puppeteer/issues/13125)) ([dfd2e64](https://github.com/puppeteer/puppeteer/commit/dfd2e64802d6b2948cb99e5608f707b0013f847b))
* show browser in error ([#13119](https://github.com/puppeteer/puppeteer/issues/13119)) ([98cad4e](https://github.com/puppeteer/puppeteer/commit/98cad4eb1f88585ea0c222d9c19a3eb3de3c78fd))
* **webdriver:** convert console method to type ([#13120](https://github.com/puppeteer/puppeteer/issues/13120)) ([429319e](https://github.com/puppeteer/puppeteer/commit/429319e6fe562a9163463a374574533575beab9a))


## [23.4.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.3.1...puppeteer-v23.4.0) (2024-09-18)


### Features

* roll to Chrome 129.0.6668.58 ([#13099](https://github.com/puppeteer/puppeteer/issues/13099)) ([6614660](https://github.com/puppeteer/puppeteer/commit/661466031edf730022bce4d706f76dd0b04dea05))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.3.1 to 23.4.0


### Bug Fixes

* **extensions:** handle attachToTarget command correctly ([#13095](https://github.com/puppeteer/puppeteer/issues/13095)) ([61fa00e](https://github.com/puppeteer/puppeteer/commit/61fa00eae5a296c9a616d163423b5093f004dd32)), closes [#13089](https://github.com/puppeteer/puppeteer/issues/13089)
* roll to Firefox 130.0.1 ([#13100](https://github.com/puppeteer/puppeteer/issues/13100)) ([a1df1dc](https://github.com/puppeteer/puppeteer/commit/a1df1dce9956e666f150240369475dd04d20b8c8))


## [23.3.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.3.0...puppeteer-v23.3.1) (2024-09-16)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.3.0 to 23.3.1


### Bug Fixes

* improve Precision of Paper Sizes in Inches to 4 Decimal Places ([#13087](https://github.com/puppeteer/puppeteer/issues/13087)) ([47d6c44](https://github.com/puppeteer/puppeteer/commit/47d6c4423e61b42867840e6714567b529040593a))
* roll to Chrome 128.0.6613.137 ([#13071](https://github.com/puppeteer/puppeteer/issues/13071)) ([27df147](https://github.com/puppeteer/puppeteer/commit/27df147a28684cd0a9ad2229e63e740eceb63615))


## [23.3.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.2.2...puppeteer-v23.3.0) (2024-09-04)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.3.1 to 2.4.0


### Features

* roll to Firefox 130.0 ([#13046](https://github.com/puppeteer/puppeteer/issues/13046)) ([f311a65](https://github.com/puppeteer/puppeteer/commit/f311a65f6b5d15ece791844959d6cd18165c2474))


### Bug Fixes

* incorrect y-coordinate in ElementHandle.boxModel() ([#13045](https://github.com/puppeteer/puppeteer/issues/13045)) ([afe77af](https://github.com/puppeteer/puppeteer/commit/afe77af53ba672dda487c6ceccf66ea7c7908105))
* revert the use of structuredClone ([#13044](https://github.com/puppeteer/puppeteer/issues/13044)) ([96b3a8b](https://github.com/puppeteer/puppeteer/commit/96b3a8b33f648fdae43179ab237182683836b8ec))


## [23.2.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.2.1...puppeteer-v23.2.2) (2024-09-03)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.2.1 to 23.2.2


### Bug Fixes

* improve frame session management ([#13022](https://github.com/puppeteer/puppeteer/issues/13022)) ([049e13c](https://github.com/puppeteer/puppeteer/commit/049e13c5f84d82c21d73cacc4ecdf29afcbdc32f))
* incorrect error message when encountering launch browser error. ([#13021](https://github.com/puppeteer/puppeteer/issues/13021)) ([9aef4ab](https://github.com/puppeteer/puppeteer/commit/9aef4ab63878dfa64a6675b201d80e3dfaf9b065))
* roll to Chrome 128.0.6613.119 ([#13035](https://github.com/puppeteer/puppeteer/issues/13035)) ([cd4f340](https://github.com/puppeteer/puppeteer/commit/cd4f340230652903d6f1432c5ed79ddaee89fefd))


## [23.2.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.2.0...puppeteer-v23.2.1) (2024-08-29)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.2.0 to 23.2.1


### Bug Fixes

* roll to Chrome 128.0.6613.86 ([#13013](https://github.com/puppeteer/puppeteer/issues/13013)) ([d41cc51](https://github.com/puppeteer/puppeteer/commit/d41cc5136ce5d431a0a522cbc4238b6c08383e2f))


## [23.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.1.1...puppeteer-v23.2.0) (2024-08-26)


### Features

* roll to Chrome 128.0.6613.84 ([#13005](https://github.com/puppeteer/puppeteer/issues/13005)) ([132a7ce](https://github.com/puppeteer/puppeteer/commit/132a7ce624ed8a9529c19c057c486bea2e737cb7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.1.1 to 23.2.0


## [23.1.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.1.0...puppeteer-v23.1.1) (2024-08-21)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.1.0 to 23.1.1


### Bug Fixes

* roll to Firefox 129.0.1 ([#12975](https://github.com/puppeteer/puppeteer/issues/12975)) ([778ae6f](https://github.com/puppeteer/puppeteer/commit/778ae6f2821e4ae5a5b3f65736a4b6bad2b0a56e))
* roll to Firefox 129.0.2 ([#12987](https://github.com/puppeteer/puppeteer/issues/12987)) ([d934cf5](https://github.com/puppeteer/puppeteer/commit/d934cf52cd9194a90f1ca2f2c76fd6471bbd0033))


## [23.1.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.0.2...puppeteer-v23.1.0) (2024-08-14)


### Features

* improve type inference for selectors by adopting "typed-query-selector" ([#12950](https://github.com/puppeteer/puppeteer/issues/12950)) ([77b729e](https://github.com/puppeteer/puppeteer/commit/77b729e23e7d1c595460e991d2ecf3c1f9786373))
* support signal in WaitFor functions ([#12926](https://github.com/puppeteer/puppeteer/issues/12926)) ([67e3be8](https://github.com/puppeteer/puppeteer/commit/67e3be80ca9ea050cfb023024af3b6f5b58a9bed))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.3.0 to 2.3.1


### Bug Fixes

* add missing partitionKey for page.deleteCookie() ([#12815](https://github.com/puppeteer/puppeteer/issues/12815)) ([41df7cb](https://github.com/puppeteer/puppeteer/commit/41df7cb2885c0bcafa1c95ac33451913897a4391))
* **firefox:** back up user.js as well ([#12943](https://github.com/puppeteer/puppeteer/issues/12943)) ([9feda9c](https://github.com/puppeteer/puppeteer/commit/9feda9cdfce81cb375193d0efa9efa0c13b2818d))
* roll to Chrome 127.0.6533.119 ([#12951](https://github.com/puppeteer/puppeteer/issues/12951)) ([cc2eda2](https://github.com/puppeteer/puppeteer/commit/cc2eda26620c9c20691b1bd151ccd2d87f979344))
* **webdriver:** throw an error on pipe provided for Firefox ([#12934](https://github.com/puppeteer/puppeteer/issues/12934)) ([bec089c](https://github.com/puppeteer/puppeteer/commit/bec089c20c4d5f07e77e979caea5906afb45c8b2))


## [23.0.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.0.1...puppeteer-v23.0.2) (2024-08-08)


### Bug Fixes

* roll to Chrome 127.0.6533.99 ([#12910](https://github.com/puppeteer/puppeteer/issues/12910)) ([ffc90b2](https://github.com/puppeteer/puppeteer/commit/ffc90b2fc19e5347e59e7e2e361733c602759567))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.0.1 to 23.0.2


## [23.0.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v23.0.0...puppeteer-v23.0.1) (2024-08-07)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 23.0.0 to 23.0.1


### Bug Fixes

* **webdriver:** fix default protocol for Firefox ([#12902](https://github.com/puppeteer/puppeteer/issues/12902)) ([054916b](https://github.com/puppeteer/puppeteer/commit/054916b50cd943759d2ff1b33b397d6cd5e8687e))


## [23.0.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.15.0...puppeteer-v23.0.0) (2024-08-07)


### ⚠ BREAKING CHANGES

* remove deprecated Frame.isOOPFrame() ([#12897](https://github.com/puppeteer/puppeteer/issues/12897))
* use Uint8Array instead of Buffer for browser compatibility ([#12823](https://github.com/puppeteer/puppeteer/issues/12823))
* remove isIncognito ([#12830](https://github.com/puppeteer/puppeteer/issues/12830))
* support multiple browser downloads for Puppeteer ([#12795](https://github.com/puppeteer/puppeteer/issues/12795))
* remove deprecated functions for CustomQueryHandler ([#12824](https://github.com/puppeteer/puppeteer/issues/12824))
* rename ignoreHttpsErrors to acceptInsecureCerts ([#12756](https://github.com/puppeteer/puppeteer/issues/12756))
* rename product to browser ([#12757](https://github.com/puppeteer/puppeteer/issues/12757))
* default to WebDriver BiDi for Firefox ([#12732](https://github.com/puppeteer/puppeteer/issues/12732))
* replace dynamic imports with static dependency injection ([#12710](https://github.com/puppeteer/puppeteer/issues/12710))
* remove whitespace normalization from a11y selectors ([#12693](https://github.com/puppeteer/puppeteer/issues/12693))


### Features

* default to WebDriver BiDi for Firefox ([#12732](https://github.com/puppeteer/puppeteer/issues/12732)) ([6422dc2](https://github.com/puppeteer/puppeteer/commit/6422dc230aa4205e9ca1aada47cf46f0a44f0bb3))
* pin Firefox to stable_129.0 ([#12890](https://github.com/puppeteer/puppeteer/issues/12890)) ([311b57b](https://github.com/puppeteer/puppeteer/commit/311b57b96d213a804e084ff8f62f10ecc950bb11))
* rename ignoreHttpsErrors to acceptInsecureCerts ([#12756](https://github.com/puppeteer/puppeteer/issues/12756)) ([04e2263](https://github.com/puppeteer/puppeteer/commit/04e2263d4bfeb6ad396a4312c79b502a73b35e31))
* rename product to browser ([#12757](https://github.com/puppeteer/puppeteer/issues/12757)) ([ca82e8e](https://github.com/puppeteer/puppeteer/commit/ca82e8e070dd1ddb627d034888782133d8cad49c))
* support multiple browser downloads for Puppeteer ([#12795](https://github.com/puppeteer/puppeteer/issues/12795)) ([4d4b358](https://github.com/puppeteer/puppeteer/commit/4d4b358dca34ab23df075efd08a62947e6feb98c))
* **webdriver:** support WebDriver capabilities in puppeteer.connect ([#12877](https://github.com/puppeteer/puppeteer/issues/12877)) ([897df47](https://github.com/puppeteer/puppeteer/commit/897df478b4b64ac9b146378d32b1f1b8347c6263))


### Code Refactoring

* remove deprecated Frame.isOOPFrame() ([#12897](https://github.com/puppeteer/puppeteer/issues/12897)) ([88cd5e4](https://github.com/puppeteer/puppeteer/commit/88cd5e4d37d2056dad7c5d80c627d5760c05d77d))
* remove deprecated functions for CustomQueryHandler ([#12824](https://github.com/puppeteer/puppeteer/issues/12824)) ([5e2043d](https://github.com/puppeteer/puppeteer/commit/5e2043df7ff6230c1cd6f2b126087232d91c66d5))
* remove isIncognito ([#12830](https://github.com/puppeteer/puppeteer/issues/12830)) ([9e82e2b](https://github.com/puppeteer/puppeteer/commit/9e82e2b640378314e1ea5102727bdd4274baf57b))
* replace dynamic imports with static dependency injection ([#12710](https://github.com/puppeteer/puppeteer/issues/12710)) ([3aacc1c](https://github.com/puppeteer/puppeteer/commit/3aacc1c80792dee34ebbaa3cbf9d32d2baf2b139))
* use Uint8Array instead of Buffer for browser compatibility ([#12823](https://github.com/puppeteer/puppeteer/issues/12823)) ([f3377e1](https://github.com/puppeteer/puppeteer/commit/f3377e1708a72f7f4395678492755f577dd57936))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.15.0 to 23.0.0


### Bug Fixes

* only wait for page and frame targets when connecting ([#12888](https://github.com/puppeteer/puppeteer/issues/12888)) ([22f67d4](https://github.com/puppeteer/puppeteer/commit/22f67d4fb446f2d4553b4d4101038c79cbffbf0e))
* remove whitespace normalization from a11y selectors ([#12693](https://github.com/puppeteer/puppeteer/issues/12693)) ([d5f9a33](https://github.com/puppeteer/puppeteer/commit/d5f9a333c1d2052f41bdcd0ad773f5dbb202ef09))


## [22.15.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.14.0...puppeteer-v22.15.0) (2024-07-31)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.14.0 to 22.15.0


### Features

* support AbortSignal in waitForNavigation ([#12852](https://github.com/puppeteer/puppeteer/issues/12852)) ([9a35f7b](https://github.com/puppeteer/puppeteer/commit/9a35f7ba189e3a0250a4bd2e3b40efee9c6e2b18))


### Bug Fixes

* handle the string predicate in waitForFrame ([#12849](https://github.com/puppeteer/puppeteer/issues/12849)) ([9ec5f25](https://github.com/puppeteer/puppeteer/commit/9ec5f25ea6f9e60d250c7413e122a5c32faeb3f9))
* roll to Chrome 127.0.6533.88 ([#12858](https://github.com/puppeteer/puppeteer/issues/12858)) ([4b0e889](https://github.com/puppeteer/puppeteer/commit/4b0e8890ef9fd4e581da49072f1a04118087a2a2))
* **webdriver:** implement request timings ([#12831](https://github.com/puppeteer/puppeteer/issues/12831)) ([409d244](https://github.com/puppeteer/puppeteer/commit/409d244aed480fbb5254f852afb16bd101692f9a))


## [22.14.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.13.1...puppeteer-v22.14.0) (2024-07-25)


### Features

* roll to Chrome 127.0.6533.72 ([#12821](https://github.com/puppeteer/puppeteer/issues/12821)) ([8e6fd74](https://github.com/puppeteer/puppeteer/commit/8e6fd74de15c773ffd046b313b681a4afd162d38))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.2.4 to 2.3.0


### Bug Fixes

* **webdriver:** allow accessing raw CDP connection when using WebDriver BiDi ([#12771](https://github.com/puppeteer/puppeteer/issues/12771)) ([059cacc](https://github.com/puppeteer/puppeteer/commit/059caccad7dab47f2351f1307210aef77c356bb3))
* **webdriver:** dispose resources to abort active listeners ([#12817](https://github.com/puppeteer/puppeteer/issues/12817)) ([c452c5f](https://github.com/puppeteer/puppeteer/commit/c452c5f7e5b9bb202d3dac35eeac031fb8ff55bb))
* **webdriver:** in page.goto consider only the first emitted navigation event ([#12777](https://github.com/puppeteer/puppeteer/issues/12777)) ([cd740b2](https://github.com/puppeteer/puppeteer/commit/cd740b2eeffc6cf6b38a94522e87b1a597647513))


## [22.13.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.13.0...puppeteer-v22.13.1) (2024-07-17)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.2.3 to 2.2.4


### Bug Fixes

* include Puppeteer version into utility world name ([#12754](https://github.com/puppeteer/puppeteer/issues/12754)) ([2e86012](https://github.com/puppeteer/puppeteer/commit/2e860124b94787ec6602212efe78aca2034f2136))
* roll to Chrome 126.0.6478.182 (r1300313) ([#12764](https://github.com/puppeteer/puppeteer/issues/12764)) ([a98ac2e](https://github.com/puppeteer/puppeteer/commit/a98ac2e6ea052a88e180612375cf087f732603b8))
* **webdriver:** add postData,hasPostData,resourceType from cdp-over-bidi ([#12739](https://github.com/puppeteer/puppeteer/issues/12739)) ([dc5379e](https://github.com/puppeteer/puppeteer/commit/dc5379e744979c9a58905ed3d939c2722a188c8d))
* **webdriver:** support securityDetails with cdp-over-bidi ([#12736](https://github.com/puppeteer/puppeteer/issues/12736)) ([4308104](https://github.com/puppeteer/puppeteer/commit/43081045a3af3f4aaeb7595591ac6f774baf21ca))


## [22.13.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.12.1...puppeteer-v22.13.0) (2024-07-11)


### Bug Fixes

* add an option to not wait for fonts when pdf printing ([#12675](https://github.com/puppeteer/puppeteer/issues/12675)) ([a573dbd](https://github.com/puppeteer/puppeteer/commit/a573dbd7ed858651b92dc5deafe2ebdbe86b5f4c))
* add browser entrypoint to package.json of puppeteer-core ([#12729](https://github.com/puppeteer/puppeteer/issues/12729)) ([669c86b](https://github.com/puppeteer/puppeteer/commit/669c86b203e7ad18e7be3d6fc847872c48d05617))
* **cli:** puppeteer CLI should read the project configuration ([#12730](https://github.com/puppeteer/puppeteer/issues/12730)) ([bca750a](https://github.com/puppeteer/puppeteer/commit/bca750afe204cc3bafb0a34a0f92b0bac5a6a55f))
* correct validation of the quality parameter in page.screenshot  ([#12725](https://github.com/puppeteer/puppeteer/issues/12725)) ([2f8abd7](https://github.com/puppeteer/puppeteer/commit/2f8abd7a6c9be7f3ee5123e55da76c51ea132c58))
* do not allow switching tabs while the screenshot operation is in progress ([#12724](https://github.com/puppeteer/puppeteer/issues/12724)) ([a3345f6](https://github.com/puppeteer/puppeteer/commit/a3345f6686c7634904fbd72df12588f3e230878f))
* don't rely on Buffer to be present ([#12702](https://github.com/puppeteer/puppeteer/issues/12702)) ([3c02cef](https://github.com/puppeteer/puppeteer/commit/3c02ceffa366f747c84fa38af058c8b2dab7e3c5))
* ensure existing targets are attached to pages ([#12677](https://github.com/puppeteer/puppeteer/issues/12677)) ([d1d8489](https://github.com/puppeteer/puppeteer/commit/d1d8489a9616375f5195ea226b7123345402030b))
* make sure bindings are working after a page is restored from bfcache ([#12663](https://github.com/puppeteer/puppeteer/issues/12663)) ([570b1a8](https://github.com/puppeteer/puppeteer/commit/570b1a862eed1ce86dba318e143d7d4191a89c3b))
* support evaluateOnNewDocument for out-of-process frames ([#12714](https://github.com/puppeteer/puppeteer/issues/12714)) ([eac7cda](https://github.com/puppeteer/puppeteer/commit/eac7cda537255eedb61e4ac689c1c919f892d491))
* support out-of-process iframes in exposeFunction ([#12722](https://github.com/puppeteer/puppeteer/issues/12722)) ([b6b536b](https://github.com/puppeteer/puppeteer/commit/b6b536bb2f38b052b12a8902be348132c78a04f6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.12.1 to 22.13.0


### Features

* **webdriver:** implement page.setCacheEnabled ([#12691](https://github.com/puppeteer/puppeteer/issues/12691)) ([e44d900](https://github.com/puppeteer/puppeteer/commit/e44d900c0cb7c725f88a477375f7b9658ef92eb8))


## [22.12.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.12.0...puppeteer-v22.12.1) (2024-06-26)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.12.0 to 22.12.1


### Bug Fixes

* execution contexts might be created before previous is destroyed ([#12666](https://github.com/puppeteer/puppeteer/issues/12666)) ([db642d1](https://github.com/puppeteer/puppeteer/commit/db642d1d6975a9b12700a471f6cacc8daf6bd04d))
* reset the viewport after taking a fullPage screenshot if defaultViewport is null ([#12650](https://github.com/puppeteer/puppeteer/issues/12650)) ([0a32283](https://github.com/puppeteer/puppeteer/commit/0a32283cfccba306fa20dc5b5c31487a6d8fb201))
* roll to Chrome 126.0.6478.126 (r1300313) ([#12656](https://github.com/puppeteer/puppeteer/issues/12656)) ([32ed82c](https://github.com/puppeteer/puppeteer/commit/32ed82c623905755944b1cf2d9e0cd9d952c8f94))
* use RAF-based polling for ARIA selectors ([#12664](https://github.com/puppeteer/puppeteer/issues/12664)) ([56d1d3f](https://github.com/puppeteer/puppeteer/commit/56d1d3f8b731d18c6aa9cc3d6de9c722b93a7a1e))


## [22.12.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.11.2...puppeteer-v22.12.0) (2024-06-21)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.11.2 to 22.12.0


### Features

* support AbortSignal in page.waitForRequest/Response/NetworkIdle/Frame ([#12621](https://github.com/puppeteer/puppeteer/issues/12621)) ([54ecea7](https://github.com/puppeteer/puppeteer/commit/54ecea7db5180ec024d81a7ac14c73387550d1d6))
* **webdriver:** support for `PageEvent.Popup` ([#12612](https://github.com/puppeteer/puppeteer/issues/12612)) ([293926b](https://github.com/puppeteer/puppeteer/commit/293926b61a3552f9ec7e9a62383688e775f12df0))


### Bug Fixes

* **performance:** clear targets on browser context close ([#12609](https://github.com/puppeteer/puppeteer/issues/12609)) ([6609758](https://github.com/puppeteer/puppeteer/commit/660975824ac94b85a260e99b95db0a11bb5a2e07))
* roll to Chrome 126.0.6478.62 (r1300313) ([#12615](https://github.com/puppeteer/puppeteer/issues/12615)) ([80dd131](https://github.com/puppeteer/puppeteer/commit/80dd1316a09e87dda65f68e5cbe299d335147599))
* roll to Chrome 126.0.6478.63 (r1300313) ([#12632](https://github.com/puppeteer/puppeteer/issues/12632)) ([20ed8fc](https://github.com/puppeteer/puppeteer/commit/20ed8fcb1415501525368305a9bc509af03d63ff))


## [22.11.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.11.1...puppeteer-v22.11.2) (2024-06-18)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.11.1 to 22.11.2


### Bug Fixes

* **deps:** bump ws to 8.17.1 ([#12605](https://github.com/puppeteer/puppeteer/issues/12605)) ([49bcb25](https://github.com/puppeteer/puppeteer/commit/49bcb2537e45c903e6c1d5d360b0077f0153c5d2))


## [22.11.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.11.0...puppeteer-v22.11.1) (2024-06-17)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.11.0 to 22.11.1


### Bug Fixes

* connection closed error should be a rejected promise ([#12575](https://github.com/puppeteer/puppeteer/issues/12575)) ([e36ce8b](https://github.com/puppeteer/puppeteer/commit/e36ce8bee18b4a8c7bf4c0692269d0095d186d06))
* ensure selector parser falls back to CSS ([#12585](https://github.com/puppeteer/puppeteer/issues/12585)) ([80783fe](https://github.com/puppeteer/puppeteer/commit/80783fef5a298d2c57f64415f1882d0b051625ef))
* implement nested selector parsing ([#12587](https://github.com/puppeteer/puppeteer/issues/12587)) ([3874300](https://github.com/puppeteer/puppeteer/commit/38743007159beedcad8571c08c3320235eb93f76))
* roll to Chrome 126.0.6478.61 (r1300313) ([#12586](https://github.com/puppeteer/puppeteer/issues/12586)) ([772e088](https://github.com/puppeteer/puppeteer/commit/772e088f9cc566832b36066c3a6627b5afd47769))


## [22.11.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.10.1...puppeteer-v22.11.0) (2024-06-12)


### Features

* allow creating ElementHandles from the accessibility tree snapshot ([#12233](https://github.com/puppeteer/puppeteer/issues/12233)) ([0057f3f](https://github.com/puppeteer/puppeteer/commit/0057f3fe0a8d179cacb18495c96987310f83d5d9))
* roll to Chrome 126.0.6478.55 (r1300313) ([#12572](https://github.com/puppeteer/puppeteer/issues/12572)) ([f5bc2b5](https://github.com/puppeteer/puppeteer/commit/f5bc2b53aea0d159dd2b7f4c7a0f7a8a224ae6e8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.10.1 to 22.11.0


### Bug Fixes

* do not wait for extension page targets on connect ([#12574](https://github.com/puppeteer/puppeteer/issues/12574)) ([5f2ee98](https://github.com/puppeteer/puppeteer/commit/5f2ee98c5b93b0a52a98a1d8237189b8b0d15a10))


## [22.10.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.10.0...puppeteer-v22.10.1) (2024-06-11)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.10.0 to 22.10.1


### Bug Fixes

* add a way to run page.$$ without the isolation ([#12539](https://github.com/puppeteer/puppeteer/issues/12539)) ([03e10a7](https://github.com/puppeteer/puppeteer/commit/03e10a7559f184f8b1adfef83714f36ee26007ca))
* align network conditions presets with DevTools ([#12542](https://github.com/puppeteer/puppeteer/issues/12542)) ([ee10745](https://github.com/puppeteer/puppeteer/commit/ee1074559d5290eaa91e7757ecc048e81022fe48))
* exposed functions should only be called once ([#12560](https://github.com/puppeteer/puppeteer/issues/12560)) ([8aac8b1](https://github.com/puppeteer/puppeteer/commit/8aac8b1ccb1704f0a67165a7e06427c7db0b4b2f))
* **performance:** use Runtime.getProperties for improved performance ([#12561](https://github.com/puppeteer/puppeteer/issues/12561)) ([8b2059f](https://github.com/puppeteer/puppeteer/commit/8b2059f82a801daaa9d27f48d1925bd1335020c6))
* roll to Chrome 125.0.6422.141 (r1287751) ([#12509](https://github.com/puppeteer/puppeteer/issues/12509)) ([c4fdd10](https://github.com/puppeteer/puppeteer/commit/c4fdd102e9dd163e5797b2de9024e52ba6efe3bb))
* waitForSelector should work for pseudo classes ([#12545](https://github.com/puppeteer/puppeteer/issues/12545)) ([0b2999f](https://github.com/puppeteer/puppeteer/commit/0b2999f7b17d54f368f0a03a45c095e879b7245b))
* **webdriver:** default values for touch events ([#12554](https://github.com/puppeteer/puppeteer/issues/12554)) ([4d62988](https://github.com/puppeteer/puppeteer/commit/4d6298837fa85cce39394bfd63b04358b826db53))
* **webdriver:** frame url should not be updated on navigationStarted ([#12536](https://github.com/puppeteer/puppeteer/issues/12536)) ([7d0423b](https://github.com/puppeteer/puppeteer/commit/7d0423b12cb5987caf0cc0cd84976986ffc93c98))
* **webdriver:** HTTPRequest redirect chain from first request ([#12506](https://github.com/puppeteer/puppeteer/issues/12506)) ([68fd771](https://github.com/puppeteer/puppeteer/commit/68fd7712932f94730b6186107a0509c233938084))


## [22.10.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.9.0...puppeteer-v22.10.0) (2024-05-24)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.9.0 to 22.10.0


### Features

* support running Puppeteer in extensions ([#12459](https://github.com/puppeteer/puppeteer/issues/12459)) ([3c6f01a](https://github.com/puppeteer/puppeteer/commit/3c6f01a31dbaef0fdd7f477302b7daa95e0c0929))


### Bug Fixes

* providing null to page.authenticate should disable authentication ([#12203](https://github.com/puppeteer/puppeteer/issues/12203)) ([f375267](https://github.com/puppeteer/puppeteer/commit/f375267e790f61ee2a93d1f2811bef7539fc58d4))
* roll to Chrome 125.0.6422.76 (r1287751) ([#12477](https://github.com/puppeteer/puppeteer/issues/12477)) ([d83d9a6](https://github.com/puppeteer/puppeteer/commit/d83d9a6ae2b66b165a4aef5ae59ef3885bfbcff9))
* roll to Chrome 125.0.6422.78 (r1287751) ([#12484](https://github.com/puppeteer/puppeteer/issues/12484)) ([f30977f](https://github.com/puppeteer/puppeteer/commit/f30977f8172e3cca605514295fff2086bcd154be))
* **webdriver:** emit single HTTPRequest for Auth requests ([#12455](https://github.com/puppeteer/puppeteer/issues/12455)) ([637e827](https://github.com/puppeteer/puppeteer/commit/637e82796b492bcbc82d26753a019972b31a26fd))


## [22.9.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.8.2...puppeteer-v22.9.0) (2024-05-16)


### Features

* roll to Chrome 125.0.6422.60 (r1287751) ([#12446](https://github.com/puppeteer/puppeteer/issues/12446)) ([3de9fd3](https://github.com/puppeteer/puppeteer/commit/3de9fd3f4c88ec0bae190d385091c96badac3c1a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.8.2 to 22.9.0


## [22.8.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.8.1...puppeteer-v22.8.2) (2024-05-14)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.8.1 to 22.8.2


### Bug Fixes

* roll to Chrome 124.0.6367.207 (r1274542) ([#12436](https://github.com/puppeteer/puppeteer/issues/12436)) ([0ef1920](https://github.com/puppeteer/puppeteer/commit/0ef192097a118ba83abb42fb5a9a54226c48a59b))
* **webdriver:** prefer globalThis over window to make it work in Firefox ([#12438](https://github.com/puppeteer/puppeteer/issues/12438)) ([33c6069](https://github.com/puppeteer/puppeteer/commit/33c606922725894f0823ad1c80f3d354c85992a2))


## [22.8.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.8.0...puppeteer-v22.8.1) (2024-05-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.8.0 to 22.8.1


### Bug Fixes

* roll to Chrome 124.0.6367.155 (r1274542) ([#12414](https://github.com/puppeteer/puppeteer/issues/12414)) ([d0cd710](https://github.com/puppeteer/puppeteer/commit/d0cd710e49884005f8322ea372b7696e3054d683))
* roll to Chrome 124.0.6367.201 (r1274542) ([#12420](https://github.com/puppeteer/puppeteer/issues/12420)) ([60f035c](https://github.com/puppeteer/puppeteer/commit/60f035cdc93ea87d40ea426097ea1f67754685e7))


## [22.8.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.7.1...puppeteer-v22.8.0) (2024-05-06)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.7.1 to 22.8.0


### Features

* **webdriver:** support `page.setUserAgent` for WebDriver BiDi ([#12330](https://github.com/puppeteer/puppeteer/issues/12330)) ([1f99e66](https://github.com/puppeteer/puppeteer/commit/1f99e669a1d644d1d17d5a7e926fbeafb8d231c6))
* **webdriver:** support ARIA selectors ([#12315](https://github.com/puppeteer/puppeteer/issues/12315)) ([88b46ee](https://github.com/puppeteer/puppeteer/commit/88b46ee5020d30355a3e52512030e1162502e4f5))


### Bug Fixes

* **cdp:** throw on closed connection ([#12352](https://github.com/puppeteer/puppeteer/issues/12352)) ([28a8d0f](https://github.com/puppeteer/puppeteer/commit/28a8d0ffb6345309df2bb23c9a5e2bd8be2f059d))
* deprecate CDP for Firefox ([#12349](https://github.com/puppeteer/puppeteer/issues/12349)) ([dffad28](https://github.com/puppeteer/puppeteer/commit/dffad28a429596be66741fb263e616437d7b965d))
* disable IsolateSandboxedIframes trial to prevent flakiness ([#12381](https://github.com/puppeteer/puppeteer/issues/12381)) ([461a8ff](https://github.com/puppeteer/puppeteer/commit/461a8ff92ff0e3887b4ceb4e4b7d1198eb8f7901))
* remove --disable-field-trial-config ([#12377](https://github.com/puppeteer/puppeteer/issues/12377)) ([54a6377](https://github.com/puppeteer/puppeteer/commit/54a6377d7d505e4580c78c06bb8a2c538bbf6857))
* roll to Chrome 124.0.6367.91 (r1274542) ([#12344](https://github.com/puppeteer/puppeteer/issues/12344)) ([fedd8a9](https://github.com/puppeteer/puppeteer/commit/fedd8a9628aed134e8fc725b4e6c3cb20d546581))
* turn on PdfOopif for PDF viewer ([#12370](https://github.com/puppeteer/puppeteer/issues/12370)) ([73d7692](https://github.com/puppeteer/puppeteer/commit/73d7692ae93959239f909cdee6ee849f8a70b7e5))
* **webdriver:** redirects emitting events ([#12338](https://github.com/puppeteer/puppeteer/issues/12338)) ([e1606ac](https://github.com/puppeteer/puppeteer/commit/e1606acfc800ab067ec5a8db336a70dba57b0827))


## [22.7.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.7.0...puppeteer-v22.7.1) (2024-04-25)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.2.2 to 2.2.3


### Bug Fixes

* roll to Chrome 124.0.6367.78 (r1274542) ([#12314](https://github.com/puppeteer/puppeteer/issues/12314)) ([1241ccc](https://github.com/puppeteer/puppeteer/commit/1241ccc90895e6a641a71ec3a6c2c97db96ef5c8))


## [22.7.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.6.5...puppeteer-v22.7.0) (2024-04-23)


### Features

* roll to Chrome 124.0.6367.60 (r1274542) ([#12305](https://github.com/puppeteer/puppeteer/issues/12305)) ([ed9d7dd](https://github.com/puppeteer/puppeteer/commit/ed9d7dd2f54595604639d0c9fdcaf9d5765daeeb))
* **webdriver:** support Network interception ([#12279](https://github.com/puppeteer/puppeteer/issues/12279)) ([8fa52a5](https://github.com/puppeteer/puppeteer/commit/8fa52a50bdb138444c0769557a8bdd6ac2784453))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.6.5 to 22.7.0


### Bug Fixes

* **performance:** cache isolatedHandle ([#12150](https://github.com/puppeteer/puppeteer/issues/12150)) ([9a17ec3](https://github.com/puppeteer/puppeteer/commit/9a17ec3b2a5e804bafc4d8c624740c148721e03e))


## [22.6.5](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.6.4...puppeteer-v22.6.5) (2024-04-15)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.2.1 to 2.2.2


### Bug Fixes

* remove NetworkServiceInProcess2 set by default ([#12261](https://github.com/puppeteer/puppeteer/issues/12261)) ([ff4f70f](https://github.com/puppeteer/puppeteer/commit/ff4f70f4ae7ca8deb0becbec2e49b35322dba336)), closes [#12257](https://github.com/puppeteer/puppeteer/issues/12257)
* use setImmediate to reduce flakiness when processing events ([#12264](https://github.com/puppeteer/puppeteer/issues/12264)) ([73403b3](https://github.com/puppeteer/puppeteer/commit/73403b323ec0dd8a08c164cb2c07751451215788))


## [22.6.4](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.6.3...puppeteer-v22.6.4) (2024-04-11)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.6.3 to 22.6.4


### Bug Fixes

* **a11y:** query only unignored nodes ([#12224](https://github.com/puppeteer/puppeteer/issues/12224)) ([e20cd64](https://github.com/puppeteer/puppeteer/commit/e20cd64fff374c4113777912c193f4a5d7d04297))
* retain stale main frame for longer ([#12225](https://github.com/puppeteer/puppeteer/issues/12225)) ([aa5b182](https://github.com/puppeteer/puppeteer/commit/aa5b1824a5c82005fcfc05b002facfbbb9810f8f))
* roll to Chrome 123.0.6312.122 (r1262506) ([#12248](https://github.com/puppeteer/puppeteer/issues/12248)) ([50b6659](https://github.com/puppeteer/puppeteer/commit/50b66591e70a7b6907d86594d7dacee6e76afc2d))
* **webdriver:** suppress error for error code errors ([5f7254c](https://github.com/puppeteer/puppeteer/commit/5f7254c41c7c1bda82477488f10254d204373d54))


## [22.6.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.6.2...puppeteer-v22.6.3) (2024-04-05)


### Bug Fixes

* check if executablePath exists ([#12201](https://github.com/puppeteer/puppeteer/issues/12201)) ([4ec0280](https://github.com/puppeteer/puppeteer/commit/4ec02800801d441238d6160a933f88f98c5f7165))
* roll to Chrome 123.0.6312.105 (r1262506) ([#12209](https://github.com/puppeteer/puppeteer/issues/12209)) ([ee31272](https://github.com/puppeteer/puppeteer/commit/ee312721152cce61a9e9cb2b78b71b40c4fa9e64))
* wait for fonts before pdf printing ([#12175](https://github.com/puppeteer/puppeteer/issues/12175)) ([59bffce](https://github.com/puppeteer/puppeteer/commit/59bffce9720b4d5e5204b26b335735e0a5ca9cc1))
* **webdriver:** request redirect chain ([#12168](https://github.com/puppeteer/puppeteer/issues/12168)) ([d345055](https://github.com/puppeteer/puppeteer/commit/d345055af3c63effbdfb2751274b9d7137b8a308))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.2.0 to 2.2.1


## [22.6.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.6.1...puppeteer-v22.6.2) (2024-03-28)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.6.1 to 22.6.2


### Bug Fixes

* roll to Chrome 123.0.6312.86 (r1262506) ([#12156](https://github.com/puppeteer/puppeteer/issues/12156)) ([29637f2](https://github.com/puppeteer/puppeteer/commit/29637f2b8f2dc1d684dbbb62d1a75857e016be33))


## [22.6.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.6.0...puppeteer-v22.6.1) (2024-03-25)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.6.0 to 22.6.1


### Bug Fixes

* apply timeout to waiting for a response ([#12142](https://github.com/puppeteer/puppeteer/issues/12142)) ([ac1767d](https://github.com/puppeteer/puppeteer/commit/ac1767da0b4214ced548a62dd737e2863f92c715))
* reload should not resolve early on fragment navigations ([#12119](https://github.com/puppeteer/puppeteer/issues/12119)) ([d476031](https://github.com/puppeteer/puppeteer/commit/d4760317c9bd359c9ecdb5f36231449dae16a8d2))
* support clip in ElementHandle.screenshot ([#12115](https://github.com/puppeteer/puppeteer/issues/12115)) ([b096ffa](https://github.com/puppeteer/puppeteer/commit/b096ffaa0359078bd5748b53b67e87c9453c7196))


## [22.6.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.5.0...puppeteer-v22.6.0) (2024-03-20)


### Features

* roll to Chrome 123.0.6312.58 (r1262506) ([#12110](https://github.com/puppeteer/puppeteer/issues/12110)) ([6f5b3bc](https://github.com/puppeteer/puppeteer/commit/6f5b3bc9b88c6d3204dda396f8963591ea6eb883))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.5.0 to 22.6.0


### Bug Fixes

* **webdriver:** emit RequestServedFromCache for requests ([#12104](https://github.com/puppeteer/puppeteer/issues/12104)) ([6ba6bef](https://github.com/puppeteer/puppeteer/commit/6ba6bef1b99742543942cef2f6c840bd543f5dee))


## [22.5.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.4.1...puppeteer-v22.5.0) (2024-03-15)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.1.0 to 2.2.0


### Features

* deprecate `Frame.prototype.name` ([#12084](https://github.com/puppeteer/puppeteer/issues/12084)) ([0203b45](https://github.com/puppeteer/puppeteer/commit/0203b4533dfec503f9ce7fcd07c3493021a9cecb))


### Bug Fixes

* fix keyboard.sendCharacter ([#12088](https://github.com/puppeteer/puppeteer/issues/12088)) ([2637622](https://github.com/puppeteer/puppeteer/commit/26376224d557ce30c911f670c5e7625dd1a1df72))
* roll to Chrome 122.0.6261.128 (r1250580) ([#12078](https://github.com/puppeteer/puppeteer/issues/12078)) ([ef7a9ea](https://github.com/puppeteer/puppeteer/commit/ef7a9eac16dcb466b220bcb0bc06a1eac3492354))
* **webdriver:** emit CDP events ([#12058](https://github.com/puppeteer/puppeteer/issues/12058)) ([9afe424](https://github.com/puppeteer/puppeteer/commit/9afe4246bb58c30a13215a254f9326935b24ece3))


## [22.4.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.4.0...puppeteer-v22.4.1) (2024-03-08)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.4.0 to 22.4.1


### Bug Fixes

* roll to Chrome 122.0.6261.111 (r1250580) ([#12055](https://github.com/puppeteer/puppeteer/issues/12055)) ([9b31bca](https://github.com/puppeteer/puppeteer/commit/9b31bca01adeb2ce04c97d9fcb3c6b6461469f07))


## [22.4.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.3.0...puppeteer-v22.4.0) (2024-03-05)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.3.0 to 22.4.0


### Features

* implement ElementHandle.uploadFile for WebDriver BiDi ([#11963](https://github.com/puppeteer/puppeteer/issues/11963)) ([accf2b6](https://github.com/puppeteer/puppeteer/commit/accf2b6ca84c93bc700277b4e3382d894fb45a76))
* **webdriver:** support `Page.deleteCookie()` for WebDriver BiDi ([#12031](https://github.com/puppeteer/puppeteer/issues/12031)) ([7fe22b5](https://github.com/puppeteer/puppeteer/commit/7fe22b533dc96104f28696eb4ff96b2543fd8e5b))


### Bug Fixes

* roll to Chrome 122.0.6261.94 (r1250580) ([#12012](https://github.com/puppeteer/puppeteer/issues/12012)) ([7ba5529](https://github.com/puppeteer/puppeteer/commit/7ba5529f8d6f8ed085968b7a9bc6f25f8d91abd5))
* **webdriver:** wait for response if the response has not completed once navigation has finished ([#12018](https://github.com/puppeteer/puppeteer/issues/12018)) ([6d8831a](https://github.com/puppeteer/puppeteer/commit/6d8831a9c398230f2543c3862d3fe5fc7cd2b940))


## [22.3.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.2.0...puppeteer-v22.3.0) (2024-02-25)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 22.2.0 to 22.3.0


### Features

* implement permissions for WebDriver BiDi ([#11979](https://github.com/puppeteer/puppeteer/issues/11979)) ([3a467c3](https://github.com/puppeteer/puppeteer/commit/3a467c39cb60de4237081ee201bd86051887c2f2))


### Bug Fixes

* roll to Chrome 122.0.6261.69 (r1250580) ([#11991](https://github.com/puppeteer/puppeteer/issues/11991)) ([eb2c334](https://github.com/puppeteer/puppeteer/commit/eb2c33485ec473e085c6b76b45554758764349d6))
* supress viewport errors for pages that do not support changing it ([#11970](https://github.com/puppeteer/puppeteer/issues/11970)) ([753a954](https://github.com/puppeteer/puppeteer/commit/753a954456699fc06adf67837225f306711af856))


## [22.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.1.0...puppeteer-v22.2.0) (2024-02-21)


### Features

* roll to Chrome 122.0.6261.57 (r1250580) ([#11958](https://github.com/puppeteer/puppeteer/issues/11958)) ([70ad3b2](https://github.com/puppeteer/puppeteer/commit/70ad3b244826ca102737e93cd2316e451ea310e8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.0.1 to 2.1.0


### Bug Fixes

* deprecate isIncognito ([#11962](https://github.com/puppeteer/puppeteer/issues/11962)) ([ceab7a9](https://github.com/puppeteer/puppeteer/commit/ceab7a9042fe5fc3f71875e75327bb370f1c43a5))
* roll to Chrome 121.0.6167.184 (r1233107) ([#11948](https://github.com/puppeteer/puppeteer/issues/11948)) ([03ef7a6](https://github.com/puppeteer/puppeteer/commit/03ef7a62c23f2339e4d508d9abfe0894bd790cdd))
* update touchscreen tests ([#11960](https://github.com/puppeteer/puppeteer/issues/11960)) ([013bd0b](https://github.com/puppeteer/puppeteer/commit/013bd0b12d3a69f9d62fffe7911a327ad26d33d8))


## [22.1.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v22.0.0...puppeteer-v22.1.0) (2024-02-17)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 2.0.0 to 2.0.1


### Features

* support closing workers ([#11870](https://github.com/puppeteer/puppeteer/issues/11870)) ([1bdae40](https://github.com/puppeteer/puppeteer/commit/1bdae40ec865326fcb365320939869a6efb18c8a))


### Bug Fixes

* Chrome for Testing downloads have a new URL ([#11923](https://github.com/puppeteer/puppeteer/issues/11923)) ([f00a94a](https://github.com/puppeteer/puppeteer/commit/f00a94a809d38ee1c2c8cfc8597c66db9f3d243d))
* deprecate `Page.prototype.target` ([#11872](https://github.com/puppeteer/puppeteer/issues/11872)) ([15c986c](https://github.com/puppeteer/puppeteer/commit/15c986c2bc5f5005a738187674cd6c44bcb3df3d))
* frameElement should work for framesets ([#11842](https://github.com/puppeteer/puppeteer/issues/11842)) ([c5cee0e](https://github.com/puppeteer/puppeteer/commit/c5cee0e37dec8b90a17bf13400ede7ebdf453ac8))


## [22.0.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.11.0...puppeteer-v22.0.0) (2024-02-05)


### ⚠ BREAKING CHANGES

* rename createIncognitoBrowserContext to createBrowserContext ([#11834](https://github.com/puppeteer/puppeteer/issues/11834))
* enable the new-headless mode by default ([#11815](https://github.com/puppeteer/puppeteer/issues/11815))
* remove networkConditions in favor of PredefinedNetworkConditions ([#11806](https://github.com/puppeteer/puppeteer/issues/11806))
* use ReadableStreams ([#11805](https://github.com/puppeteer/puppeteer/issues/11805))
* remove duplicate type names ([#11803](https://github.com/puppeteer/puppeteer/issues/11803))
* remove add/removeEventListener in favor of on/off ([#11792](https://github.com/puppeteer/puppeteer/issues/11792))
* make console warn level compatible with WebDriver BiDi ([#11790](https://github.com/puppeteer/puppeteer/issues/11790))
* remove InterceptResolutionStrategy ([#11788](https://github.com/puppeteer/puppeteer/issues/11788))
* remove devices in favor of KnownDevices ([#11787](https://github.com/puppeteer/puppeteer/issues/11787))
* remove `$x` and `waitForXpath` ([#11782](https://github.com/puppeteer/puppeteer/issues/11782))
* remove waitForTimeout ([#11780](https://github.com/puppeteer/puppeteer/issues/11780))
* generate accessible PDFs by default ([#11778](https://github.com/puppeteer/puppeteer/issues/11778))
* remove `error` const, change CustomError to PuppeteerError ([#11777](https://github.com/puppeteer/puppeteer/issues/11777))
* remove viewport resizing from ElementHandle.screenshot ([#11774](https://github.com/puppeteer/puppeteer/issues/11774))
* remove PUPPETEER_DOWNLOAD_PATH in favor of PUPPETEER_CACHE_DIR ([#11605](https://github.com/puppeteer/puppeteer/issues/11605))
* BiDi cookies ([#11532](https://github.com/puppeteer/puppeteer/issues/11532))
* drop support for node16 ([#10912](https://github.com/puppeteer/puppeteer/issues/10912))


### Features

* BiDi cookies ([#11532](https://github.com/puppeteer/puppeteer/issues/11532)) ([9cb1fde](https://github.com/puppeteer/puppeteer/commit/9cb1fde58949811532644decb79b691318031d8c))
* drop support for node16 ([#10912](https://github.com/puppeteer/puppeteer/issues/10912)) ([953f420](https://github.com/puppeteer/puppeteer/commit/953f4207b17210fa7231225e6f29a826f77e0832))
* generate accessible PDFs by default ([#11778](https://github.com/puppeteer/puppeteer/issues/11778)) ([4fc1402](https://github.com/puppeteer/puppeteer/commit/4fc14026e9bfffeedf317e9b61c7cda8509091ba))
* remove PUPPETEER_DOWNLOAD_PATH in favor of PUPPETEER_CACHE_DIR ([#11605](https://github.com/puppeteer/puppeteer/issues/11605)) ([4677281](https://github.com/puppeteer/puppeteer/commit/467728187737283191f6528676e50d53dae6e5ef))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.9.1 to 2.0.0


### Bug Fixes

* make console warn level compatible with WebDriver BiDi ([#11790](https://github.com/puppeteer/puppeteer/issues/11790)) ([d4e9d8d](https://github.com/puppeteer/puppeteer/commit/d4e9d8d591e4fb1e2a33fe3a586a8beaccf263e8))
* remove viewport resizing from ElementHandle.screenshot ([#11774](https://github.com/puppeteer/puppeteer/issues/11774)) ([ced2235](https://github.com/puppeteer/puppeteer/commit/ced2235ada95ad67227df0ce579070ccb501a47b))


### Code Refactoring

* enable the new-headless mode by default ([#11815](https://github.com/puppeteer/puppeteer/issues/11815)) ([75c9e11](https://github.com/puppeteer/puppeteer/commit/75c9e117f1bf0d7a4de82c79201d70bf3cee2b6f))
* remove `$x` and `waitForXpath` ([#11782](https://github.com/puppeteer/puppeteer/issues/11782)) ([53c9134](https://github.com/puppeteer/puppeteer/commit/53c91348094dc0bce59086c98986c5d06a949d08))
* remove `error` const, change CustomError to PuppeteerError ([#11777](https://github.com/puppeteer/puppeteer/issues/11777)) ([b3bfdd2](https://github.com/puppeteer/puppeteer/commit/b3bfdd2024097be1974e28b3766419189b4a9fe0))
* remove add/removeEventListener in favor of on/off ([#11792](https://github.com/puppeteer/puppeteer/issues/11792)) ([f160874](https://github.com/puppeteer/puppeteer/commit/f1608743c83e8ce7b56aec98ccdddacc91b86179))
* remove devices in favor of KnownDevices ([#11787](https://github.com/puppeteer/puppeteer/issues/11787)) ([eb360e3](https://github.com/puppeteer/puppeteer/commit/eb360e3a762d9232a4972d4ec877b7d57a5b60c7))
* remove duplicate type names ([#11803](https://github.com/puppeteer/puppeteer/issues/11803)) ([514e2d5](https://github.com/puppeteer/puppeteer/commit/514e2d5241dc3a9027c96d739cfc99efc5a02783))
* remove InterceptResolutionStrategy ([#11788](https://github.com/puppeteer/puppeteer/issues/11788)) ([f18d447](https://github.com/puppeteer/puppeteer/commit/f18d44761cd1acc2e6b867e5eb2ebd753854e9ea))
* remove networkConditions in favor of PredefinedNetworkConditions ([#11806](https://github.com/puppeteer/puppeteer/issues/11806)) ([7564dfa](https://github.com/puppeteer/puppeteer/commit/7564dfa9110e44b1f50f5fb1543c5c7d8529c182))
* remove waitForTimeout ([#11780](https://github.com/puppeteer/puppeteer/issues/11780)) ([1900fa9](https://github.com/puppeteer/puppeteer/commit/1900fa94183e0a8654633a91f82b372ad068da71))
* rename createIncognitoBrowserContext to createBrowserContext ([#11834](https://github.com/puppeteer/puppeteer/issues/11834)) ([46a3ef2](https://github.com/puppeteer/puppeteer/commit/46a3ef2681456d604e775f578fa447a094200610))
* use ReadableStreams ([#11805](https://github.com/puppeteer/puppeteer/issues/11805)) ([84d9a94](https://github.com/puppeteer/puppeteer/commit/84d9a94d6228800e9f80914472ff2e5a4ee71b18))


## [21.11.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.10.0...puppeteer-v21.11.0) (2024-02-02)


### Features

* add outline to PDF generation ([#11779](https://github.com/puppeteer/puppeteer/issues/11779)) ([b99d478](https://github.com/puppeteer/puppeteer/commit/b99d478cd48adc261878836e04eac55ecc2890f2))
* **bidi:** implement UserContexts ([#11784](https://github.com/puppeteer/puppeteer/issues/11784)) ([2930a70](https://github.com/puppeteer/puppeteer/commit/2930a70c884ce6835ec6bcff27b32f7d273c8af0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.10.0 to 21.11.0


### Bug Fixes

* use shareReplay for inflight requests ([#11810](https://github.com/puppeteer/puppeteer/issues/11810)) ([0f0813d](https://github.com/puppeteer/puppeteer/commit/0f0813db38aa0eb14d7514d725852d0cb66f4f0e))


## [21.10.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.9.0...puppeteer-v21.10.0) (2024-01-29)


### Features

* add experimental browser.debugInfo ([#11748](https://github.com/puppeteer/puppeteer/issues/11748)) ([f88e1da](https://github.com/puppeteer/puppeteer/commit/f88e1da6385bc72e9ffde8514c28e4a0ff9e396a))
* download chrome-headless-shell by default and use it for the old headless mode ([#11754](https://github.com/puppeteer/puppeteer/issues/11754)) ([ce894a2](https://github.com/puppeteer/puppeteer/commit/ce894a2ffce4bc44bd11f12d1f0543e003a97e02))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.9.0 to 21.10.0


### Bug Fixes

* set viewport for element screenshots ([#11772](https://github.com/puppeteer/puppeteer/issues/11772)) ([9cd6673](https://github.com/puppeteer/puppeteer/commit/9cd66731d148afff9c2f873c1383fbe367cc5fb2))


## [21.9.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.8.0...puppeteer-v21.9.0) (2024-01-24)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.8.0 to 21.9.0


### Features

* roll to Chrome 121.0.6167.85 (r1233107) ([#11743](https://github.com/puppeteer/puppeteer/issues/11743)) ([0eec94c](https://github.com/puppeteer/puppeteer/commit/0eec94cf57288528ecd0a084a71311b181864f7b))


## [21.8.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.7.0...puppeteer-v21.8.0) (2024-01-24)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.7.0 to 21.8.0


### Features

* roll to Chrome 120.0.6099.109 (r1217362) ([#11733](https://github.com/puppeteer/puppeteer/issues/11733)) ([415cfac](https://github.com/puppeteer/puppeteer/commit/415cfaca202126b64ff496e4318cae64c4f14e89))


### Bug Fixes

* expose function for Firefox BiDi ([#11660](https://github.com/puppeteer/puppeteer/issues/11660)) ([cf879b8](https://github.com/puppeteer/puppeteer/commit/cf879b82f6c10302fcafe186b315fe7807107c31))
* wait for WebDriver BiDi browser to close gracefully ([#11636](https://github.com/puppeteer/puppeteer/issues/11636)) ([cc3aeeb](https://github.com/puppeteer/puppeteer/commit/cc3aeeb6eae4663198466755f23746ef821408ae))


### Reverts

* refactor: adopt `core/UserContext` on `BidiBrowserContext` ([#11721](https://github.com/puppeteer/puppeteer/issues/11721)) ([d17a9df](https://github.com/puppeteer/puppeteer/commit/d17a9df0278be34c206701d8dfc1fb62af3637b3))


## [21.7.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.6.1...puppeteer-v21.7.0) (2024-01-04)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.9.0 to 1.9.1


### Features

* allow converting other targets to pages ([#11604](https://github.com/puppeteer/puppeteer/issues/11604)) ([66aa770](https://github.com/puppeteer/puppeteer/commit/66aa77003880a1458e14b47a3ed87856fd3a1933))
* support fetching request POST data ([#11598](https://github.com/puppeteer/puppeteer/issues/11598)) ([80143de](https://github.com/puppeteer/puppeteer/commit/80143def9606ec5f2018dde618c00784442c5c1d))
* support timeouts per CDP command ([#11595](https://github.com/puppeteer/puppeteer/issues/11595)) ([c660d40](https://github.com/puppeteer/puppeteer/commit/c660d4001d610854399d7ecb551c4eb56a7f840a))


### Bug Fixes

* change viewportHeight in screencast ([#11583](https://github.com/puppeteer/puppeteer/issues/11583)) ([107b833](https://github.com/puppeteer/puppeteer/commit/107b8337e5eebc5e31a57663ba1345be81fb486e))
* disable GFX sanity window for Firefox and enable WebDriver BiDi CI jobs for Windows ([#11578](https://github.com/puppeteer/puppeteer/issues/11578)) ([e41a265](https://github.com/puppeteer/puppeteer/commit/e41a2656d9e1f3f037b298457fbd6c6e08f5a371))
* improve reliability of exposeFunction ([#11600](https://github.com/puppeteer/puppeteer/issues/11600)) ([b0c5392](https://github.com/puppeteer/puppeteer/commit/b0c5392cb36eed2ed4ae4864587885b6059f4cfb))


## [21.6.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.6.0...puppeteer-v21.6.1) (2023-12-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.6.0 to 21.6.1


### Bug Fixes

* emulate if captureBeyondViewport is false ([#11525](https://github.com/puppeteer/puppeteer/issues/11525)) ([b6d1163](https://github.com/puppeteer/puppeteer/commit/b6d1163f7f33d80fd43fa4915789d3689ea2369f))
* ensure fission.bfcacheInParent is disabled for cdp in Firefox ([#11522](https://github.com/puppeteer/puppeteer/issues/11522)) ([b4a6524](https://github.com/puppeteer/puppeteer/commit/b4a65245b0ad01b2b634473ebb4d8bb2d7e420f7))


## [21.6.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.5.2...puppeteer-v21.6.0) (2023-12-05)


### Features

* BiDi implementation of `Puppeteer.connect` for Firefox ([#11451](https://github.com/puppeteer/puppeteer/issues/11451)) ([be081ba](https://github.com/puppeteer/puppeteer/commit/be081ba17a9bbac70c13cafa81f1038f0ecfda70))
* experimental WebDriver BiDi support with Firefox ([#11412](https://github.com/puppeteer/puppeteer/issues/11412)) ([8aba033](https://github.com/puppeteer/puppeteer/commit/8aba033dde1a306e37f6033d6f6ff36387e1aac3))
* implement the Puppeteer CLI ([#11344](https://github.com/puppeteer/puppeteer/issues/11344)) ([53fb69b](https://github.com/puppeteer/puppeteer/commit/53fb69bf7f2bf06fa4fd7bb6d3cf21382386f6e7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.8.0 to 1.9.0


### Bug Fixes

* end WebDriver BiDi session on disconnect ([#11470](https://github.com/puppeteer/puppeteer/issues/11470)) ([a66d029](https://github.com/puppeteer/puppeteer/commit/a66d0296077a82179a2182281a5040fd96d3843c))
* remove CDP-specific preferences from defaults for Firefox ([#11477](https://github.com/puppeteer/puppeteer/issues/11477)) ([f8c9469](https://github.com/puppeteer/puppeteer/commit/f8c94699c7f5b15c7bb96f299c2c8217d74230cd))
* warn about launch Chrome using Node x64 on arm64 Macs ([#11471](https://github.com/puppeteer/puppeteer/issues/11471)) ([957a829](https://github.com/puppeteer/puppeteer/commit/957a8293bb1444fd51fd5673002a7781e8127c9d))


## [21.5.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.5.1...puppeteer-v21.5.2) (2023-11-15)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.5.1 to 21.5.2


### Bug Fixes

* add --disable-field-trial-config ([#11352](https://github.com/puppeteer/puppeteer/issues/11352)) ([cbc33be](https://github.com/puppeteer/puppeteer/commit/cbc33bea40b8801b8eeb3277fc15d04900715795))
* add --disable-infobars ([#11377](https://github.com/puppeteer/puppeteer/issues/11377)) ([0a41f8d](https://github.com/puppeteer/puppeteer/commit/0a41f8d01e85ff732fdd2e50468bc746d7bc6475))
* mitt types should not be exported ([#11371](https://github.com/puppeteer/puppeteer/issues/11371)) ([4bf2a09](https://github.com/puppeteer/puppeteer/commit/4bf2a09a13450c530b24288d65791fd5c4d4dce7))


## [21.5.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.5.0...puppeteer-v21.5.1) (2023-11-09)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.5.0 to 21.5.1


### Bug Fixes

* better debugging for WaitTask ([#11330](https://github.com/puppeteer/puppeteer/issues/11330)) ([d2480b0](https://github.com/puppeteer/puppeteer/commit/d2480b022d74b7071b515408a31c6e82448e3c9e))


## [21.5.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.4.1...puppeteer-v21.5.0) (2023-11-02)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.4.1 to 21.5.0


### Features

* roll to Chrome 119.0.6045.105 (r1204232) ([#11287](https://github.com/puppeteer/puppeteer/issues/11287)) ([325fa8b](https://github.com/puppeteer/puppeteer/commit/325fa8b1b16a9dafd5bb320e49984d24044fa3d7))


### Bug Fixes

* ignore unordered frames ([#11283](https://github.com/puppeteer/puppeteer/issues/11283)) ([ce4e485](https://github.com/puppeteer/puppeteer/commit/ce4e485d1b1e9d4e223890ee0fc2475a1ad71bc3))
* Type for ElementHandle.screenshot  ([#11274](https://github.com/puppeteer/puppeteer/issues/11274)) ([22aeff1](https://github.com/puppeteer/puppeteer/commit/22aeff1eac9d22048330a16aa3c41293133911e4))


## [21.4.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.4.0...puppeteer-v21.4.1) (2023-10-23)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.4.0 to 21.4.1


### Bug Fixes

* do not pass --{enable,disable}-features twice when user-provided ([#11230](https://github.com/puppeteer/puppeteer/issues/11230)) ([edec7d5](https://github.com/puppeteer/puppeteer/commit/edec7d53f8190381ade7db145ad7e7d6dba2ee13))
* remove circular import in IsolatedWorld ([#11228](https://github.com/puppeteer/puppeteer/issues/11228)) ([3edce3a](https://github.com/puppeteer/puppeteer/commit/3edce3aee9521654d7a285f4068a5e60bfb52245))
* remove import cycle ([#11227](https://github.com/puppeteer/puppeteer/issues/11227)) ([525f13c](https://github.com/puppeteer/puppeteer/commit/525f13cd18b39cc951a84aa51b2d852758e6f0d2))
* remove import cycle in connection ([#11225](https://github.com/puppeteer/puppeteer/issues/11225)) ([60f1b78](https://github.com/puppeteer/puppeteer/commit/60f1b788a6304504f504b0be9f02cb768e2803f8))
* remove import cycle in query handlers ([#11234](https://github.com/puppeteer/puppeteer/issues/11234)) ([954c75f](https://github.com/puppeteer/puppeteer/commit/954c75f9a9879e2e68935c17d7eb777b1f9f808a))
* remove more import cycles ([#11231](https://github.com/puppeteer/puppeteer/issues/11231)) ([b9ce89e](https://github.com/puppeteer/puppeteer/commit/b9ce89e460702ad85314685c600a4e5267f4db9b))
* typo in screencast error message ([#11213](https://github.com/puppeteer/puppeteer/issues/11213)) ([25b90b2](https://github.com/puppeteer/puppeteer/commit/25b90b2b542c4693150b67dc0c690b99f4ccfc95))


## [21.4.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.8...puppeteer-v21.4.0) (2023-10-20)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.7.1 to 1.8.0


### Features

* added tagged (accessible) PDFs option ([#11182](https://github.com/puppeteer/puppeteer/issues/11182)) ([0316863](https://github.com/puppeteer/puppeteer/commit/031686339136873c555a19ffb871f7140a2c39d9))
* enable tab targets ([#11099](https://github.com/puppeteer/puppeteer/issues/11099)) ([8324c16](https://github.com/puppeteer/puppeteer/commit/8324c1634883d97ed83f32a1e62acc9b5e64e0bd))
* implement screencasting ([#11084](https://github.com/puppeteer/puppeteer/issues/11084)) ([f060d46](https://github.com/puppeteer/puppeteer/commit/f060d467c00457e6be6878e0789d0df2ac4aae50))
* merge user-provided --{disable,enable}-features in args ([#11152](https://github.com/puppeteer/puppeteer/issues/11152)) ([2b578e4](https://github.com/puppeteer/puppeteer/commit/2b578e4a096aa94d792cc2da2da41fee061a77b8)), closes [#11072](https://github.com/puppeteer/puppeteer/issues/11072)
* roll to Chrome 118.0.5993.70 (r1192594) ([#11123](https://github.com/puppeteer/puppeteer/issues/11123)) ([91d14c8](https://github.com/puppeteer/puppeteer/commit/91d14c8c86f5be48c8e0937fd209bea643d60b45))


### Bug Fixes

* `Page.waitForDevicePrompt` crash ([#11153](https://github.com/puppeteer/puppeteer/issues/11153)) ([257be15](https://github.com/puppeteer/puppeteer/commit/257be15d83a46038a65d47977d4d847c54506517))
* add InlineTextBox as a non-element a11y role ([#11142](https://github.com/puppeteer/puppeteer/issues/11142)) ([8aa6cb3](https://github.com/puppeteer/puppeteer/commit/8aa6cb37d2443ff7fe2a1fd5d5adafdde4e9d165))
* disable ProcessPerSiteUpToMainFrameThreshold in Chrome ([#11139](https://github.com/puppeteer/puppeteer/issues/11139)) ([9347aae](https://github.com/puppeteer/puppeteer/commit/9347aae12e996604cea871acc9d007cbf338542e))
* make sure discovery happens before auto-attach ([#11100](https://github.com/puppeteer/puppeteer/issues/11100)) ([9ce204e](https://github.com/puppeteer/puppeteer/commit/9ce204e27ed091bde5aa5bc9f82da41c80534bde))
* synchronize frame tree with the events processing ([#11112](https://github.com/puppeteer/puppeteer/issues/11112)) ([d63f0cf](https://github.com/puppeteer/puppeteer/commit/d63f0cfc61e8ba2233eee8b2f3b99d8619a0acaf))
* update TextQuerySelector cache on subtree update ([#11200](https://github.com/puppeteer/puppeteer/issues/11200)) ([4206e76](https://github.com/puppeteer/puppeteer/commit/4206e76c3e4647ea6290f16127764d1a2f337dcf))
* xpath queries should be atomic ([#11101](https://github.com/puppeteer/puppeteer/issues/11101)) ([6098bab](https://github.com/puppeteer/puppeteer/commit/6098bab2ba68276c85a974e17c9fe3bdac8c4c58))


## [21.3.8](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.7...puppeteer-v21.3.8) (2023-10-06)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.7 to 21.3.8


### Bug Fixes

* avoid double subscription to frame manager in Page ([#11091](https://github.com/puppeteer/puppeteer/issues/11091)) ([5887649](https://github.com/puppeteer/puppeteer/commit/5887649891ea9cf1d7b3afbcf7196620ceb20ab2))
* update file chooser events ([#11057](https://github.com/puppeteer/puppeteer/issues/11057)) ([317f820](https://github.com/puppeteer/puppeteer/commit/317f82055b2f4dd68db136a3d52c5712425fa339))


## [21.3.7](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.6...puppeteer-v21.3.7) (2023-10-05)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.6 to 21.3.7


### Bug Fixes

* roll to Chrome 117.0.5938.149 (r1181205) ([#11077](https://github.com/puppeteer/puppeteer/issues/11077)) ([0c0e516](https://github.com/puppeteer/puppeteer/commit/0c0e516d736665a27f7773f66a0f9c362daa73aa))


## [21.3.6](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.5...puppeteer-v21.3.6) (2023-09-28)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.5 to 21.3.6


### Bug Fixes

* remove the flag disabling bfcache ([#11047](https://github.com/puppeteer/puppeteer/issues/11047)) ([b0d7375](https://github.com/puppeteer/puppeteer/commit/b0d73755193e7c60deb70df120859b5db87e7817))


## [21.3.5](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.4...puppeteer-v21.3.5) (2023-09-26)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.4 to 21.3.5


### Bug Fixes

* set defaults in screenshot ([#11021](https://github.com/puppeteer/puppeteer/issues/11021)) ([ace1230](https://github.com/puppeteer/puppeteer/commit/ace1230e41aad6168dc85b9bc1f7c04d9dce5527))


## [21.3.4](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.3...puppeteer-v21.3.4) (2023-09-22)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.3 to 21.3.4


### Bug Fixes

* avoid structuredClone for Node 16 ([#11006](https://github.com/puppeteer/puppeteer/issues/11006)) ([25eca9a](https://github.com/puppeteer/puppeteer/commit/25eca9a747c122b3096b0f2d01b3323339d57dd9))


## [21.3.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.2...puppeteer-v21.3.3) (2023-09-22)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.2 to 21.3.3


### Bug Fixes

* do not export bidi and fix import from the entrypoint ([#10998](https://github.com/puppeteer/puppeteer/issues/10998)) ([88c78de](https://github.com/puppeteer/puppeteer/commit/88c78dea41eb7690d67343298c150194fe145763))


## [21.3.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.1...puppeteer-v21.3.2) (2023-09-22)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.1 to 21.3.2


### Bug Fixes

* handle missing detach events for restored bfcache targets ([#10967](https://github.com/puppeteer/puppeteer/issues/10967)) ([7bcdfcb](https://github.com/puppeteer/puppeteer/commit/7bcdfcb7e9e75feca0a8de692926ea25ca8fbed0))
* roll to Chrome 117.0.5938.92 (r1181205) ([#10989](https://github.com/puppeteer/puppeteer/issues/10989)) ([d048cd9](https://github.com/puppeteer/puppeteer/commit/d048cd965f0707dd9b2a3276f02c563b69f6fac4))


## [21.3.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.3.0...puppeteer-v21.3.1) (2023-09-19)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.3.0 to 21.3.1


### Bug Fixes

* make `CDPSessionEvent.SessionAttached` public ([#10941](https://github.com/puppeteer/puppeteer/issues/10941)) ([cfed7b9](https://github.com/puppeteer/puppeteer/commit/cfed7b93ec23e92ec11632f1cd90f00dac754739))


## [21.3.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.2.1...puppeteer-v21.3.0) (2023-09-19)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.2.1 to 21.3.0


### Features

* implement `Browser.connected` ([#10927](https://github.com/puppeteer/puppeteer/issues/10927)) ([a4345a4](https://github.com/puppeteer/puppeteer/commit/a4345a477f58541f5d95da11ffee74abe24c12bf))
* implement `BrowserContext.closed` ([#10928](https://github.com/puppeteer/puppeteer/issues/10928)) ([2292078](https://github.com/puppeteer/puppeteer/commit/2292078969fa46a27d5759989cd44a4d48beb310))
* implement improved Drag n' Drop APIs ([#10651](https://github.com/puppeteer/puppeteer/issues/10651)) ([9342bac](https://github.com/puppeteer/puppeteer/commit/9342bac2639702090f39fc1e3a97d43a934f3f0b))
* implement typed events ([#10889](https://github.com/puppeteer/puppeteer/issues/10889)) ([9b6f1de](https://github.com/puppeteer/puppeteer/commit/9b6f1de8b99445c661c5aebcf041fe90daf469b9))
* roll to Chrome 117.0.5938.62 (r1181205) ([#10893](https://github.com/puppeteer/puppeteer/issues/10893)) ([4b8d20d](https://github.com/puppeteer/puppeteer/commit/4b8d20d0edeccaa3028e0c1c0b63c022cfabcee2))


### Bug Fixes

* fix line/column number in errors ([#10926](https://github.com/puppeteer/puppeteer/issues/10926)) ([a0e57f7](https://github.com/puppeteer/puppeteer/commit/a0e57f7eb230ba6a659c2d418da8d3f67add2d00))
* handle frame manager init without unhandled rejection ([#10902](https://github.com/puppeteer/puppeteer/issues/10902)) ([ea14834](https://github.com/puppeteer/puppeteer/commit/ea14834fdf1c7c1afa45bdd1fb5339380f4631a2))
* remove explicit resource management from types ([#10918](https://github.com/puppeteer/puppeteer/issues/10918)) ([a1b1bff](https://github.com/puppeteer/puppeteer/commit/a1b1bffb7258f1dec3b0a2e9ce068baf2cc3db19))
* roll to Chrome 117.0.5938.88 (r1181205) ([#10920](https://github.com/puppeteer/puppeteer/issues/10920)) ([b7bcc9a](https://github.com/puppeteer/puppeteer/commit/b7bcc9a733a3ac376397a32c3f62eb68101bedf9))


## [21.2.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.2.0...puppeteer-v21.2.1) (2023-09-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.7.0 to 1.7.1


### Bug Fixes

* use supported node range for types ([#10896](https://github.com/puppeteer/puppeteer/issues/10896)) ([2d851c1](https://github.com/puppeteer/puppeteer/commit/2d851c1398e5efcdabdb5304dc78e68cbd3fadd2))


## [21.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.1.1...puppeteer-v21.2.0) (2023-09-12)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.1.1 to 21.2.0


### Features

* expose DevTools as a target ([#10812](https://github.com/puppeteer/puppeteer/issues/10812)) ([a540085](https://github.com/puppeteer/puppeteer/commit/a540085176d92bd160a12ebc54606dbacd064979))


### Bug Fixes

* add --disable-search-engine-choice-screen to default arguments ([#10880](https://github.com/puppeteer/puppeteer/issues/10880)) ([d08ad5f](https://github.com/puppeteer/puppeteer/commit/d08ad5fbbe3be4349dd6132c209895f8436ae9e6))
* apply viewport emulation to prerender targets ([#10804](https://github.com/puppeteer/puppeteer/issues/10804)) ([14f0ab7](https://github.com/puppeteer/puppeteer/commit/14f0ab7397053db5591823c716e142c684f25b44))
* implement `throwIfDetached` ([#10826](https://github.com/puppeteer/puppeteer/issues/10826)) ([538bb73](https://github.com/puppeteer/puppeteer/commit/538bb73ea7e280cacf15fc1d2100251d8e17f906))
* LifecycleWatcher sub frames handling ([#10841](https://github.com/puppeteer/puppeteer/issues/10841)) ([06c1588](https://github.com/puppeteer/puppeteer/commit/06c1588016e1ebef5ed8f079dc34507f6d781e07))
* make network manager multi session ([#10793](https://github.com/puppeteer/puppeteer/issues/10793)) ([085936b](https://github.com/puppeteer/puppeteer/commit/085936bd7e17ed5a8085311f5b212c7b9ca96a0d))
* make page.goBack work with bfcache in tab mode ([#10818](https://github.com/puppeteer/puppeteer/issues/10818)) ([22daf18](https://github.com/puppeteer/puppeteer/commit/22daf1861fc358acf4d84c360049736c22249f92))
* only a single disable features flag is allowed ([#10887](https://github.com/puppeteer/puppeteer/issues/10887)) ([4852e22](https://github.com/puppeteer/puppeteer/commit/4852e222b771ed9b95596657f70e45c1d5b9790d))
* trimCache should remove Firefox too ([#10872](https://github.com/puppeteer/puppeteer/issues/10872)) ([acdd7d3](https://github.com/puppeteer/puppeteer/commit/acdd7d3cd5529bc934edbb8479bdb950cc7d8a6a))


## [21.1.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.1.0...puppeteer-v21.1.1) (2023-08-28)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.1.0 to 21.1.1


### Bug Fixes

* **locators:** do not retry via catchError ([#10762](https://github.com/puppeteer/puppeteer/issues/10762)) ([8f9388f](https://github.com/puppeteer/puppeteer/commit/8f9388f2ce5220ad9b3c05fb3f3d9a86fac894dc))


## [21.1.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.0.3...puppeteer-v21.1.0) (2023-08-18)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.6.0 to 1.7.0


### Features

* roll to Chrome 116.0.5845.96 (r1160321) ([#10735](https://github.com/puppeteer/puppeteer/issues/10735)) ([e12b558](https://github.com/puppeteer/puppeteer/commit/e12b558f505aab13f38030a7b748261bdeadc48b))


### Bug Fixes

* locator.fill should work for textareas ([#10737](https://github.com/puppeteer/puppeteer/issues/10737)) ([fc08a7d](https://github.com/puppeteer/puppeteer/commit/fc08a7dd54226878300f3a4b52fb16aeb5cc93e8))
* relative ordering of events and command responses should be ensured ([#10725](https://github.com/puppeteer/puppeteer/issues/10725)) ([81ecb60](https://github.com/puppeteer/puppeteer/commit/81ecb60190f89389abb6d8834158f38ff7317ec8))


## [21.0.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.0.1...puppeteer-v21.0.2) (2023-08-08)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.5.0 to 1.5.1


### Bug Fixes

* destroy puppeteer utility on context destruction ([#10672](https://github.com/puppeteer/puppeteer/issues/10672)) ([8b8770c](https://github.com/puppeteer/puppeteer/commit/8b8770c004ba842496e0ca4845642fe82a211051))
* roll to Chrome 115.0.5790.170 (r1148114) ([#10677](https://github.com/puppeteer/puppeteer/issues/10677)) ([e5af57e](https://github.com/puppeteer/puppeteer/commit/e5af57ebd0187c296bc44426c1b931f57442732e))


## [21.0.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v21.0.0...puppeteer-v21.0.1) (2023-08-03)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 21.0.0 to 21.0.1


### Bug Fixes

* use handle frame instead of page ([#10676](https://github.com/puppeteer/puppeteer/issues/10676)) ([1b44b91](https://github.com/puppeteer/puppeteer/commit/1b44b911d3633df89bd6106aaf7accb49230934d))


## [21.0.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.9.0...puppeteer-v21.0.0) (2023-08-02)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.4.6 to 1.5.0


### ⚠ BREAKING CHANGES

* use Target for filters ([#10601](https://github.com/puppeteer/puppeteer/issues/10601))


### Features

* add page.createCDPSession method ([#10515](https://github.com/puppeteer/puppeteer/issues/10515)) ([d0c5b8e](https://github.com/puppeteer/puppeteer/commit/d0c5b8e08905f3802705a1a90d7cc8fa04bc82db))
* implement `Locator.prototype.filter` ([#10631](https://github.com/puppeteer/puppeteer/issues/10631)) ([e73d35d](https://github.com/puppeteer/puppeteer/commit/e73d35def0718468fe854ac2ef5f4a8beafb2fb3))
* implement `Locator.prototype.map` ([#10630](https://github.com/puppeteer/puppeteer/issues/10630)) ([47eecf5](https://github.com/puppeteer/puppeteer/commit/47eecf5bb11daba0114ad04282beb01c85eb9405))
* implement `Locator.prototype.wait` ([#10629](https://github.com/puppeteer/puppeteer/issues/10629)) ([5d34d42](https://github.com/puppeteer/puppeteer/commit/5d34d42d1536cbe7cf2ba1aa8670d909c4e6a6fc))
* implement `Locator.prototype.waitHandle` ([#10650](https://github.com/puppeteer/puppeteer/issues/10650)) ([fdada74](https://github.com/puppeteer/puppeteer/commit/fdada74ba7265b3571ebdf60ae301b64d13a8226))
* implement function locators ([#10632](https://github.com/puppeteer/puppeteer/issues/10632)) ([6ad92f7](https://github.com/puppeteer/puppeteer/commit/6ad92f7f84f477b22674f52f0a145a500c3aa152))
* implement immutable locator operations ([#10638](https://github.com/puppeteer/puppeteer/issues/10638)) ([34be28d](https://github.com/puppeteer/puppeteer/commit/34be28db5d9971cf16d9741b0141357df3cbf74c))


### Bug Fixes

* remove typescript from peer dependencies ([#10593](https://github.com/puppeteer/puppeteer/issues/10593)) ([c60572a](https://github.com/puppeteer/puppeteer/commit/c60572a1ca36ea5946d287bd629ac31798d84cb0))
* roll to Chrome 115.0.5790.102 (r1148114) ([#10608](https://github.com/puppeteer/puppeteer/issues/10608)) ([8649c53](https://github.com/puppeteer/puppeteer/commit/8649c53a706e5a09ae5e16849eb29a793cec5bec))


### Code Refactoring

* use Target for filters ([#10601](https://github.com/puppeteer/puppeteer/issues/10601)) ([44712d1](https://github.com/puppeteer/puppeteer/commit/44712d1e6efcb3fa49c27b1195d17c0c1c92a0ca))


## [20.9.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.8.3...puppeteer-v20.9.0) (2023-07-20)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.4.5 to 1.4.6


### Features

* add autofill support ([#10565](https://github.com/puppeteer/puppeteer/issues/10565)) ([6c9306a](https://github.com/puppeteer/puppeteer/commit/6c9306a72e0f7195a4a6c300645f6089845c9abc))
* roll to Chrome 115.0.5790.98 (r1148114) ([#10584](https://github.com/puppeteer/puppeteer/issues/10584)) ([830f926](https://github.com/puppeteer/puppeteer/commit/830f926d486675701720b5c147f597364f3e8f7b))


### Bug Fixes

* update the target to ES2022 ([#10574](https://github.com/puppeteer/puppeteer/issues/10574)) ([88439f9](https://github.com/puppeteer/puppeteer/commit/88439f913ed4159cdc8be573f2dbda0b1f615301))


## [20.8.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.8.2...puppeteer-v20.8.3) (2023-07-18)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.8.2 to 20.8.3


### Bug Fixes

* **locators:** reject the race if there are only failures ([#10567](https://github.com/puppeteer/puppeteer/issues/10567)) ([e3dd596](https://github.com/puppeteer/puppeteer/commit/e3dd5968cae196b64d958c161fed3d1b39aed3f6))
* prevent erroneous new main frame ([#10549](https://github.com/puppeteer/puppeteer/issues/10549)) ([cb46413](https://github.com/puppeteer/puppeteer/commit/cb46413d87f10970f4088b7d58e02a65c5ccd27e))


## [20.8.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.8.0...puppeteer-v20.8.1) (2023-07-11)


### Bug Fixes

* remove test metadata files ([#10520](https://github.com/puppeteer/puppeteer/issues/10520)) ([cbf4f2a](https://github.com/puppeteer/puppeteer/commit/cbf4f2a66912f24849ae8c88fc1423851dcc4aa7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.4.3 to 1.4.4


## [20.8.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.7.4...puppeteer-v20.8.0) (2023-07-06)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.7.4 to 20.8.0


### Features

* **screenshot:** enable optimizeForSpeed ([#10492](https://github.com/puppeteer/puppeteer/issues/10492)) ([87aaed4](https://github.com/puppeteer/puppeteer/commit/87aaed4807e5240dec7b25273e44c1ce5e884336))


### Bug Fixes

* add an internal page.locatorRace ([#10512](https://github.com/puppeteer/puppeteer/issues/10512)) ([56a97dd](https://github.com/puppeteer/puppeteer/commit/56a97dd2fb1cbf36e4f3344f7d22afd6e7ef2380))


## [20.7.4](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.7.3...puppeteer-v20.7.4) (2023-06-29)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.4.2 to 1.4.3


### Bug Fixes

* fix escaping algo for P selectors ([#10474](https://github.com/puppeteer/puppeteer/issues/10474)) ([84a956f](https://github.com/puppeteer/puppeteer/commit/84a956f56ba9ce74e9dd0f95ff40fdd14be87b1d))
* fix the util import in Connection.ts ([#10450](https://github.com/puppeteer/puppeteer/issues/10450)) ([61f4525](https://github.com/puppeteer/puppeteer/commit/61f4525ae306810404af9083d2e7440403c02722))


## [20.7.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.7.2...puppeteer-v20.7.3) (2023-06-20)


### Bug Fixes

* add parenthesis to JS values in interpolateFunction ([#10426](https://github.com/puppeteer/puppeteer/issues/10426)) ([fbdcc0d](https://github.com/puppeteer/puppeteer/commit/fbdcc0d6469abe7115723347a9f161628074d41e))
* added clipboard permission that was not exposed ([#10119](https://github.com/puppeteer/puppeteer/issues/10119)) ([c06e15f](https://github.com/puppeteer/puppeteer/commit/c06e15fb5bd7ec21db2d883ccf63ef8fe98c7f4d))
* include src into published package ([#10415](https://github.com/puppeteer/puppeteer/issues/10415)) ([d1ffad0](https://github.com/puppeteer/puppeteer/commit/d1ffad059ae66104842b92dc814d362c123b9646))
* WaitForNetworkIdle and Deferred.race ([#10411](https://github.com/puppeteer/puppeteer/issues/10411)) ([138cc5c](https://github.com/puppeteer/puppeteer/commit/138cc5c961da698bf7ca635c9947058df4b2ec72))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.4.1 to 1.4.2


## [20.7.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.7.1...puppeteer-v20.7.2) (2023-06-16)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.7.1 to 20.7.2


### Bug Fixes

* roll to Chrome 114.0.5735.133 (r1135570) ([#10384](https://github.com/puppeteer/puppeteer/issues/10384)) ([9311558](https://github.com/puppeteer/puppeteer/commit/93115587c94278e0a5309429d3f23a52ed24e22d))


## [20.7.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.7.0...puppeteer-v20.7.1) (2023-06-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.7.0 to 20.7.1


### Bug Fixes

* avoid importing puppeteer-core.js ([#10376](https://github.com/puppeteer/puppeteer/issues/10376)) ([3171c12](https://github.com/puppeteer/puppeteer/commit/3171c12a0c16b283e6b65b1ed3d801b089a6e28b))


## [20.7.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.6.0...puppeteer-v20.7.0) (2023-06-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.6.0 to 20.7.0


### Features

* add `reset` to mouse ([#10340](https://github.com/puppeteer/puppeteer/issues/10340)) ([35aedc0](https://github.com/puppeteer/puppeteer/commit/35aedc0dbbd80818e6f83ff9f0777dc3ea2588f0))


### Bug Fixes

* Locator.scroll in race ([#10363](https://github.com/puppeteer/puppeteer/issues/10363)) ([ba28724](https://github.com/puppeteer/puppeteer/commit/ba28724952b41ea653830a75efc4c73b234ea354))
* mark CDPSessionOnMessageObject as internal ([#10373](https://github.com/puppeteer/puppeteer/issues/10373)) ([7cb6059](https://github.com/puppeteer/puppeteer/commit/7cb6059bcc36f8dc3739a8df9119c658146ac100))
* specify the context id when adding bindings ([#10366](https://github.com/puppeteer/puppeteer/issues/10366)) ([c2d3488](https://github.com/puppeteer/puppeteer/commit/c2d3488ad8c0453312557ba28e6ade9c32464f17))


## [20.6.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.5.0...puppeteer-v20.6.0) (2023-06-09)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.5.0 to 20.6.0


### Features

* add `page.removeExposedFunction` ([#10297](https://github.com/puppeteer/puppeteer/issues/10297)) ([4d0dbbc](https://github.com/puppeteer/puppeteer/commit/4d0dbbc517f388a3fe984ec569bc1bad28d91494))
* **chrome:** roll to Chrome 114.0.5735.45 (r1135570) ([#10302](https://github.com/puppeteer/puppeteer/issues/10302)) ([021402d](https://github.com/puppeteer/puppeteer/commit/021402d1363accabc05f75ea1004451a90e1dfca))
* implement Locator.race ([#10337](https://github.com/puppeteer/puppeteer/issues/10337)) ([9c35e9a](https://github.com/puppeteer/puppeteer/commit/9c35e9ab1f92e99aab8dabcd17f687befd6aad81))
* implement Locators ([#10305](https://github.com/puppeteer/puppeteer/issues/10305)) ([1f978f5](https://github.com/puppeteer/puppeteer/commit/1f978f5fc5f0580859ad423e952595979f50d5a9))


### Bug Fixes

* content() not showing comments outside html tag ([#10293](https://github.com/puppeteer/puppeteer/issues/10293)) ([9abd48a](https://github.com/puppeteer/puppeteer/commit/9abd48a062a4a30fb93d0b555f2fa03d3dc410f3))
* ensure stack trace contains one line ([#10317](https://github.com/puppeteer/puppeteer/issues/10317)) ([bc0b04b](https://github.com/puppeteer/puppeteer/commit/bc0b04beef3244280e6569a233173d512adaa9d8))
* roll to Chrome 114.0.5735.90 (r1135570) ([#10329](https://github.com/puppeteer/puppeteer/issues/10329)) ([60acefc](https://github.com/puppeteer/puppeteer/commit/60acefc1d6d719ed6c5053d6b9ad734306d08c4a))
* send capabilities property in session.new command ([#10311](https://github.com/puppeteer/puppeteer/issues/10311)) ([e8d044c](https://github.com/puppeteer/puppeteer/commit/e8d044cb8dcb689cc066ffa18a1e3c9366f57902))


## [20.5.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.4.0...puppeteer-v20.5.0) (2023-05-31)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.4.0 to 1.4.1


### Features

* Page.removeScriptToEvaluateOnNewDocument ([#10250](https://github.com/puppeteer/puppeteer/issues/10250)) ([b5a124f](https://github.com/puppeteer/puppeteer/commit/b5a124ff738a03fa7eb5755b441af5b773447449))


### Bug Fixes

* bind trimCache to the instance ([#10270](https://github.com/puppeteer/puppeteer/issues/10270)) ([50e72a4](https://github.com/puppeteer/puppeteer/commit/50e72a4d1164af7d53e31b8b83117f695ede7ae4))


## [20.4.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.3.0...puppeteer-v20.4.0) (2023-05-24)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.3.0 to 1.4.0


### Features

* Page.setBypassServiceWorker ([#10229](https://github.com/puppeteer/puppeteer/issues/10229)) ([81f73a5](https://github.com/puppeteer/puppeteer/commit/81f73a55f31892e55219ef9d37e235e988731fc1))


### Bug Fixes

* stacktraces should not throw errors ([#10231](https://github.com/puppeteer/puppeteer/issues/10231)) ([557ec24](https://github.com/puppeteer/puppeteer/commit/557ec24cfc084440197da67581bf9782f10eb346))


## [20.3.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.2.1...puppeteer-v20.3.0) (2023-05-22)


### Features

* add an ability to trim cache for Puppeteer ([#10199](https://github.com/puppeteer/puppeteer/issues/10199)) ([1ad32ec](https://github.com/puppeteer/puppeteer/commit/1ad32ec9948ca3e07e15548a562c8f3c633b3dc3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.2.1 to 20.3.0


### Bug Fixes

* ElementHandle dragAndDrop should fail when interception is disabled ([#10209](https://github.com/puppeteer/puppeteer/issues/10209)) ([bcf5fd8](https://github.com/puppeteer/puppeteer/commit/bcf5fd87aeeb822203c3388e8aa6dadaa0107690))


## [20.2.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.2.0...puppeteer-v20.2.1) (2023-05-15)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.2.0 to 1.3.0


### Bug Fixes

* use encode/decodeURIComponent ([#10183](https://github.com/puppeteer/puppeteer/issues/10183)) ([d0c68ff](https://github.com/puppeteer/puppeteer/commit/d0c68ff002df37907968d3b999a8273590ac7c97))


## [20.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.1.2...puppeteer-v20.2.0) (2023-05-11)


### Bug Fixes

* downloadPath should be used by the install script ([#10163](https://github.com/puppeteer/puppeteer/issues/10163)) ([4398f66](https://github.com/puppeteer/puppeteer/commit/4398f66f281f1ffe5be81b529fc4751edfaf761d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.1.0 to 1.2.0


### Features

* implement detailed errors for evaluation ([#10114](https://github.com/puppeteer/puppeteer/issues/10114)) ([317fa73](https://github.com/puppeteer/puppeteer/commit/317fa732f920382f9b3f6dea4e31ed31b04e25da))


## [20.1.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.1.0...puppeteer-v20.1.1) (2023-05-05)


### Bug Fixes

* rename PUPPETEER_DOWNLOAD_HOST to PUPPETEER_DOWNLOAD_BASE_URL ([#10130](https://github.com/puppeteer/puppeteer/issues/10130)) ([9758cae](https://github.com/puppeteer/puppeteer/commit/9758cae029f90908c4b5340561d9c51c26aa2f21))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 1.0.0 to 1.0.1


## [20.1.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v20.0.0...puppeteer-v20.1.0) (2023-05-03)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 20.0.0 to 20.1.0


### Features

* **chrome:** roll to Chrome 113.0.5672.63 (r1121455) ([#10116](https://github.com/puppeteer/puppeteer/issues/10116)) ([19f4334](https://github.com/puppeteer/puppeteer/commit/19f43348a884edfc3e73ab60e41a9757239df013))


## [20.0.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.11.1...puppeteer-v20.0.0) (2023-05-02)


### ⚠ BREAKING CHANGES

* drop support for node14 ([#10019](https://github.com/puppeteer/puppeteer/issues/10019))
* switch to Chrome for Testing instead of Chromium ([#10054](https://github.com/puppeteer/puppeteer/issues/10054))


### Features

* add AbortSignal to waitForFunction ([#10078](https://github.com/puppeteer/puppeteer/issues/10078)) ([4dd4cb9](https://github.com/puppeteer/puppeteer/commit/4dd4cb929242a6b1a621fd461edd3167d40e1c4c))
* drop support for node14 ([#10019](https://github.com/puppeteer/puppeteer/issues/10019)) ([7405d65](https://github.com/puppeteer/puppeteer/commit/7405d6585aa09b240fbab09aa360674d4442b3d9))
* switch to Chrome for Testing instead of Chromium ([#10054](https://github.com/puppeteer/puppeteer/issues/10054)) ([df4d60c](https://github.com/puppeteer/puppeteer/commit/df4d60c187aa11c4ad783827242e9511f4ec2aab))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 0.5.0 to 1.0.0


### Bug Fixes

* use AbortSignal.throwIfAborted ([#10105](https://github.com/puppeteer/puppeteer/issues/10105)) ([575f00a](https://github.com/puppeteer/puppeteer/commit/575f00a31d0278f7ff27096e770ff84399cd9993))


## [19.11.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.11.0...puppeteer-v19.11.1) (2023-04-25)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.11.0 to 19.11.1


### Bug Fixes

* implement click `count` ([#10069](https://github.com/puppeteer/puppeteer/issues/10069)) ([8124a7d](https://github.com/puppeteer/puppeteer/commit/8124a7d5bfc1cfa8cb579271f78ce586efc62b8e))
* implement flag for disabling headless warning ([#10073](https://github.com/puppeteer/puppeteer/issues/10073)) ([cfe9bbc](https://github.com/puppeteer/puppeteer/commit/cfe9bbc852d014b31c754950590b6b6c96573eeb))


## [19.11.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.10.1...puppeteer-v19.11.0) (2023-04-24)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.10.1 to 19.11.0


### Features

* add warn for `headless: true` ([#10039](https://github.com/puppeteer/puppeteer/issues/10039)) ([23d6a95](https://github.com/puppeteer/puppeteer/commit/23d6a95cf10c90f8aba2b12d7b02a73072e20382))


### Bug Fixes

* infer last pressed button in mouse move ([#10067](https://github.com/puppeteer/puppeteer/issues/10067)) ([a6eaac4](https://github.com/puppeteer/puppeteer/commit/a6eaac4c39d4b0ab3ab1a3c2f319a70fde393edb))


## [19.10.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.10.0...puppeteer-v19.10.1) (2023-04-21)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 0.4.1 to 0.5.0


### Bug Fixes

* move fs.js to the node folder ([#10055](https://github.com/puppeteer/puppeteer/issues/10055)) ([704624e](https://github.com/puppeteer/puppeteer/commit/704624eb2045a7e38ed14044d6863a2871e9d7e2))


## [19.10.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.9.1...puppeteer-v19.10.0) (2023-04-20)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.9.1 to 19.10.0


### Features

* support AbortController in waitForSelector ([#10018](https://github.com/puppeteer/puppeteer/issues/10018)) ([9109b76](https://github.com/puppeteer/puppeteer/commit/9109b76276c9d86a2c521c72fc5b7189979279ca))
* **webworker:** expose WebWorker.client ([#10042](https://github.com/puppeteer/puppeteer/issues/10042)) ([c125128](https://github.com/puppeteer/puppeteer/commit/c12512822a546e7bfdefd2c68f020aab2a308f4f))


### Bug Fixes

* continue requests without network instrumentation ([#10046](https://github.com/puppeteer/puppeteer/issues/10046)) ([8283823](https://github.com/puppeteer/puppeteer/commit/8283823cb860528a938e84cb5ba2b5f4cf980e83))
* install bindings once ([#10049](https://github.com/puppeteer/puppeteer/issues/10049)) ([690aec1](https://github.com/puppeteer/puppeteer/commit/690aec1b5cb4e7e574abde9c533c6c0954e6f1aa))


## [19.9.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.9.0...puppeteer-v19.9.1) (2023-04-17)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.9.0 to 19.9.1


### Bug Fixes

* improve mouse actions ([#10021](https://github.com/puppeteer/puppeteer/issues/10021)) ([34db39e](https://github.com/puppeteer/puppeteer/commit/34db39e4474efee9d4579743026c3d6b6c8e494b))


## [19.9.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.8.5...puppeteer-v19.9.0) (2023-04-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 0.4.0 to 0.4.1


### Features

* add ElementHandle.isVisible and ElementHandle.isHidden  ([#10007](https://github.com/puppeteer/puppeteer/issues/10007)) ([26c81b7](https://github.com/puppeteer/puppeteer/commit/26c81b7408a98cb9ef1aac9b57a038b699e6d518))
* add ElementHandle.scrollIntoView ([#10005](https://github.com/puppeteer/puppeteer/issues/10005)) ([0d556a7](https://github.com/puppeteer/puppeteer/commit/0d556a71d6bcd5da501724ccbb4ce0be433768df))


### Bug Fixes

* make isIntersectingViewport work with SVG elements ([#10004](https://github.com/puppeteer/puppeteer/issues/10004)) ([656b562](https://github.com/puppeteer/puppeteer/commit/656b562c7488d4976a7a53264feef508c6b629dd))


### Performance Improvements

* amortize handle iterator ([#10002](https://github.com/puppeteer/puppeteer/issues/10002)) ([ab27f73](https://github.com/puppeteer/puppeteer/commit/ab27f738c9abb56f6083d02f7f45d2b8da9fc3f3))


## [19.8.5](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.8.4...puppeteer-v19.8.5) (2023-04-06)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 0.3.3 to 0.4.0


### Bug Fixes

* add filter to setDiscoverTargets for Firefox ([#9693](https://github.com/puppeteer/puppeteer/issues/9693)) ([c09764e](https://github.com/puppeteer/puppeteer/commit/c09764e4c43d7a62096f430b598d63f2b688e860))


## [19.8.4](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.8.3...puppeteer-v19.8.4) (2023-04-06)


### Bug Fixes

* ignore extraInfo events if the response is served from cache ([#9983](https://github.com/puppeteer/puppeteer/issues/9983)) ([e7265c9](https://github.com/puppeteer/puppeteer/commit/e7265c9aa94e749de5745e5e98d45d4659f19d30))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @puppeteer/browsers bumped from 0.3.2 to 0.3.3


## [19.8.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.8.2...puppeteer-v19.8.3) (2023-04-03)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.8.1 to 19.8.3
    * @puppeteer/browsers bumped from 0.3.1 to 0.3.2


### Bug Fixes

* use shadowRoot for tree walker ([#9950](https://github.com/puppeteer/puppeteer/issues/9950)) ([728547d](https://github.com/puppeteer/puppeteer/commit/728547d4608e8c601e209ede860493b1986da174))


## [19.8.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.8.0...puppeteer-v19.8.1) (2023-03-28)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.8.0 to 19.8.1


### Bug Fixes

* increase the default protocol timeout ([#9928](https://github.com/puppeteer/puppeteer/issues/9928)) ([4465f4b](https://github.com/puppeteer/puppeteer/commit/4465f4bd1900afc0b049ac863f4e372453a0c234))


## [19.8.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.7.5...puppeteer-v19.8.0) (2023-03-24)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.7.5 to 19.8.0


### Features

* add Page.waitForDevicePrompt ([#9299](https://github.com/puppeteer/puppeteer/issues/9299)) ([a5149d5](https://github.com/puppeteer/puppeteer/commit/a5149d52f54036a27a411bc070902b1eb3a7a629))
* **chromium:** roll to Chromium 112.0.5614.0 (r1108766) ([#9841](https://github.com/puppeteer/puppeteer/issues/9841)) ([eddb1f6](https://github.com/puppeteer/puppeteer/commit/eddb1f6ec3958b79fea297123f7621eb7beaff04))


### Bug Fixes

* fallback to CSS ([#9876](https://github.com/puppeteer/puppeteer/issues/9876)) ([e6ec9c2](https://github.com/puppeteer/puppeteer/commit/e6ec9c295847fa0f1ec240952f0f2523bb13b7c8))
* implement protocol-level timeouts ([#9877](https://github.com/puppeteer/puppeteer/issues/9877)) ([510b36c](https://github.com/puppeteer/puppeteer/commit/510b36c50001c95783b00dc8af42b5801ec57358))
* viewport.deviceScaleFactor can be set to system default ([#9911](https://github.com/puppeteer/puppeteer/issues/9911)) ([022c909](https://github.com/puppeteer/puppeteer/commit/022c90932658d13ff4ae4aa51d26716f5dbe54ac))
* waitForNavigation issue with aborted events ([#9883](https://github.com/puppeteer/puppeteer/issues/9883)) ([36c029b](https://github.com/puppeteer/puppeteer/commit/36c029b38d64a10590bfc74ecea255a58914b0d2))


## [19.7.5](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.7.4...puppeteer-v19.7.5) (2023-03-14)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.7.4 to 19.7.5


### Bug Fixes

* sort elements based on selector matching algorithm ([#9836](https://github.com/puppeteer/puppeteer/issues/9836)) ([9044609](https://github.com/puppeteer/puppeteer/commit/9044609be3ea78c650420533e7f6f40b83cedd99))


### Performance Improvements

* use `querySelector*` for pure CSS selectors ([#9835](https://github.com/puppeteer/puppeteer/issues/9835)) ([8aea8e0](https://github.com/puppeteer/puppeteer/commit/8aea8e047103b72c0238dde8e4777acf7897ddaa))


## [19.7.4](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.7.3...puppeteer-v19.7.4) (2023-03-10)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.7.3 to 19.7.4


### Bug Fixes

* call _detach on disconnect ([#9807](https://github.com/puppeteer/puppeteer/issues/9807)) ([bc1a04d](https://github.com/puppeteer/puppeteer/commit/bc1a04def8f699ad245c12ec69ac176e3e7e888d))
* restore rimraf for puppeteer-core code ([#9815](https://github.com/puppeteer/puppeteer/issues/9815)) ([cefc4ea](https://github.com/puppeteer/puppeteer/commit/cefc4eab4750d2c1209eb36ca44f6963a4a6bf4c))
* update troubleshooting guide links in errors ([#9821](https://github.com/puppeteer/puppeteer/issues/9821)) ([0165f06](https://github.com/puppeteer/puppeteer/commit/0165f06deef9e45862fd127a205ade5ad30ddaa3))


## [19.7.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.7.2...puppeteer-v19.7.3) (2023-03-06)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.7.2 to 19.7.3


### Bug Fixes

* update dependencies ([#9781](https://github.com/puppeteer/puppeteer/issues/9781)) ([364b23f](https://github.com/puppeteer/puppeteer/commit/364b23f8b5c7b04974f233c58e5ded9a8f912ff2))


## [19.7.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.7.1...puppeteer-v19.7.2) (2023-02-20)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.7.1 to 19.7.2


### Bug Fixes

* bump chromium-bidi to a version that does not declare mitt as a peer dependency ([#9701](https://github.com/puppeteer/puppeteer/issues/9701)) ([82916c1](https://github.com/puppeteer/puppeteer/commit/82916c102b2c399093ba9019e272207b5ce81849))


## [19.7.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.7.0...puppeteer-v19.7.1) (2023-02-15)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.7.0 to 19.7.1


### Bug Fixes

* fix circularity on JSHandle interface ([#9661](https://github.com/puppeteer/puppeteer/issues/9661)) ([eb13863](https://github.com/puppeteer/puppeteer/commit/eb138635d661d3cdaf2940959fece5aca482178a))
* make chromium-bidi an opt peer dep ([#9667](https://github.com/puppeteer/puppeteer/issues/9667)) ([c6054ac](https://github.com/puppeteer/puppeteer/commit/c6054ac1a56c08ee7bf01321878699b7b4ab4e0b))


## [19.7.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.6.3...puppeteer-v19.7.0) (2023-02-13)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.6.3 to 19.7.0


### Features

* add touchstart, touchmove and touchend methods ([#9622](https://github.com/puppeteer/puppeteer/issues/9622)) ([c8bb11a](https://github.com/puppeteer/puppeteer/commit/c8bb11adfcf1537032730a91baa3c36a6e324926))
* **chromium:** roll to Chromium 111.0.5556.0 (r1095492) ([#9656](https://github.com/puppeteer/puppeteer/issues/9656)) ([df59d01](https://github.com/puppeteer/puppeteer/commit/df59d010c20644da06eb4c4e28a11c4eea164aba))


### Bug Fixes

* `page.goto` error throwing on 40x/50x responses with an empty body ([#9523](https://github.com/puppeteer/puppeteer/issues/9523)) ([#9577](https://github.com/puppeteer/puppeteer/issues/9577)) ([ddb0cc1](https://github.com/puppeteer/puppeteer/commit/ddb0cc174d2a14c0948dcdaf9bae78620937c667))


## [19.6.3](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.6.2...puppeteer-v19.6.3) (2023-02-01)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.6.2 to 19.6.3


### Bug Fixes

* ignore not found contexts for console messages ([#9595](https://github.com/puppeteer/puppeteer/issues/9595)) ([390685b](https://github.com/puppeteer/puppeteer/commit/390685bbe52c22b686fc0e3119b4ac7b1073c581))
* restore WaitTask terminate  condition ([#9612](https://github.com/puppeteer/puppeteer/issues/9612)) ([e16cbc6](https://github.com/puppeteer/puppeteer/commit/e16cbc6626cffd40d0caa30801620e7293455006))


## [19.6.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.6.1...puppeteer-v19.6.2) (2023-01-27)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.6.1 to 19.6.2


### Bug Fixes

* atomically get Puppeteer utilities ([#9597](https://github.com/puppeteer/puppeteer/issues/9597)) ([050a7b0](https://github.com/puppeteer/puppeteer/commit/050a7b062415ebaf10bcb71c405143eacc4e5d4b))


## [19.6.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.6.0...puppeteer-v19.6.1) (2023-01-26)


### Bug Fixes

* don't clean up previous browser versions ([#9568](https://github.com/puppeteer/puppeteer/issues/9568)) ([344bc2a](https://github.com/puppeteer/puppeteer/commit/344bc2af62e4068fe2cb8162d4b6c8242aac843b)), closes [#9533](https://github.com/puppeteer/puppeteer/issues/9533)
* mimic rejection for PuppeteerUtil on early call ([#9589](https://github.com/puppeteer/puppeteer/issues/9589)) ([1980de9](https://github.com/puppeteer/puppeteer/commit/1980de91a161523c7098a79919b20e6d8d2e5d81))
* **revert:** use LazyArg for puppeteer utilities ([#9590](https://github.com/puppeteer/puppeteer/issues/9590)) ([6edd996](https://github.com/puppeteer/puppeteer/commit/6edd99676827de2c83f7a858e4f903b1c34e7d35))
* use LazyArg for puppeteer utilities ([#9575](https://github.com/puppeteer/puppeteer/issues/9575)) ([496658f](https://github.com/puppeteer/puppeteer/commit/496658f02945b53096483f36cb3d64556cff045e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.6.0 to 19.6.1


## [19.6.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.5.2...puppeteer-v19.6.0) (2023-01-23)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.5.2 to 19.6.0


### Features

* **chromium:** roll to Chromium 110.0.5479.0 (r1083080) ([#9500](https://github.com/puppeteer/puppeteer/issues/9500)) ([06e816b](https://github.com/puppeteer/puppeteer/commit/06e816bbfa7b9ca84284929f654de7288c51169d)), closes [#9470](https://github.com/puppeteer/puppeteer/issues/9470)
* **page:** Adding support for referrerPolicy in `page.goto` ([#9561](https://github.com/puppeteer/puppeteer/issues/9561)) ([e3d69ec](https://github.com/puppeteer/puppeteer/commit/e3d69ec554beeac37bd206a21921d2fed3cb968c))


### Bug Fixes

* firefox revision resolution should not update chrome revision ([#9507](https://github.com/puppeteer/puppeteer/issues/9507)) ([f59bbf4](https://github.com/puppeteer/puppeteer/commit/f59bbf4014644dec6f395713e8403939aebe06ea)), closes [#9461](https://github.com/puppeteer/puppeteer/issues/9461)
* improve screenshot method types ([#9529](https://github.com/puppeteer/puppeteer/issues/9529)) ([6847f88](https://github.com/puppeteer/puppeteer/commit/6847f8835f28e97edba6fce76a4cbf85561482b9))


## [19.5.2](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.5.1...puppeteer-v19.5.2) (2023-01-11)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.5.1 to 19.5.2


### Bug Fixes

* make sure browser fetcher in launchers uses configuration ([#9493](https://github.com/puppeteer/puppeteer/issues/9493)) ([df55439](https://github.com/puppeteer/puppeteer/commit/df554397b51e97aea2765b325f9a887b50b9263a)), closes [#9470](https://github.com/puppeteer/puppeteer/issues/9470)


## [19.5.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.5.0...puppeteer-v19.5.1) (2023-01-11)


### Bug Fixes

* use puppeteer node for installation script ([#9489](https://github.com/puppeteer/puppeteer/issues/9489)) ([9bf90d9](https://github.com/puppeteer/puppeteer/commit/9bf90d9f4b5aeab06f8b433714712cad3259d36e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.5.0 to 19.5.1


## [19.5.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.4.1...puppeteer-v19.5.0) (2023-01-05)


### Features

* add element validation ([#9352](https://github.com/puppeteer/puppeteer/issues/9352)) ([c7a063a](https://github.com/puppeteer/puppeteer/commit/c7a063a15274856184356e15f2ae4be41191d309))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.4.1 to 19.5.0


### Bug Fixes

* **puppeteer-core:** target interceptor is not async ([#9430](https://github.com/puppeteer/puppeteer/issues/9430)) ([e3e9cc6](https://github.com/puppeteer/puppeteer/commit/e3e9cc622ac32f2067b6e74b5e8706c63169a157))


## [19.4.1](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.4.0...puppeteer-v19.4.1) (2022-12-16)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.4.0 to 19.4.1


### Bug Fixes

* improve a11y snapshot handling if the tree is not correct ([#9405](https://github.com/puppeteer/puppeteer/issues/9405)) ([02fe501](https://github.com/puppeteer/puppeteer/commit/02fe50194e60bd14c3a82539473a0313ab88c766)), closes [#9404](https://github.com/puppeteer/puppeteer/issues/9404)
* remove oopif expectations and fix oopif flakiness ([#9375](https://github.com/puppeteer/puppeteer/issues/9375)) ([810e0cd](https://github.com/puppeteer/puppeteer/commit/810e0cd74ecef353cfa43746c18bd5f580a3233d))


## [19.4.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.3.0...puppeteer-v19.4.0) (2022-12-07)


### Features

* ability to send headers via ws connection to browser in node.js environment ([#9314](https://github.com/puppeteer/puppeteer/issues/9314)) ([937fffa](https://github.com/puppeteer/puppeteer/commit/937fffaedc340ea12d5f6636d3ba6598cb22e397)), closes [#7218](https://github.com/puppeteer/puppeteer/issues/7218)
* **chromium:** roll to Chromium 109.0.5412.0 (r1069273) ([#9364](https://github.com/puppeteer/puppeteer/issues/9364)) ([1875da6](https://github.com/puppeteer/puppeteer/commit/1875da61916df1fbcf98047858c01075bd9af189)), closes [#9233](https://github.com/puppeteer/puppeteer/issues/9233)
* **puppeteer-core:** keydown supports commands ([#9357](https://github.com/puppeteer/puppeteer/issues/9357)) ([b7ebc5d](https://github.com/puppeteer/puppeteer/commit/b7ebc5d9bb9b9940ffdf470e51d007f709587d40))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.3.0 to 19.4.0


### Bug Fixes

* **puppeteer-core:** avoid type instantiation errors ([#9370](https://github.com/puppeteer/puppeteer/issues/9370)) ([17f31a9](https://github.com/puppeteer/puppeteer/commit/17f31a9ee408ca5a08fe6dbceb8915e710156bd3)), closes [#9369](https://github.com/puppeteer/puppeteer/issues/9369)


## [19.3.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v19.2.2...puppeteer-v19.3.0) (2022-11-23)


### Miscellaneous Chores

* **puppeteer:** Synchronize puppeteer versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.2.2 to 19.3.0


### Features

* **puppeteer-core:** Infer element type from complex selector ([#9253](https://github.com/puppeteer/puppeteer/issues/9253)) ([bef1061](https://github.com/puppeteer/puppeteer/commit/bef1061c064e5135d86a48fffd7278f3e7f4a29e))
* **puppeteer-core:** update Chrome launcher flags ([#9239](https://github.com/puppeteer/puppeteer/issues/9239)) ([ae87bfc](https://github.com/puppeteer/puppeteer/commit/ae87bfc2b4361556e3660a1de2c6db348ce663ae))


### Bug Fixes

* remove boundary conditions for visibility ([#9249](https://github.com/puppeteer/puppeteer/issues/9249)) ([e003513](https://github.com/puppeteer/puppeteer/commit/e003513c0c049aad38e374a16dc96c3e54ab0de5))


## [19.2.2](https://github.com/puppeteer/puppeteer/compare/v19.2.1...v19.2.2) (2022-11-03)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.2.1 to ^19.2.2


### Bug Fixes

* update missing product message ([#9207](https://github.com/puppeteer/puppeteer/issues/9207)) ([29f47e2](https://github.com/puppeteer/puppeteer/commit/29f47e2e150ff7bfd89e38a4ce4ca34eac7f2fdf))


## [19.2.1](https://github.com/puppeteer/puppeteer/compare/v19.2.0...v19.2.1) (2022-10-28)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.2.0 to ^19.2.1


### Bug Fixes

* resolve navigation requests when request fails ([#9178](https://github.com/puppeteer/puppeteer/issues/9178)) ([c11297b](https://github.com/puppeteer/puppeteer/commit/c11297baa5124eb89f7686c3eb446d2ba1b7123a)), closes [#9175](https://github.com/puppeteer/puppeteer/issues/9175)


## [19.2.0](https://github.com/puppeteer/puppeteer/compare/v19.1.2...v19.2.0) (2022-10-26)


### Features

* **chromium:** roll to Chromium 108.0.5351.0 (r1056772) ([#9153](https://github.com/puppeteer/puppeteer/issues/9153)) ([e78a4e8](https://github.com/puppeteer/puppeteer/commit/e78a4e89c22bb1180e72d180c16b39673ff9125e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.1.1 to ^19.2.0


## [19.1.2](https://github.com/puppeteer/puppeteer/compare/v19.1.1...v19.1.2) (2022-10-25)
### Bug Fixes
* skip browser download ([#9160](https://github.com/puppeteer/puppeteer/issues/9160)) ([2245d7d](https://github.com/puppeteer/puppeteer/commit/2245d7d6ed0630ee1ad985dcbd48354772924750))
## [19.1.1](https://github.com/puppeteer/puppeteer/compare/v19.1.0...v19.1.1) (2022-10-21)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.1.0 to ^19.1.1


### Bug Fixes

* update documentation on configuring puppeteer ([#9150](https://github.com/puppeteer/puppeteer/issues/9150)) ([f07ad2c](https://github.com/puppeteer/puppeteer/commit/f07ad2c6616ecd2a959b0c1a65b167ba77611d61))


## [19.1.0](https://github.com/puppeteer/puppeteer/compare/v19.0.0...v19.1.0) (2022-10-21)


### Features

* expose browser context id ([#9134](https://github.com/puppeteer/puppeteer/issues/9134)) ([122778a](https://github.com/puppeteer/puppeteer/commit/122778a1f8b60e0dcc6f0ffcb2097e95ae98f4a3)), closes [#9132](https://github.com/puppeteer/puppeteer/issues/9132)
* use configuration files ([#9140](https://github.com/puppeteer/puppeteer/issues/9140)) ([ec20174](https://github.com/puppeteer/puppeteer/commit/ec201744f077987b288e3dff52c0906fe700f6fb)), closes [#9128](https://github.com/puppeteer/puppeteer/issues/9128)


### Bug Fixes

* update `BrowserFetcher` deprecation message ([#9141](https://github.com/puppeteer/puppeteer/issues/9141)) ([efcbc97](https://github.com/puppeteer/puppeteer/commit/efcbc97c60e4cfd49a9ed25a900f6133d06b290b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 19.0.0 to ^19.1.0


## [19.0.0](https://github.com/puppeteer/puppeteer/compare/v18.2.1...v19.0.0) (2022-10-14)


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


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 18.2.1 to ^19.0.0


## [18.2.1](https://github.com/puppeteer/puppeteer/compare/v18.2.0...v18.2.1) (2022-10-06)


### Bug Fixes

* add README to package during prepack ([#9057](https://github.com/puppeteer/puppeteer/issues/9057)) ([9374e23](https://github.com/puppeteer/puppeteer/commit/9374e23d3da5e40378461ed08db24649730a445a))
* waitForRequest works with async predicate ([#9058](https://github.com/puppeteer/puppeteer/issues/9058)) ([8f6b2c9](https://github.com/puppeteer/puppeteer/commit/8f6b2c9b7c219d405c954bf7af082d3d29fd48ff))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 18.2.0 to ^18.2.1


## [18.2.0](https://github.com/puppeteer/puppeteer/compare/puppeteer-v18.1.0...puppeteer-v18.2.0) (2022-10-05)


### Features

* separate puppeteer and puppeteer-core ([#9023](https://github.com/puppeteer/puppeteer/issues/9023)) ([f42336c](https://github.com/puppeteer/puppeteer/commit/f42336cf83982332829ca7e14ee48d8676e11545))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * puppeteer-core bumped from 18.1.0 to ^18.2.0


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


## [14.1.1](https://github.com/puppeteer/puppeteer/compare/v14.1.0...v14.1.1) (2022-05-19)


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


## [13.5.2](https://github.com/puppeteer/puppeteer/compare/v13.5.1...v13.5.2) (2022-03-31)


### Bug Fixes

* chromium downloading hung at 99% ([#8169](https://github.com/puppeteer/puppeteer/issues/8169)) ([8f13470](https://github.com/puppeteer/puppeteer/commit/8f13470af06045857f32496f03e77b14f3ecff98))
* get extra headers from Fetch.requestPaused event ([#8162](https://github.com/puppeteer/puppeteer/issues/8162)) ([37ede68](https://github.com/puppeteer/puppeteer/commit/37ede6877017a8dc6c946a3dff4ec6d79c3ebc59))


## [13.5.1](https://github.com/puppeteer/puppeteer/compare/v13.5.0...v13.5.1) (2022-03-09)


### Bug Fixes

* waitForNavigation in OOPIFs ([#8117](https://github.com/puppeteer/puppeteer/issues/8117)) ([34775e5](https://github.com/puppeteer/puppeteer/commit/34775e58316be49d8bc5a13209a1f570bc66b448))


## [13.5.0](https://github.com/puppeteer/puppeteer/compare/v13.4.1...v13.5.0) (2022-03-07)


### Features

* **chromium:** roll to Chromium 100.0.4889.0 (r970485) ([#8108](https://github.com/puppeteer/puppeteer/issues/8108)) ([d12f427](https://github.com/puppeteer/puppeteer/commit/d12f42754f7013b5ec0a2198cf2d9cf945d3cb38))


### Bug Fixes

* Inherit browser-level proxy settings from incognito context ([#7770](https://github.com/puppeteer/puppeteer/issues/7770)) ([3feca32](https://github.com/puppeteer/puppeteer/commit/3feca325a9472ee36f7e866ebe375c7f083e0e36))
* **page:** page.createIsolatedWorld error catching has been added ([#7848](https://github.com/puppeteer/puppeteer/issues/7848)) ([309e8b8](https://github.com/puppeteer/puppeteer/commit/309e8b80da0519327bc37b44a3ebb6f2e2d357a7))
* **tests:** ensure all tests honour BINARY envvar ([#8092](https://github.com/puppeteer/puppeteer/issues/8092)) ([3b8b9ad](https://github.com/puppeteer/puppeteer/commit/3b8b9adde5d18892af96329b6f9303979f9c04f5))


## [13.4.1](https://github.com/puppeteer/puppeteer/compare/v13.4.0...v13.4.1) (2022-03-01)


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


## [13.3.2](https://github.com/puppeteer/puppeteer/compare/v13.3.1...v13.3.2) (2022-02-14)


### Bug Fixes

* always use ENV executable path when present ([#7985](https://github.com/puppeteer/puppeteer/issues/7985)) ([6d6ea9b](https://github.com/puppeteer/puppeteer/commit/6d6ea9bf59daa3fb851b3da8baa27887e0aa2c28))
* use require.resolve instead of __dirname ([#8003](https://github.com/puppeteer/puppeteer/issues/8003)) ([bbb186d](https://github.com/puppeteer/puppeteer/commit/bbb186d88cb99e4914299c983c822fa41a80f356))


## [13.3.1](https://github.com/puppeteer/puppeteer/compare/v13.3.0...v13.3.1) (2022-02-10)


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


## [13.1.3](https://github.com/puppeteer/puppeteer/compare/v13.1.2...v13.1.3) (2022-01-31)


### Bug Fixes

* issue with reading versions.js in doclint ([#7940](https://github.com/puppeteer/puppeteer/issues/7940)) ([06ba963](https://github.com/puppeteer/puppeteer/commit/06ba9632a4c63859244068d32c312817d90daf63))
* make more files work in strict-mode TypeScript ([#7936](https://github.com/puppeteer/puppeteer/issues/7936)) ([0636513](https://github.com/puppeteer/puppeteer/commit/0636513e34046f4d40b5e88beb2b18b16dab80aa))
* page.pdf producing an invalid pdf ([#7868](https://github.com/puppeteer/puppeteer/issues/7868)) ([afea509](https://github.com/puppeteer/puppeteer/commit/afea509544fb99bfffe5b0bebe6f3575c53802f0)), closes [#7757](https://github.com/puppeteer/puppeteer/issues/7757)


## [13.1.2](https://github.com/puppeteer/puppeteer/compare/v13.1.1...v13.1.2) (2022-01-25)


### Bug Fixes

* **package.json:** update node-fetch package ([#7924](https://github.com/puppeteer/puppeteer/issues/7924)) ([e4c48d3](https://github.com/puppeteer/puppeteer/commit/e4c48d3b8c2a812752094ed8163e4f2f32c4b6cb))
* types in Browser.ts to be compatible with strict mode Typescript ([#7918](https://github.com/puppeteer/puppeteer/issues/7918)) ([a8ec0aa](https://github.com/puppeteer/puppeteer/commit/a8ec0aadc9c90d224d568d9e418d14261e6e85b1)), closes [#6769](https://github.com/puppeteer/puppeteer/issues/6769)
* types in Connection.ts to be compatible with strict mode Typescript ([#7919](https://github.com/puppeteer/puppeteer/issues/7919)) ([d80d602](https://github.com/puppeteer/puppeteer/commit/d80d6027ea8e1b7fcdaf045398629cf8e6512658)), closes [#6769](https://github.com/puppeteer/puppeteer/issues/6769)


## [13.1.1](https://github.com/puppeteer/puppeteer/compare/v13.1.0...v13.1.1) (2022-01-18)


### Bug Fixes

* use content box for OOPIF offset calculations ([#7911](https://github.com/puppeteer/puppeteer/issues/7911)) ([344feb5](https://github.com/puppeteer/puppeteer/commit/344feb53c28ce018a4c600d408468f6d9d741eee))


## [13.1.0](https://github.com/puppeteer/puppeteer/compare/v13.0.1...v13.1.0) (2022-01-17)


### Features

* **chromium:** roll to Chromium 98.0.4758.0 (r950341) ([#7907](https://github.com/puppeteer/puppeteer/issues/7907)) ([a55c86f](https://github.com/puppeteer/puppeteer/commit/a55c86fac504b5e89ba23735fb3a1b1d54a4e1e5))


### Bug Fixes

* apply OOPIF offsets to bounding box and box model calls ([#7906](https://github.com/puppeteer/puppeteer/issues/7906)) ([a566263](https://github.com/puppeteer/puppeteer/commit/a566263ba28e58ff648bffbdb628606f75d5876f))
* correctly compute clickable points for elements inside OOPIFs ([#7900](https://github.com/puppeteer/puppeteer/issues/7900)) ([486bbe0](https://github.com/puppeteer/puppeteer/commit/486bbe010d5ee5c446d9e8daf61a080232379c3f)), closes [#7849](https://github.com/puppeteer/puppeteer/issues/7849)
* error for pre-existing OOPIFs ([#7899](https://github.com/puppeteer/puppeteer/issues/7899)) ([d7937b8](https://github.com/puppeteer/puppeteer/commit/d7937b806d331bf16c2016aaf16e932b1334eac8)), closes [#7844](https://github.com/puppeteer/puppeteer/issues/7844) [#7896](https://github.com/puppeteer/puppeteer/issues/7896)


## [13.0.1](https://github.com/puppeteer/puppeteer/compare/v13.0.0...v13.0.1) (2021-12-22)


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


## [12.0.1](https://github.com/puppeteer/puppeteer/compare/v12.0.0...v12.0.1) (2021-11-29)


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


## [9.1.1](https://github.com/puppeteer/puppeteer/compare/v9.1.0...v9.1.1) (2021-05-05)


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


## [7.0.4](https://github.com/puppeteer/puppeteer/compare/v7.0.3...v7.0.4) (2021-02-09)


### Bug Fixes

* make publish bot run full build, not just tsc ([#6848](https://github.com/puppeteer/puppeteer/issues/6848)) ([f718b14](https://github.com/puppeteer/puppeteer/commit/f718b14b64df8be492d344ddd35e40961ff750c5))


## [7.0.3](https://github.com/puppeteer/puppeteer/compare/v7.0.2...v7.0.3) (2021-02-09)


### Bug Fixes

* include lib/types.d.ts in files list ([#6844](https://github.com/puppeteer/puppeteer/issues/6844)) ([e34f317](https://github.com/puppeteer/puppeteer/commit/e34f317b37533256a063c1238609b488d263b998))


## [7.0.2](https://github.com/puppeteer/puppeteer/compare/v7.0.1...v7.0.2) (2021-02-09)


### Bug Fixes

* much better TypeScript definitions ([#6837](https://github.com/puppeteer/puppeteer/issues/6837)) ([f1b46ab](https://github.com/puppeteer/puppeteer/commit/f1b46ab5faa262f893c17923579d0cf52268a764))
* **domworld:** reset bindings when context changes ([#6766](https://github.com/puppeteer/puppeteer/issues/6766)) ([#6836](https://github.com/puppeteer/puppeteer/issues/6836)) ([4e8d074](https://github.com/puppeteer/puppeteer/commit/4e8d074c2f8384a2f283f5edf9ef69c40bd8464f))
* **launcher:** output correct error message for browser ([#6815](https://github.com/puppeteer/puppeteer/issues/6815)) ([6c61874](https://github.com/puppeteer/puppeteer/commit/6c618747979c3a08f2727e9e22fe45cade8c926a))


## [7.0.1](https://github.com/puppeteer/puppeteer/compare/v7.0.0...v7.0.1) (2021-02-04)


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

