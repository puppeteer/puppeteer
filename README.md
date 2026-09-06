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
- [IDLE DICE 3D INCREMENTAL GAME](https://quizverses.github.io/idle-dice-3d-incremental-game.html)
- [TILES MATCHING](https://learnquesters.pages.dev/tiles-matching.html)
- [CATEGORY DRESS UP](https://studyplaying.github.io/category-dress-up.html)
- [MERGE MUSCLE](https://studyquests.github.io/merge-muscle.html)
- [MERGE DROP](https://studyplayings.web.app/merge-drop.html)
- [PARKING FURY 3D BEACH CITY 2](https://quizverses.github.io/parking-fury-3d-beach-city-2.html)
- [CATEGORY EDUCATIONAL](https://learnquester.github.io/category-educational.html)
- [FUNNY BALLS 2048](https://studyplayings.web.app/funny-balls-2048.html)
- [CATEGORY SOLITAIRE](https://quizverses.github.io/category-solitaire.html)
- [MANYUNYA SAVING THE PRINCESS](https://quizverses.github.io/manyunya-saving-the-princess.html)
- [FINGER HEART MONSTER REFILL](https://quizverses.github.io/finger-heart-monster-refill.html)
- [CRAZY PLANE LANDING](https://learnquester.github.io/crazy-plane-landing.html)
- [CATEGORY POOL](https://thelearnquester.web.app/category-pool.html)
- [CATEGORY SNAKE](https://studyplaying.github.io/category-snake.html)
- [MERGE GALAXY](https://studyquests.pages.dev/merge-galaxy.html)
- [HIDE ME](https://studyplayings.web.app/hide-me.html)
- [CATEGORY MOUSE1 697](https://studyplayings.web.app/category-mouse1-697.html)
- [TANK ATTACK 5](https://quizverses.github.io/tank-attack-5.html)
- [BLOCK ESCAPE](https://quizverses.github.io/block-escape.html)
- [BRAIN FIND CAN YOU FIND IT](https://quizverses.github.io/brain-find-can-you-find-it.html)
- [CATEGORY BASKETBALL](https://studyplayings.pages.dev/category-basketball.html)
- [AIR BLOCK](https://studyquesthub.web.app/air-block.html)
- [INDEX6](https://studyquests.pages.dev/index6.html)
- [CATEGORY PUZZLE 11](https://quizverses.github.io/category-puzzle-11.html)
- [PET SIMULATOR](https://studyplayings.web.app/pet-simulator.html)
- [METAL BAY TOP BLADE POWER](https://quizverses.github.io/metal-bay-top-blade-power.html)
- [CATEGORY MINECRAFT](https://studyplaying.github.io/category-minecraft.html)
- [IDLE PINBALL MERGE CLICKER](https://quizverses.github.io/idle-pinball-merge-clicker.html)
- [CATEGORY CONTROLLER 2](https://studyplayings.pages.dev/category-controller-2.html)
- [WORDLING DAILY WORD CHALLENGE](https://quizverses.github.io/wordling-daily-word-challenge.html)
- [CATEGORY BASKETBALL](https://learnquester.github.io/category-basketball.html)
- [CATEGORY MAHJONG](https://studyplaying.github.io/category-mahjong.html)
- [CATEGORY DEEP IMMERSIVE24](https://quizverses.github.io/category-deep-immersive24.html)
- [RESTAURANT SIMULATOR BURGERS PIZZA](https://quizverses.github.io/restaurant-simulator-burgers-pizza.html)
- [ANIME DRESS UP DOLL DRESS UP](https://quizverses.github.io/anime-dress-up-doll-dress-up.html)
- [BRAIN PUZZLE TRICKY CHOICES](https://learnquester.github.io/brain-puzzle-tricky-choices.html)
- [NIGHT CLUB SECURITY](https://quizverses.github.io/night-club-security.html)
- [COSMO VOID](https://quizverses.github.io/cosmo-void.html)
- [CATEGORY BUBBLE SHOOTER](https://studyplayings.pages.dev/category-bubble-shooter.html)
- [COLOR IT IN 3D](https://quizverses.github.io/color-it-in-3d.html)
- [REFLECT BEAM LASER LOGIC](https://quizverses.github.io/reflect-beam-laser-logic.html)
- [PING PONG AIR](https://quizverses.github.io/ping-pong-air.html)
- [CATEGORY HAPARA](https://studyplaying.github.io/category-hapara.html)
- [FOOD CARD SORT](https://studyquesthub.web.app/food-card-sort.html)
- [MARBLE PUZZLE QUEST](https://learnquester.github.io/marble-puzzle-quest.html)
- [MAX CRUSHER CRAZY DESTRUCTION AND CAR CRASHES](https://studyquests.pages.dev/max-crusher-crazy-destruction-and-car-crashes.html)
- [SINGLE STROKE ENERGY LINE PUZZLE](https://quizverses.github.io/single-stroke-energy-line-puzzle.html)
- [TILE FARM STORY MATCHING GAME](https://quizverses.github.io/tile-farm-story-matching-game.html)
- [WHATS IN MY BAG](https://quizverses.github.io/whats-in-my-bag.html)
- [BLUE HEDGEHOG HILL DASH RIDE](https://quizverses.github.io/blue-hedgehog-hill-dash-ride.html)
- [PET SALON](https://quizverses.github.io/pet-salon.html)
- [UNSCREW THEM ALL](https://quizverses.github.io/unscrew-them-all.html)
- [VAULT BREAKER](https://learnquester.github.io/vault-breaker.html)
- [BACKGAMMON DUEL](https://quizverses.github.io/backgammon-duel.html)
- [2048 CUBE MERGE](https://quizverses.github.io/2048-cube-merge.html)
- [ROYAL JEWELS MATCH](https://quizverses.github.io/royal-jewels-match.html)
- [ASMR BEAUTY JAPANESE SPA](https://studyquests.pages.dev/asmr-beauty-japanese-spa.html)
- [MEGA SHARK](https://quizverses.github.io/mega-shark.html)
- [DOT BY DOT](https://studyplayings.pages.dev/dot-by-dot.html)
- [CATEGORY MOUSE1 697](https://studyquests.pages.dev/category-mouse1-697.html)
- [MATH QUEST](https://quizverses.github.io/math-quest.html)
- [BUNNIES SORT](https://learnquester.github.io/bunnies-sort.html)
- [BLACK PINK HALLOWEEN CONCERT](https://studyplayings.pages.dev/black-pink-halloween-concert.html)
- [TOCA TEENS FLOATING BEACH PARTY](https://studyquesthub.web.app/toca-teens-floating-beach-party.html)
- [COUNT AND BOUNCE](https://learnquester.github.io/count-and-bounce.html)
- [BALL TOWER OF HELL](https://quizverses.github.io/ball-tower-of-hell.html)
- [WIRE CONNECT](https://quizverses.github.io/wire-connect.html)
- [ELEVATOR FIGHT](https://quizverses.github.io/elevator-fight.html)
- [BALLOON POP FRENZY](https://studyplayings.pages.dev/balloon-pop-frenzy.html)
- [ONLINE PORTAL](https://cryptotify.vercel.app/)
- [MONONINJA](https://quizverses.github.io/mononinja.html)
- [THREAD MATCH 2](https://quizverses.github.io/thread-match-2.html)
- [CLEAN HOUSE CLEARING TRASH AND DIRT](https://quizverses.github.io/clean-house-clearing-trash-and-dirt.html)
- [67 CLICKER](https://quizverses.github.io/67-clicker.html)
- [CATEGORY RPG80](https://studyquests.pages.dev/category-rpg80.html)
- [CATEGORY CLASSIC98](https://studyplaying.github.io/category-classic98.html)
- [PRACTICE ON ME](https://quizverses.github.io/practice-on-me.html)
- [MAGIC BUBBLES](https://studyquests.pages.dev/magic-bubbles.html)
- [TINY FOOTBALL CUP 2026](https://learnquester.github.io/tiny-football-cup-2026.html)
- [GOLF MINI](https://quizverses.github.io/golf-mini.html)
- [CATEGORY TOP DOWN251](https://quizverses.pages.dev/category-top-down251.html)
- [ITALIAN BRAINROT PUZZLE](https://studyquesthub.web.app/italian-brainrot-puzzle.html)
- [CAR SERVICE TYCOON](https://studyplayings.pages.dev/car-service-tycoon.html)
- [ULTIMATE ROBO DUEL 3D](https://quizverses.github.io/ultimate-robo-duel-3d.html)
- [CATEGORY FOOTBALL](https://studyplayings.pages.dev/category-football.html)
- [CATEGORY WEB PROXY](https://quizverses-9d2f2.web.app/category-web-proxy.html)
- [SPACEIO](https://quizverses.github.io/spaceio.html)
- [BALL SORT COLOR PUZZLE](https://studyplayings.web.app/ball-sort-color-puzzle.html)
- [INDEX2](https://quizverses-9d2f2.web.app/index2.html)
- [SPRUNKI BEATS](https://studyquests.pages.dev/sprunki-beats.html)
- [CRAFT DRILL](https://studyquesthub.web.app/craft-drill.html)
- [SURVIVAL IN AREA 51](https://studyquests.pages.dev/survival-in-area-51.html)
- [CATEGORY MAKEUP51](https://studyplaying.github.io/category-makeup51.html)
- [BRIDGE FIGHT](https://studyquests.pages.dev/bridge-fight.html)
- [CATEGORY MAGIC46](https://studyquests.pages.dev/category-magic46.html)
- [GUMMY MERGE](https://studyquests.pages.dev/gummy-merge.html)
- [CATEGORY CAN T STOP PLAYING212](https://studyplayings.pages.dev/category-can-t-stop-playing212.html)
- [CATEGORY SNAKE40](https://quizverses.pages.dev/category-snake40.html)
- [CATEGORY MINIGAMES29](https://quizverses.pages.dev/category-minigames29.html)
- [KING KONG CHAOS](https://quizverses.github.io/king-kong-chaos.html)
- [CATEGORY DRESS UP](https://studyquests.pages.dev/category-dress-up.html)
- [GO TO ZERO](https://studyplayings.web.app/go-to-zero.html)
- [CATEGORY SECURLY](https://quizverses.pages.dev/category-securly.html)
- [SOCCER SNAKES](https://quizverses.github.io/soccer-snakes.html)
- [NUMBER BUBBLE SHOOTER](https://quizverses.github.io/number-bubble-shooter.html)
- [CATEGORY ADVENTURE](https://quizverses.github.io/category-adventure.html)
- [BALLS VS LASERS](https://quizverses.github.io/balls-vs-lasers.html)
- [CATEGORY PUZZLE 2](https://quizverses.github.io/category-puzzle-2.html)
- [CATEGORY BRAIN260](https://quizverses.github.io/category-brain260.html)
- [DESTRUCTION SIMULATOR](https://studyplayings.pages.dev/destruction-simulator.html)
- [CHARGER CITY DRIVER](https://quizverses.github.io/charger-city-driver.html)
- [CONTACT](https://studyplaying.github.io/contact.html)
- [TOW N GO](https://quizverses-9d2f2.web.app/tow-n-go.html)
- [CATEGORY UNBLOCKEDGAMES](https://quizverses-9d2f2.web.app/category-unblockedgames.html)
- [CATEGORY RACING DRIVING 2](https://studyplaying.github.io/category-racing-driving-2.html)
- [SITEMAP](https://quizverses-9d2f2.web.app/sitemap.html)
- [INDEX20](https://studyplaying.github.io/index20.html)
- [CATEGORY PARKOUR55](https://studyquests.pages.dev/category-parkour55.html)
- [FIND THE GHOST CAT](https://quizverses.github.io/find-the-ghost-cat.html)
- [AUTHENTIC FOOTBALL](https://quizverses-9d2f2.web.app/authentic-football.html)
- [CATEGORY RUNNING107](https://quizverses.github.io/category-running107.html)
- [CATEGORY COLOR](https://studyplaying.github.io/category-color.html)
- [SORT WORKS NUTS ORDER](https://studyplayings.web.app/sort-works-nuts-order.html)
- [MAKEUP STACK](https://quizverses-9d2f2.web.app/makeup-stack.html)
- [MISSILE LAUNCH MASTER](https://studyquests.pages.dev/missile-launch-master.html)
- [ROBOCARPOLI](https://studyplayings.pages.dev/robocarpoli.html)
- [MR CAPPUCCINO ASSASSINO](https://studyquesthub.web.app/mr-cappuccino-assassino.html)
- [CATEGORY JIGSAW](https://quizverses.pages.dev/category-jigsaw.html)
- [VOLLEY BEANS VOLLEYBALL GAME](https://learnquester.github.io/volley-beans-volleyball-game.html)
- [PARKING FURY 3D BEACH CITY 2](https://studyquests.pages.dev/parking-fury-3d-beach-city-2.html)
