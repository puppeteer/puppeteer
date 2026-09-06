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
- [GEOMETRY VIBES 3D](https://studyquests.pages.dev/geometry-vibes-3d.html)
- [ZENITH RUSH](https://studyplayings.web.app/zenith-rush.html)
- [CATEGORY SNAKE40](https://studyquests.pages.dev/category-snake40.html)
- [NATURAL DISASTER SURVIVAL OBBY](https://thelearnquesters.pages.dev/natural-disaster-survival-obby.html)
- [TINY CARS](https://studyquests.pages.dev/tiny-cars.html)
- [SUDOKU BRAIN BLOCKS](https://quizverses.github.io/sudoku-brain-blocks.html)
- [ROYAL KITCHEN THE LOST KING](https://quizverses.github.io/royal-kitchen-the-lost-king.html)
- [MOON LEAGUE SPORTS SEASON](https://learnquester.github.io/moon-league-sports-season.html)
- [DUCKLINGS](https://quizverses.github.io/ducklings.html)
- [PUZZLE BLOCKS FILL IT COMPLETELY](https://studyplaying.github.io/puzzle-blocks-fill-it-completely.html)
- [LAST PLAY RAGDOLL SANDBOX KQB](https://studyplayings.web.app/last-play-ragdoll-sandbox-kqb.html)
- [TWO DOTS REMASTERED](https://studyquests.github.io/two-dots-remastered.html)
- [UNICORN FIND THE DIFFERENCES](https://quizverses.github.io/unicorn-find-the-differences.html)
- [KITTEN NEVER DIES](https://studyplayings.web.app/kitten-never-dies.html)
- [TWO BLOCKS](https://studyquesthub.web.app/two-blocks.html)
- [SUPER SOCCER NOGGINS](https://studyplaying.github.io/super-soccer-noggins.html)
- [HOLE EAT GROW ATTACK](https://studyplaying.github.io/hole-eat-grow-attack.html)
- [PACKING LINE](https://quizverses-9d2f2.web.app/packing-line.html)
- [TINY FIGHTER UNSTOPPABLE RUN](https://quizverses.github.io/tiny-fighter-unstoppable-run.html)
- [FLOWER FAIRY ADVENTURE STORY](https://studyplayings.pages.dev/flower-fairy-adventure-story.html)
- [BLOCK MANIA](https://studyquests.pages.dev/block-mania.html)
- [NO PAIN NO GAIN RAGDOLL SANDBOX](https://quizverses.pages.dev/no-pain-no-gain-ragdoll-sandbox.html)
- [ZOMBIE DRIVER](https://quizverses.github.io/zombie-driver.html)
- [ITALIAN BRAINROT FIND THE STARS](https://quizverses.github.io/italian-brainrot-find-the-stars.html)
- [MERGE FLOW](https://quizverses.github.io/merge-flow.html)
- [INDEX31](https://studyquests.github.io/index31.html)
- [KNIFE MASTER BALL RACING](https://quizverses.github.io/knife-master-ball-racing.html)
- [CATEGORY SHOOTER 2](https://studyquesthub.web.app/category-shooter-2.html)
- [KNEE CASE SIMULATOR](https://studyplayings.pages.dev/knee-case-simulator.html)
- [IMAGE CROSSWORD](https://studyquests.github.io/image-crossword.html)
- [GEOMETRY VERTICAL](https://studyquesthub.web.app/geometry-vertical.html)
- [CUTE CATS ADVENTURES](https://quizverses.github.io/cute-cats-adventures.html)
- [HOW TO DRESS YOUR DRAGON](https://quizverses.pages.dev/how-to-dress-your-dragon.html)
- [WALL HOP](https://studyquests.github.io/wall-hop.html)
- [IDLE MARKET TYCOON](https://studyplaying.github.io/idle-market-tycoon.html)
- [IDLE POP MERGE](https://quizverses.github.io/idle-pop-merge.html)
- [SPACE SURVIVOR](https://studyplaying.github.io/space-survivor.html)
- [SORT WATER NOW](https://studyplaying.github.io/sort-water-now.html)
- [ORDER OF OPERATION CHALLENGE](https://studyplayings.pages.dev/order-of-operation-challenge.html)
- [DUNGEON MASTER CULT CRAFT](https://quizverses.github.io/dungeon-master-cult-craft.html)
- [GT FORMULA CHAMPIONSHIP](https://studyplaying.github.io/gt-formula-championship.html)
- [MINI GRAND THEFT CITY](https://quizverses.github.io/mini-grand-theft-city.html)
- [2248 MUSICAL](https://quizverses.github.io/2248-musical.html)
- [FUN IQ PUZZLE](https://studyplayings.pages.dev/fun-iq-puzzle.html)
- [CATEGORY BIKE](https://quizverses.pages.dev/category-bike.html)
- [CATEGORY PARKOUR55](https://studyplayings.web.app/category-parkour55.html)
- [LODE RETRO ADVENTURE](https://quizverses.github.io/lode-retro-adventure.html)
- [CATEGORY CASUAL](https://studyquesthub.web.app/category-casual.html)
- [BARBEE SUMMER VACATION](https://studyquesthub.web.app/barbee-summer-vacation.html)
- [CATEGORY CAT55](https://studyquests.github.io/category-cat55.html)
- [ROCKET FEST](https://studyplaying.github.io/rocket-fest.html)
- [INDEX7](https://studyquests.github.io/index7.html)
- [LEGEND OF FIREBALL](https://quizverses.github.io/legend-of-fireball.html)
- [CATEGORY STRATEGY 2](https://studyplaying.github.io/category-strategy-2.html)
- [SCREW JAM FUN PUZZLE GAME](https://studyquests.pages.dev/screw-jam-fun-puzzle-game.html)
- [BARBEE SUMMER VACATION](https://studyplaying.github.io/barbee-summer-vacation.html)
- [BRIDGE FIGHT](https://studyquests.pages.dev/bridge-fight.html)
- [SNEAKER ART](https://studyquests.github.io/sneaker-art.html)
- [TANGLE MASTER 3D](https://studyplayings.web.app/tangle-master-3d.html)
- [CATEGORY ARENA255](https://studyquests.pages.dev/category-arena255.html)
- [MY DOGY VIRTUAL PET](https://studyplaying.github.io/my-dogy-virtual-pet.html)
- [INDEX14](https://quizverses.pages.dev/index14.html)
- [HEXANAUT IO](https://studyplayings.pages.dev/hexanaut-io.html)
- [SUDOKU MASTER](https://learnquester.github.io/sudoku-master.html)
- [MAD DASH](https://studyplayings.pages.dev/mad-dash.html)
- [CATEGORY POINT AND CLICK123](https://quizverses.pages.dev/category-point-and-click123.html)
- [STICK FIGHT THE CHAOS](https://studyquests.pages.dev/stick-fight-the-chaos.html)
- [CATEGORY MAHJONG](https://studyquesthub.web.app/category-mahjong.html)
- [CATERFALL 2048](https://studyquests.github.io/caterfall-2048.html)
- [IDLE LANDMARK BUILDER](https://studyplaying.github.io/idle-landmark-builder.html)
- [CAPYBARA COIN MASTER](https://quizverses-9d2f2.web.app/capybara-coin-master.html)
- [RAGDOLL BOB PUZZLE](https://studyplayings.pages.dev/ragdoll-bob-puzzle.html)
- [ZOMBIE ARENA 2 FURY ROAD](https://quizverses-9d2f2.web.app/zombie-arena-2-fury-road.html)
- [INDEX8](https://studyquests.github.io/index8.html)
- [MOJICON FRUIT CONNECT](https://studyplaying.github.io/mojicon-fruit-connect.html)
- [GETTING OVER IT](https://quizverses-9d2f2.web.app/getting-over-it.html)
- [HIGH HEELS 2](https://studyquesthub.web.app/high-heels-2.html)
- [STICKER JAM PEEL OFF MATCH](https://quizverses-9d2f2.web.app/sticker-jam-peel-off-match.html)
- [CATEGORY LOGIC538](https://studyplayings.web.app/category-logic538.html)
- [CATEGORY INCREMENTAL388](https://thelearnquester.web.app/category-incremental388.html)
- [CATEGORY CARDS](https://studyplayings.web.app/category-cards.html)
- [MATCH ARENA](https://quizverses.pages.dev/match-arena.html)
- [DRAW TO HOME 3D](https://quizverses-9d2f2.web.app/draw-to-home-3d.html)
- [PIZZA PUZZLE](https://studyplayings.pages.dev/pizza-puzzle.html)
- [INDEX21](https://thelearnquester.web.app/index21.html)
- [SUSHI PUZZLE](https://studyplaying.github.io/sushi-puzzle.html)
- [MOB RUSH](https://studyplaying.github.io/mob-rush.html)
- [BABY PIANO CHILDREN SONG](https://studyquesthub.web.app/baby-piano-children-song.html)
- [BLOCK PUZZLE SLIDE BLOCK JAM](https://quizverses-9d2f2.web.app/block-puzzle-slide-block-jam.html)
- [METAXIS](https://studyplayings.pages.dev/metaxis.html)
- [AVENGER GUARD](https://studyplaying.github.io/avenger-guard.html)
- [SAVE THE CATS BUBBLE SHOOTER](https://quizverses.github.io/save-the-cats-bubble-shooter.html)
- [VEX HYPER DASH](https://quizverses.github.io/vex-hyper-dash.html)
- [STREET TRAFFIC RACER](https://studyplayings.pages.dev/street-traffic-racer.html)
- [CARD MASTER](https://studyplayings.pages.dev/card-master.html)
- [CATEGORY MAGIC46](https://studyquesthub.web.app/category-magic46.html)
- [HAWAII MATCH 6](https://quizverses-9d2f2.web.app/hawaii-match-6.html)
- [CATEGORY PREMIUM PERKS71](https://studyquests.github.io/category-premium-perks71.html)
- [SISYPHUS SIMULATOR](https://learnquester.github.io/sisyphus-simulator.html)
- [TRIVIA NATION](https://studyplayings.web.app/trivia-nation.html)
- [MY TINY LAND](https://studyplaying.github.io/my-tiny-land.html)
- [GROW A GARDEN ONLINE OFFLINE](https://studyplaying.github.io/grow-a-garden-online-offline.html)
- [TSUNAMI BRAINROTS ONLINE](https://studyplaying.github.io/tsunami-brainrots-online.html)
- [REAL CAR PARKING AND STUNT](https://learnquester.github.io/real-car-parking-and-stunt.html)
- [CATEGORY COLLECT565](https://learnquester.github.io/category-collect565.html)
- [NINJA CROSSWORD CHALLENGE](https://studyplaying.github.io/ninja-crossword-challenge.html)
- [MR LONG HAND](https://quizverses-9d2f2.web.app/mr-long-hand.html)
- [DUET CATS HALLOWEEN CAT MUSIC](https://quizverses.github.io/duet-cats-halloween-cat-music.html)
- [MINIGIANTS IO](https://studyplaying.github.io/minigiants-io.html)
- [EXCAVATOR SIMULATOR 3D](https://learnquester.github.io/excavator-simulator-3d.html)
- [BLOXDHOP IO](https://studyplayings.web.app/bloxdhop-io.html)
- [BUBBLE SHOOTER NEON](https://studyquests.github.io/bubble-shooter-neon.html)
- [MINE SWEEPER](https://studyplayings.pages.dev/mine-sweeper.html)
- [SOLITAIRE DELUXE EDITION](https://quizverses.pages.dev/solitaire-deluxe-edition.html)
- [GOOD TO DRIVE](https://quizverses-9d2f2.web.app/good-to-drive.html)
- [PRACTICE ON ME](https://quizverses.github.io/practice-on-me.html)
- [CATEGORY PENALTY](https://studyplayings.web.app/category-penalty.html)
- [BATTLEDUDES IO](https://studyplayings.web.app/battledudes-io.html)
- [QUEEN OF MAHJONG](https://quizverses-9d2f2.web.app/queen-of-mahjong.html)
- [CATEGORY QUIZ](https://studyquests.github.io/category-quiz.html)
- [HAPPY FARM THE CROP](https://quizverses.github.io/happy-farm-the-crop.html)
- [3D ACRYLIC NAIL NAIL ART GAME](https://studyquesthub.web.app/3d-acrylic-nail-nail-art-game.html)
- [GEOMETRY DASH MAZE MAPS](https://studyplaying.github.io/geometry-dash-maze-maps.html)
- [CATEGORY STRATEGY](https://studyquests.github.io/category-strategy.html)
- [MAKE AMERICA GREAT AGAIN](https://quizverses.pages.dev/make-america-great-again.html)
- [CATEGORY BIKE 2](https://studyquesthub.web.app/category-bike-2.html)
- [ADDICTION MINI SOLITAIRE](https://studyplayings.pages.dev/addiction-mini-solitaire.html)
- [CATEGORY FREE FASHION GAMES](https://studyquesthub.web.app/category-free-fashion-games.html)
- [TINY FOOTBALL CUP 2026](https://studyquests.github.io/tiny-football-cup-2026.html)
- [MERGE THE COINS USSR](https://quizverses.pages.dev/merge-the-coins-ussr.html)
