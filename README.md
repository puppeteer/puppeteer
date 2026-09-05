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
- [PUZZLE BLOCKS CLASSIC](https://LearnQuesters.pages.dev/puzzle-blocks-classic.html)
- [FISH JAM](https://StudyPlayings.web.app/fish-jam.html)
- [CATEGORY COLLECT565](https://StudyQuests.github.io/category-collect565.html)
- [GRANNY HALLOWEEN HOUSE](https://StudyQuests.github.io/granny-halloween-house.html)
- [HEX SENSE](https://StudyQuests.github.io/hex-sense.html)
- [2048 BLOCK FUSION](https://StudyQuests.github.io/2048-block-fusion.html)
- [CHRISTMAS SORTING](https://QuizVerses.pages.dev/christmas-sorting.html)
- [QUIZMANIA TRIVIA GAME](https://StudyQuests.github.io/quizmania-trivia-game.html)
- [CATEGORY ANIMAL](https://StudyQuests.github.io/category-animal.html)
- [FRAY FIGHT](https://StudyQuests.github.io/fray-fight.html)
- [WORD SEARCH UNIVERSE](https://QuizVerses.pages.dev/word-search-universe.html)
- [LOOP GHOST](https://QuizVerses.pages.dev/loop-ghost.html)
- [LOOP SURVIVORS ZOMBIE CITY](https://StudyQuests.github.io/loop-survivors-zombie-city.html)
- [ZOMBCOPTER](https://StudyQuests.github.io/zombcopter.html)
- [CATEGORY MATCH 3](https://QuizVerses.pages.dev/category-match-3.html)
- [MAHJONG CLASSIC WEBGL](https://QuizVerses.pages.dev/mahjong-classic-webgl.html)
- [FASHIONISTA CHRISTMAS EVE PARTY](https://QuizVerses.pages.dev/fashionista-christmas-eve-party.html)
- [ROAD CHASE SHOOTER REALISTIC GUNS](https://QuizVerses.pages.dev/road-chase-shooter-realistic-guns.html)
- [MISSION SANTA DELIVER THE GIFTS](https://StudyQuests.github.io/mission-santa-deliver-the-gifts.html)
- [LABUBU DOLL MUKBANG ASMR UNBLOCKED](https://QuizVerses.pages.dev/labubu-doll-mukbang-asmr-unblocked.html)
- [BFF LOVELY KAWAII OUTFITS](https://QuizVerses.pages.dev/bff-lovely-kawaii-outfits.html)
- [BRAINROT WORLD HOLEIO](https://StudyQuests.github.io/brainrot-world-holeio.html)
- [ASMR BEAUTY HOMELESS](https://StudyQuests.github.io/asmr-beauty-homeless.html)
- [CROWD BATTLE GUN RUSH](https://QuizVerses.pages.dev/crowd-battle-gun-rush.html)
- [OFFROAD ISLAND](https://StudyQuests.github.io/offroad-island.html)
- [HAPPY TOWN](https://StudyQuests.github.io/happy-town.html)
- [SPRUNKI MATCH](https://QuizVerses.pages.dev/sprunki-match.html)
- [HAZEL TANGLE ROPE 3D SORTING PUZZLE](https://StudyQuests.github.io/hazel-tangle-rope-3d-sorting-puzzle.html)
- [CARGO SKATES](https://StudyQuests.github.io/cargo-skates.html)
- [WOODOKU BLOCK PUZZLE](https://StudyQuests.github.io/woodoku-block-puzzle.html)
- [MEMEVOIO](https://StudyQuests.github.io/memevoio.html)
- [HAZEL TANGLE ROPE 3D SORTING PUZZLE](https://QuizVerses.pages.dev/hazel-tangle-rope-3d-sorting-puzzle.html)
- [CATEGORY COLLECT](https://quizverses-9d2f2.web.app/category-collect.html)
- [CATEGORY BASKETBALL 3](https://QuizVerses.github.io/category-basketball-3.html)
- [CATEGORY FASHION105](https://QuizVerses.github.io/category-fashion105.html)
- [SURVEV](https://quizverses-9d2f2.web.app/survev.html)
- [INDEX6](https://StudyQuests.github.io/index6.html)
- [FIRE AND WATER BIRDS](https://StudyQuests.github.io/fire-and-water-birds.html)
- [FRUITE SWIPE](https://quizverses-9d2f2.web.app/fruite-swipe.html)
- [CATEGORY IDLE448](https://QuizVerses.pages.dev/category-idle448.html)
