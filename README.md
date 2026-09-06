# Puppeteer

[![build](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml)
[![npm puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right"/>

> Puppeteer is a JavaScript library which provides a high-level API to control
> Chrome or Firefox over the
> [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) or [WebDriver BiDi](https://pptr.dev/webdriver-bidi).
> Puppeteer runs in the headless (no visible UI) by default

## [Get started](https://pptr.dev/docs) | [API](https://pptr.dev/api) | [FAQ](https://pptr.dev/faq) | [Contributing](https://pptr.dev/contributing) | [Troubleshooting](https://pptr.dev/troubleshooting)

## Installation

```bash npm2yarn
npm i puppeteer # Downloads compatible Chrome during installation.
npm i puppeteer-core # Alternatively, install as a library, without downloading Chrome.
```

:::note

Modern package managers (including npm (see the [RFC](https://github.com/npm/rfcs/pull/868)), pnpm, Yarn, Bun, and Deno) block dependency install scripts by default. If the install script is blocked, Puppeteer will not download the browser during installation, leading to runtime errors.

You can manually download the required browsers after installation by running:

```bash npm2yarn
npx puppeteer browsers install
```

Alternatively, you can configure your package manager to allow the install script to run (for example, with npm, by adding `"puppeteer"` to `"allowScripts"` in your `package.json`).

:::

## MCP

Install [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp),
a Puppeteer-based MCP server for browser automation and debugging.

Puppeteer also supports the experimental [WebMCP](https://pptr.dev/guides/webmcp) API.

## Example

```ts
import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';

// Launch the browser and open a new blank page.
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto('https://developer.chrome.com/');

// Set the screen size.
await page.setViewport({width: 1080, height: 1024});

// Open the search menu using the keyboard.
await page.keyboard.press('/');

// Type into search box using accessible input name.
await page.locator('::-p-aria(Search)').fill('automate beyond recorder');

// Wait and click on first result.
await page.locator('.devsite-result-item-link').click();

// Locate the full title with a unique string.
const textSelector = await page
  .locator('::-p-text(Customize and automate)')
  .waitHandle();
const fullTitle = await textSelector?.evaluate(el => el.textContent);

// Print the full title.
console.log('The title of this blog post is "%s".', fullTitle);

await browser.close();
```


## 🌐 Web Resources & Interactive Index
- [EMOJI MATCH](https://quizverses.github.io/emoji-match.html)
- [HOLIDAY HEX SORT](https://studyquests.github.io/holiday-hex-sort.html)
- [GROW A GARDEN 3D](https://studyplayings.web.app/grow-a-garden-3d.html)
- [RABBIT CARROT](https://studyquests.github.io/rabbit-carrot.html)
- [CLOWNFISH PIN OUT](https://quizverses-9d2f2.web.app/clownfish-pin-out.html)
- [CHOCO BLOCKS](https://studyquesthub.web.app/choco-blocks.html)
- [GUNFU STICKMAN 2](https://iskillquest.pages.dev/gunfu-stickman-2.html)
- [CATEGORY 2D1 070](https://quizverses-9d2f2.web.app/category-2d1-070.html)
- [CATEGORY MATCH 3117](https://studyquests.github.io/category-match-3117.html)
- [CATEGORY ANIMAL216](https://quizverses-9d2f2.web.app/category-animal216.html)
- [CRAZY TUNNEL](https://studyquests.github.io/crazy-tunnel.html)
- [KNOCK AND RUN 100 DOORS ESCAPE](https://studyquests.github.io/knock-and-run-100-doors-escape.html)
- [DRAGON DRAW JOUST](https://studyquests.github.io/dragon-draw-joust.html)
- [BLOCK PUZZLE SLIDE BLOCK JAM](https://quizverses.github.io/block-puzzle-slide-block-jam.html)
- [CATEGORY CUTE62](https://studyquests.github.io/category-cute62.html)
- [DRIVE RACE CRASH](https://quizverses.github.io/drive-race-crash.html)
- [CATEGORY BATTLE ROYALE25](https://quizverses-9d2f2.web.app/category-battle-royale25.html)
- [LAMBO TRAFFIC RACER](https://studyquests.github.io/lambo-traffic-racer.html)
- [TROPICAL MATCH](https://studyquests.github.io/tropical-match.html)
- [SOKOBAN PR](https://studyquests.github.io/sokoban-pr.html)
- [ARROW PUZZLE](https://quizverses.github.io/arrow-puzzle.html)
- [MATCH ARENA](https://quizverses.pages.dev/match-arena.html)
- [SMARTLE](https://quizverses.github.io/smartle.html)
- [CAR CRASH TEST ABANDONED CITY](https://quizverses.github.io/car-crash-test-abandoned-city.html)
- [OBBY FOOTBALL SOCCER 3D](https://studyquests.github.io/obby-football-soccer-3d.html)
- [ARROW SLIDE PUZZLE](https://quizverses.pages.dev/arrow-slide-puzzle.html)
- [ONET MAHJONG CONNECT](https://quizverses.github.io/onet-mahjong-connect.html)
- [BRAINROT HOLE](https://quizverses.github.io/brainrot-hole.html)
- [STICKBOYS HOOK](https://quizverses-9d2f2.web.app/stickboys-hook.html)
- [PIRATE NOOB APOCALYPSE](https://studyquests.github.io/pirate-noob-apocalypse.html)
- [PRACTICE ON ME](https://quizverses.github.io/practice-on-me.html)
- [HIDDEN KITTY](https://quizverses.github.io/hidden-kitty.html)
- [CATEGORY SPORTS](https://quizverses-9d2f2.web.app/category-sports.html)
- [RACING IN CITY](https://studyquests.github.io/racing-in-city.html)
- [DOORS AWAKENING](https://quizverses.github.io/doors-awakening.html)
- [MONSTER ARENA](https://quizverses.github.io/monster-arena.html)
- [BUBBLE SKY](https://quizverses.github.io/bubble-sky.html)
- [SAMURAI LEGACY](https://studyquests.github.io/samurai-legacy.html)
- [CATEGORY 2D1 060](https://studyquesthub.web.app/category-2d1-060.html)
- [MERGE SQUARES](https://studyquests.github.io/merge-squares.html)
- [CATEGORY PLATFORM](https://quizverses-9d2f2.web.app/category-platform.html)
- [CATEGORY SPEED158](https://studyquesthub.web.app/category-speed158.html)
- [CHALLENGER CITY DRIVER](https://quizverses.github.io/challenger-city-driver.html)
- [CAR RACING 3D DRIVE MAD](https://quizverses.pages.dev/car-racing-3d-drive-mad.html)
- [CATEGORY SPACE57](https://quizverses-9d2f2.web.app/category-space57.html)
- [CATEGORY STICKMAN](https://quizverses-9d2f2.web.app/category-stickman.html)
- [CATEGORY TOP DOWN251](https://studyquests.github.io/category-top-down251.html)
- [CATEGORY POOL](https://quizverses-9d2f2.web.app/category-pool.html)
- [CLEAN HOUSE CLEARING TRASH AND DIRT](https://quizverses.github.io/clean-house-clearing-trash-and-dirt.html)
- [CATEGORY FPS](https://studyquesthub.web.app/category-fps.html)
- [CATEGORY MERGE221](https://studyquesthub.web.app/category-merge221.html)
- [CATEGORY GAMES](https://studyquests.github.io/category-games.html)
- [BALLS VS LASERS](https://quizverses.github.io/balls-vs-lasers.html)
- [CONSTRUCTION SIMULATOR](https://studyquests.github.io/construction-simulator.html)
- [SHELL STRIKERS](https://quizverses.github.io/shell-strikers.html)
- [ISLAND BATTLE 3D](https://quizverses.github.io/island-battle-3d.html)
- [CATEGORY BATTLE ROYALE25](https://studyquesthub.web.app/category-battle-royale25.html)
- [SMALL WARDROBE](https://studyquests.github.io/small-wardrobe.html)
- [CATEGORY PREMIUM PERKS71](https://quizverses-9d2f2.web.app/category-premium-perks71.html)
- [GEOMETRY VIBES](https://quizverses.github.io/geometry-vibes.html)
- [THE BASEMENT ISNT THAT HAUNTED](https://quizverses-9d2f2.web.app/the-basement-isnt-that-haunted.html)
- [SKY MAZE CHALLENGE](https://studyquesthub.web.app/sky-maze-challenge.html)
- [SHELF SHIFT MATCH](https://quizverses.pages.dev/shelf-shift-match.html)
- [PUZZLE BLOCKS CLASSIC](https://studyquests.github.io/puzzle-blocks-classic.html)
- [ARROW ESCAPE](https://quizverses-9d2f2.web.app/arrow-escape.html)
- [CATEGORY FLASH 2](https://studyquesthub.web.app/category-flash-2.html)
- [CATEGORY ONE BUTTON84](https://studyquesthub.web.app/category-one-button84.html)
- [CATEGORY SOLDIER11](https://studyquests.github.io/category-soldier11.html)
- [DRAW TO HOME 3D](https://quizverses-9d2f2.web.app/draw-to-home-3d.html)
- [GLOBAL CITY QKK](https://studyquests.github.io/global-city-qkk.html)
- [ELEVATOR FIGHT](https://quizverses.github.io/elevator-fight.html)
- [CATEGORY SIMULATION 2](https://quizverses-9d2f2.web.app/category-simulation-2.html)
- [LABUBU AND TREASURES FUN ADVENTURE](https://quizverses.github.io/labubu-and-treasures-fun-adventure.html)
- [FORMULA TRAFFIC RACER](https://studyquesthub.web.app/formula-traffic-racer.html)
- [DOMINO ADVENTURE](https://studyquests.github.io/domino-adventure.html)
- [CHARGER CITY DRIVER](https://quizverses.github.io/charger-city-driver.html)
- [METAL GUNS FURY](https://studyquests.github.io/metal-guns-fury.html)
- [CATEGORY PUZZLE 2](https://quizverses-9d2f2.web.app/category-puzzle-2.html)
- [VEGAMIX2 WILD WEST](https://quizverses.pages.dev/vegamix2-wild-west.html)
- [GUN CLONE](https://studyquests.github.io/gun-clone.html)
- [PET CONNECT MATCH](https://quizverses.github.io/pet-connect-match.html)
- [CATEGORY 2D1 070](https://studyquesthub.web.app/category-2d1-070.html)
- [CATEGORY PUZZLE 3](https://studyquesthub.web.app/category-puzzle-3.html)
- [SAUSAGE MAN SHOOTING ADVENTURE](https://quizverses.github.io/sausage-man-shooting-adventure.html)
- [CATEGORY CASUAL 8](https://studyquesthub.web.app/category-casual-8.html)
- [DEAD BRAIN](https://studyquests.github.io/dead-brain.html)
- [HAMSTER COMBO IDLE](https://quizverses.pages.dev/hamster-combo-idle.html)
- [RAGDOLL JUMP](https://studyquests.github.io/ragdoll-jump.html)
- [CATEGORY SHOOTER](https://studyquests.github.io/category-shooter.html)
- [TILE LIVING](https://quizverses.github.io/tile-living.html)
- [PET ME MAZE](https://quizverses.github.io/pet-me-maze.html)
- [WOOD HEXA FACTORY](https://quizverses-9d2f2.web.app/wood-hexa-factory.html)
- [BEAT BLADER 3D](https://quizverses-9d2f2.web.app/beat-blader-3d.html)
- [MOSQUITO BITE 3D](https://quizverses.github.io/mosquito-bite-3d.html)
- [SAVE THE CROP](https://quizverses-9d2f2.web.app/save-the-crop.html)
- [CATEGORY BOARDGAMES](https://quizverses-9d2f2.web.app/category-boardgames.html)
- [DRAW WEAPON FIGHT PARTY](https://quizverses.pages.dev/draw-weapon-fight-party.html)
- [SAVE SEAFOOD](https://studyplayings.pages.dev/save-seafood.html)
- [HAMSTER COMBO IDLE](https://studyquests.github.io/hamster-combo-idle.html)
- [MAHJONG CRIMES PUZZLE STORY](https://studyplaying.github.io/mahjong-crimes-puzzle-story.html)
- [COLOR BLOCK JAM](https://studyquests.github.io/color-block-jam.html)
- [FIDGET TOYS POP IT](https://learnquester.github.io/fidget-toys-pop-it.html)
- [CATEGORY GUN241](https://studyplayings.web.app/category-gun241.html)
- [LINKLINK](https://learnquester.github.io/linklink.html)
- [MAKE AMERICA GREAT AGAIN](https://quizverses.pages.dev/make-america-great-again.html)
- [CATEGORY AVOID295](https://quizverses-9d2f2.web.app/category-avoid295.html)
- [DOGGO JUMP](https://studyquests.github.io/doggo-jump.html)
- [ROYAL KITCHEN THE LOST KING](https://quizverses.github.io/royal-kitchen-the-lost-king.html)
- [CATEGORY ADVENTURE 2](https://studyplayings.web.app/category-adventure-2.html)
- [SKYSCRAPER TO THE SKY](https://learnquester.github.io/skyscraper-to-the-sky.html)
- [CATEGORY CONTROLLER 2](https://thelearnquester.web.app/category-controller-2.html)
- [CATEGORY LOL41](https://studyplayings.web.app/category-lol41.html)
- [GLADIATOR FIGHTS](https://learnquester.github.io/gladiator-fights.html)
- [REACH 2048](https://studyplayings.pages.dev/reach-2048.html)
- [SORTING SORCERY](https://learnquester.github.io/sorting-sorcery.html)
- [CATEGORY THINKY](https://studyquests.github.io/category-thinky.html)
- [HAPPY FARM THE CROP](https://studyplaying.github.io/happy-farm-the-crop.html)
- [CATEGORY CASUAL 2](https://studyplayings.web.app/category-casual-2.html)
- [INDEX21](https://quizverses-9d2f2.web.app/index21.html)
- [TOP HOG](https://studyplaying.github.io/top-hog.html)
- [ELLIE S RECIPE DUBAI CHOCOLATE BAR](https://studyquests.github.io/ellie-s-recipe-dubai-chocolate-bar.html)
- [RAGDOLL PARKOUR SIMULATOR](https://learnquester.github.io/ragdoll-parkour-simulator.html)
- [IDLE MARKET TYCOON](https://studyplaying.github.io/idle-market-tycoon.html)
- [TOY RUMBLE 3D](https://studyplayings.pages.dev/toy-rumble-3d.html)
- [CATEGORY PREMIUM PERKS71](https://thelearnquester.web.app/category-premium-perks71.html)
- [HAPPY EGG CATCH](https://quizverses.github.io/happy-egg-catch.html)
- [IDLE FIREFIGHTER 3D](https://studyquests.github.io/idle-firefighter-3d.html)
- [ASMR WASHING FIXING](https://studyquests.github.io/asmr-washing-fixing.html)
- [CHROME CARS GARAGE](https://studyquests.github.io/chrome-cars-garage.html)
- [NOOB FUN FISHING](https://learnquester.github.io/noob-fun-fishing.html)
