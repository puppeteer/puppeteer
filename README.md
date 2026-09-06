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
- [DEAD BRAIN](https://iskillquest.pages.dev/dead-brain.html)
- [WATER SORT COLLECTIONS](https://studyquests.pages.dev/water-sort-collections.html)
- [QUIZ 10 SECONDS MATH](https://studyplayings.web.app/quiz-10-seconds-math.html)
- [IDLE FACTORY DOMINATION](https://studyplayings.web.app/idle-factory-domination.html)
- [CATEGORY BOARDGAMES](https://quizverses.pages.dev/category-boardgames.html)
- [ICOLORCOIN SORT PUZZLE](https://studyplaying.github.io/icolorcoin-sort-puzzle.html)
- [ZOMBIE SURVIVAL SHOOTER](https://learnquester.pages.dev/zombie-survival-shooter.html)
- [CATEGORY ADVENTURE 2](https://learnquesters.pages.dev/category-adventure-2.html)
- [SCRAP CAR MERGE](https://learnquester.pages.dev/scrap-car-merge.html)
- [TROLLEY FUN](https://quizverses.github.io/trolley-fun.html)
- [MICKEY RUN ADVENTURE GAME](https://studyplaying.github.io/mickey-run-adventure-game.html)
- [CATEGORY MERGE224](https://quizverses-9d2f2.web.app/category-merge224.html)
- [ARROW TAP PUZZLE](https://quizverses-9d2f2.web.app/arrow-tap-puzzle.html)
- [FRUIT GOALS MATCH](https://studyplaying.github.io/fruit-goals-match.html)
- [CATEGORY 1 PLAYER139](https://quizverses-9d2f2.web.app/category-1-player139.html)
- [OBBY GYM SIMULATOR ESCAPE](https://quizverses.pages.dev/obby-gym-simulator-escape.html)
- [SNOW RIDER 3D NOSTALGIA](https://studyplaying.github.io/snow-rider-3d-nostalgia.html)
- [ANGRY PLANTS FLOWER](https://studyplaying.github.io/angry-plants-flower.html)
- [CATEGORY CARE](https://thelearnquesters.pages.dev/category-care.html)
- [UNPUZZLE MASTER](https://quizverses.pages.dev/unpuzzle-master.html)
- [BOOM LAND LITE](https://quizverses.pages.dev/boom-land-lite.html)
- [GOD OF LIGHT](https://learnquester.pages.dev/god-of-light.html)
- [CATEGORY DRIFTING116](https://thelearnquesters.pages.dev/category-drifting116.html)
- [WORLD WAR BROTHERS WW2](https://studyplaying.github.io/world-war-brothers-ww2.html)
- [FRUIT MERGE JUICY DROP GAME](https://quizverses.github.io/fruit-merge-juicy-drop-game.html)
- [PICKLE BALL CLASH](https://quizverses-9d2f2.web.app/pickle-ball-clash.html)
- [ERASE THE EXTRA ELEMENT](https://studyplaying.github.io/erase-the-extra-element.html)
- [HYPER SURVIVE](https://quizverses.github.io/hyper-survive.html)
- [CATEGORY BUSINESS135](https://thelearnquesters.pages.dev/category-business135.html)
- [CATEGORY SHOOTER 3](https://studyplaying.github.io/category-shooter-3.html)
- [WOODY TAP BLOCK](https://quizverses.pages.dev/woody-tap-block.html)
- [LORENZO THE RUNNER](https://quizverses.pages.dev/lorenzo-the-runner.html)
- [CATEGORY WAR137](https://quizverses-9d2f2.web.app/category-war137.html)
- [CATEGORY UNBLOCK](https://learnquester.pages.dev/category-unblock.html)
- [RIOT VILLAGE](https://quizverses.github.io/riot-village.html)
- [CALL OF THE JUNGLE ANIMAL EVOLUTION](https://studyplaying.github.io/call-of-the-jungle-animal-evolution.html)
- [ALPHABET MERGE AND FIGHT](https://learnquesters.pages.dev/alphabet-merge-and-fight.html)
- [SEADRAGONS IO](https://studyplaying.github.io/seadragons-io.html)
- [CATEGORY MATCH 3117](https://quizverses-9d2f2.web.app/category-match-3117.html)
- [INDEX18](https://quizverses-9d2f2.web.app/index18.html)
- [CONTACT](https://studyquests.github.io/contact.html)
- [BULLET HEROES](https://studyplaying.github.io/bullet-heroes.html)
- [CATEGORY CONTROLLER](https://thelearnquesters.pages.dev/category-controller.html)
- [CATEGORY CASUAL 10](https://thelearnquesters.pages.dev/category-casual-10.html)
- [MASTER ADDICTION SOLITAIRE](https://learnquesters.pages.dev/master-addiction-solitaire.html)
- [DUCK LUCK](https://learnquesters.pages.dev/duck-luck.html)
- [INDEX21](https://quizverses-9d2f2.web.app/index21.html)
- [LEVEL EATEN](https://studyplaying.github.io/level-eaten.html)
- [MONONINJA](https://learnquester.pages.dev/mononinja.html)
- [CATEGORY MINIGAMES29](https://studyplaying.github.io/category-minigames29.html)
- [ICE CREAM ROLLER](https://learnquesters.pages.dev/ice-cream-roller.html)
- [CATEGORY CAR 2](https://studyplayings.pages.dev/category-car-2.html)
- [COLOR IT IN 3D](https://learnquester.pages.dev/color-it-in-3d.html)
- [CATEGORY FOOTBALL](https://thelearnquesters.pages.dev/category-football.html)
- [BRAIN PUZZLES QUESTS](https://quizverses.github.io/brain-puzzles-quests.html)
- [DRESS PRINCESS](https://quizverses.github.io/dress-princess.html)
- [BFFS K POP FANGIRLS](https://studyplaying.github.io/bffs-k-pop-fangirls.html)
- [INDEX5](https://studyplayings.pages.dev/index5.html)
- [MAGNET TRUCK](https://learnquesters.pages.dev/magnet-truck.html)
- [HUNGRY CORGI CUTE MUSIC GAME](https://quizverses.github.io/hungry-corgi-cute-music-game.html)
- [ELLIE AND BEN CHRISTMAS EVE](https://studyplayings.web.app/ellie-and-ben-christmas-eve.html)
- [POPCATS MERGE THE CATS](https://quizverses.github.io/popcats-merge-the-cats.html)
- [DRAW CLIMB RACE THE ULTIMATE HILL CLIMBING CHALLENGE](https://quizverses.github.io/draw-climb-race-the-ultimate-hill-climbing-challenge.html)
- [ICE CREAM INC](https://quizverses.github.io/ice-cream-inc.html)
- [THREAD MATCH 2](https://quizverses.github.io/thread-match-2.html)
- [STUNT MULTIPLAYER ARENA](https://learnquester.pages.dev/stunt-multiplayer-arena.html)
- [CATEGORY MAKEUP51](https://quizverses.pages.dev/category-makeup51.html)
- [KNEE CASE SIMULATOR](https://studyplaying.github.io/knee-case-simulator.html)
- [MOTO ATTACK BIKE RACING](https://learnquester.pages.dev/moto-attack-bike-racing.html)
- [DRAW TO KILL](https://quizverses-9d2f2.web.app/draw-to-kill.html)
- [SHINY JEWELS](https://learnquesters.pages.dev/shiny-jewels.html)
- [CATEGORY BRAIN260](https://quizverses-9d2f2.web.app/category-brain260.html)
- [BANG BANG MAHJONG](https://quizverses.github.io/bang-bang-mahjong.html)
- [CATEGORY FPS GAMES](https://thelearnquesters.pages.dev/category-fps-games.html)
- [CATEGORY ARENA254](https://quizverses-9d2f2.web.app/category-arena254.html)
- [SPACE SURVIVAL RAINBOW FRIENDS MONSTER](https://learnquester.pages.dev/space-survival-rainbow-friends-monster.html)
- [GUMMY MERGE](https://quizverses.github.io/gummy-merge.html)
- [DRIVE AHEAD SPORTS](https://studyplaying.github.io/drive-ahead-sports.html)
- [CATEGORY CASUAL](https://quizverses-9d2f2.web.app/category-casual.html)
- [FRUIT CANDY MERGE](https://learnquester.pages.dev/fruit-candy-merge.html)
- [STEAL BRAINROT ORIGINAL 3D](https://studyplaying.github.io/steal-brainrot-original-3d.html)
- [CATEGORY INCREMENTAL388](https://learnquester.github.io/category-incremental388.html)
- [CAPYBARA BLOCK BLAST](https://studyplaying.github.io/capybara-block-blast.html)
- [IDLE FACTORY EMPIRE](https://quizverses-9d2f2.web.app/idle-factory-empire.html)
- [JUMPERS QUEST](https://learnquester.pages.dev/jumpers-quest.html)
- [STICK HERO BATTLE](https://learnquester.pages.dev/stick-hero-battle.html)
- [VIBE COLOURING](https://studyplaying.github.io/vibe-colouring.html)
- [RED STICKMAN VS MONSTER SCHOOL](https://studyplaying.github.io/red-stickman-vs-monster-school.html)
- [PING PONG BATTLE TABLE TENNIS](https://quizverses.pages.dev/ping-pong-battle-table-tennis.html)
- [STICKMAN RAGDOLL PLAYGROUND](https://quizverses-9d2f2.web.app/stickman-ragdoll-playground.html)
- [SISYPHUS SIMULATOR](https://studyplayings.pages.dev/sisyphus-simulator.html)
- [CATEGORY UNBLOCKED](https://quizverses-9d2f2.web.app/category-unblocked.html)
- [DUCKLINGS](https://quizverses.github.io/ducklings.html)
- [ZOMBIE HIGHWAY RAMPAGE](https://quizverses.pages.dev/zombie-highway-rampage.html)
- [HAPPY FARM THE CROP](https://quizverses.github.io/happy-farm-the-crop.html)
- [ITALIAN BRAINROT CLICKER](https://studyquesthub.web.app/italian-brainrot-clicker.html)
- [WAR LANDS](https://learnquester.pages.dev/war-lands.html)
- [STICKMAN ROGUE ONLINE](https://studyplaying.github.io/stickman-rogue-online.html)
- [MERGEDUELIO](https://quizverses.pages.dev/mergeduelio.html)
- [INTERSTELLAR](https://studyquests.github.io/interstellar.html)
- [SCREWDOM 3D](https://studyquests.github.io/screwdom-3d.html)
- [SWIPETOWN](https://studyquesthub.web.app/swipetown.html)
- [CATEGORY DRESS UP](https://studyquests.pages.dev/category-dress-up.html)
- [ONE LINE DRAWING](https://quizverses-9d2f2.web.app/one-line-drawing.html)
- [BUBBLE AROUND](https://quizverses-9d2f2.web.app/bubble-around.html)
- [KITTY SQUAD WINTER DRESS UP](https://learnquester.pages.dev/kitty-squad-winter-dress-up.html)
- [FARM MERGE HARVEST](https://learnquester.pages.dev/farm-merge-harvest.html)
- [SLINGSHOT FORTRESS](https://studyquests.github.io/slingshot-fortress.html)
- [DRAWER SORT](https://studyquesthub.web.app/drawer-sort.html)
- [CATEGORY CARDS](https://quizverses-9d2f2.web.app/category-cards.html)
- [DRIVER MASTER SIMULATOR](https://quizverses.pages.dev/driver-master-simulator.html)
- [BOO TIFUL PRINCESS MATCH](https://learnquesters.pages.dev/boo-tiful-princess-match.html)
- [SIBERIAN ASSAULT](https://studyplayings.web.app/siberian-assault.html)
- [HERO FIGHT CLASH](https://studyplaying.github.io/hero-fight-clash.html)
- [SKY MAZE CHALLENGE](https://studyquesthub.web.app/sky-maze-challenge.html)
- [SWEET AND FRUITY MAKEUP](https://quizverses-9d2f2.web.app/sweet-and-fruity-makeup.html)
- [COLLECT EM ALL](https://quizverses-9d2f2.web.app/collect-em-all.html)
- [MAHJONG CUTE TILES](https://learnquester.pages.dev/mahjong-cute-tiles.html)
- [PIXEL PATH](https://studyquests.github.io/pixel-path.html)
- [CHRISTMAS SORTING](https://studyplaying.github.io/christmas-sorting.html)
- [CATEGORY BATTLE ROYALE25](https://quizverses-9d2f2.web.app/category-battle-royale25.html)
- [CATEGORY 2D1 060](https://studyplayings.pages.dev/category-2d1-060.html)
- [BATTLEDUDES IO](https://studyplayings.web.app/battledudes-io.html)
- [CELEBRITIES GET READY FOR CHRISTMAS](https://studyplaying.github.io/celebrities-get-ready-for-christmas.html)
- [ZOMBIE SPACE EPISODE II](https://learnquester.pages.dev/zombie-space-episode-ii.html)
- [CATEGORY LIGHTSPEED FILTER](https://studyplaying.github.io/category-lightspeed-filter.html)
- [STELLAR STYLE SPECTACLE FASHION](https://quizverses.pages.dev/stellar-style-spectacle-fashion.html)
- [PEG SOLITAIRE](https://learnquester.pages.dev/peg-solitaire.html)
- [CATEGORY MAKEUP](https://learnquesters.pages.dev/category-makeup.html)
- [MAD TRUCK](https://learnquesters.pages.dev/mad-truck.html)
