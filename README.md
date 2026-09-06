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
- [CATEGORY CASUAL 7](https://themindplays.pages.dev/category-casual-7.html)
- [STREET TRAFFIC RACER](https://themindplay.pages.dev/street-traffic-racer.html)
- [SHAPE TRANSFORMING SHIFTING RUN](https://themindplay.pages.dev/shape-transforming-shifting-run.html)
- [VIKINGS AN ARCHERS JOURNEY](https://themindplay.pages.dev/vikings-an-archers-journey.html)
- [RUSSIAN TREASURE HUNTER](https://themindplay.pages.dev/russian-treasure-hunter.html)
- [ARCHERY MASTER BOW AND ARROW](https://themindplay.pages.dev/archery-master-bow-and-arrow.html)
- [CATEGORY MOUSE1 697](https://studyquests.pages.dev/category-mouse1-697.html)
- [SHOTTING BALLS](https://themindplay.pages.dev/shotting-balls.html)
- [CATEGORY EDUCATIONAL25](https://thelearnquesters.pages.dev/category-educational25.html)
- [CUTE ANIMAL WORLD](https://themindplaying.web.app/cute-animal-world.html)
- [PUZZLE WOOD BLOCK](https://learnquesters.pages.dev/puzzle-wood-block.html)
- [HIDE AND LUIG](https://themindplaying.web.app/hide-and-luig.html)
- [BLANKETS](https://themindplay.pages.dev/blankets.html)
- [HIPPO SUPERMARKET](https://learnquester.pages.dev/hippo-supermarket.html)
- [SUPER STOCK STACK](https://thequizzone.pages.dev/super-stock-stack.html)
- [CATEGORY PUZZLE 6](https://learnquesters.pages.dev/category-puzzle-6.html)
- [CATEGORY POOL17](https://iskillplay.web.app/category-pool17.html)
- [ROYAL FAMILY TREE](https://thelearnquester.web.app/royal-family-tree.html)
- [CUBE KING](https://skillplay.github.io/cube-king.html)
- [MOJICON SPRING CONNECT](https://thelearnquesters.pages.dev/mojicon-spring-connect.html)
- [CATEGORY STRATEGY](https://studyplayings.web.app/category-strategy.html)
- [NUTS BOLTS PUZZLE](https://themindplaying.web.app/nuts-bolts-puzzle.html)
- [CATEGORY AGILITY 3](https://themindskillplayplay.pages.dev/category-agility-3.html)
- [HOTGEAR](https://studyplaying.github.io/hotgear.html)
- [SLIDE RABBIT](https://studyplayings.pages.dev/slide-rabbit.html)
- [MEGA RAMP CAR STUNTS](https://learnquester.pages.dev/mega-ramp-car-stunts.html)
- [CATEGORY UNBLOCKED WEBSITES](https://learnquester.pages.dev/category-unblocked-websites.html)
- [JIGSOLITAIRE](https://themindskillplayplay.pages.dev/jigsolitaire.html)
- [BILLIARDS 3D RUSSIAN PYRAMID](https://themindplaying.web.app/billiards-3d-russian-pyramid.html)
- [HILL CLIMB TRUCK TRANSFORM ADVENTURE](https://learnquester.pages.dev/hill-climb-truck-transform-adventure.html)
- [BUBBLE SHOOTER FREE 3](https://thelearnquesters.pages.dev/bubble-shooter-free-3.html)
- [SLENDER BOY ESCAPE ROBBIE](https://themindskillplayplay.pages.dev/slender-boy-escape-robbie.html)
- [MUSIC CAT PIANO TILES GAME 3D](https://studyplaying.github.io/music-cat-piano-tiles-game-3d.html)
- [CATEGORY MMO25](https://learnquester.github.io/category-mmo25.html)
- [BOLTS AND NUTS PUZZLE](https://themindplaying.web.app/bolts-and-nuts-puzzle.html)
- [BRAIN TEST IQ CHALLENGE 2](https://studyplaying.github.io/brain-test-iq-challenge-2.html)
- [PRACTICE ON ME](https://themindplay.pages.dev/practice-on-me.html)
- [WARFRONT](https://studyplaying.github.io/warfront.html)
- [SNOWFLIGHT](https://studyplayings.web.app/snowflight.html)
- [INDEX18](https://learnquesters.pages.dev/index18.html)
- [INDEX3](https://learnquester.pages.dev/index3.html)
- [TRI PEAKS EMERLAND SOLITAIRE](https://themindplay.pages.dev/tri-peaks-emerland-solitaire.html)
- [STICKMAN HALLOWEEN SURVIVE](https://studyplayings.web.app/stickman-halloween-survive.html)
- [AVATAR MASTER FIX UP FACE](https://learnquester.github.io/avatar-master-fix-up-face.html)
- [REALDRIVE FEEL THE REAL DRIVE](https://themindskillplayplay.pages.dev/realdrive-feel-the-real-drive.html)
- [BOW AND ARROW](https://learnquester.github.io/bow-and-arrow.html)
- [ZOMBIE SIEGEIO](https://themindplaying.web.app/zombie-siegeio.html)
- [SAVE THE CROP](https://thelearnquesters.pages.dev/save-the-crop.html)
- [ARCHERY RAGDOLL](https://learnquester.github.io/archery-ragdoll.html)
- [RUN FROM BABA YAGA](https://learnquester.github.io/run-from-baba-yaga.html)
- [ANIMALON EPIC MONSTERS BATTLE](https://themindplaying.web.app/animalon-epic-monsters-battle.html)
- [MY KITTIES CATWORLD](https://themindplaying.web.app/my-kitties-catworld.html)
- [BALL JUMP SWITCH THE COLORS](https://learnquester.github.io/ball-jump-switch-the-colors.html)
- [CATEGORY COOKING](https://thequizzone.pages.dev/category-cooking.html)
- [PET SALON 2](https://studyplaying.github.io/pet-salon-2.html)
- [DOP DRAW ONE PART](https://themindskillplayplay.pages.dev/dop-draw-one-part.html)
- [CATEGORY RACING DRIVING 2](https://studyplayings.web.app/category-racing-driving-2.html)
- [PUZZLE BLOCKS FILL IT COMPLETELY](https://themindplaying.web.app/puzzle-blocks-fill-it-completely.html)
- [COLOR SORT PUZZLE](https://themindplay.pages.dev/color-sort-puzzle.html)
- [CATEGORY SIDE SCROLLING184](https://studyplayings.web.app/category-side-scrolling184.html)
- [GOTHIC KNIFE](https://studyplaying.github.io/gothic-knife.html)
- [WORDMEISTER HD](https://learnquester.github.io/wordmeister-hd.html)
- [COSMIC AVIATOR](https://themindplaying.web.app/cosmic-aviator.html)
- [CATEGORY FASHION105](https://studyplayings.pages.dev/category-fashion105.html)
- [DART HERO](https://themindplaying.web.app/dart-hero.html)
- [PRINCESS RUN 3D](https://studyplayings.pages.dev/princess-run-3d.html)
- [INDEX19](https://learnquester.github.io/index19.html)
- [SPRUNKI MONSTER MUSIC BEATS](https://themindskillplayplay.pages.dev/sprunki-monster-music-beats.html)
- [STICKMAN BATTLE 1 4 PLAYERS](https://themindplaying.web.app/stickman-battle-1-4-players.html)
- [INDEX19](https://themindskillplayplay.pages.dev/index19.html)
- [BULLET SUPERHERO](https://thelearnquesters.pages.dev/bullet-superhero.html)
- [CATEGORY BRAIN261](https://learnquesters.pages.dev/category-brain261.html)
- [SMALL WARDROBE](https://themindskillplayplay.pages.dev/small-wardrobe.html)
- [CATEGORY RPG](https://themindskillplayplay.pages.dev/category-rpg.html)
- [CATEGORY SHOP49](https://studyplayings.web.app/category-shop49.html)
- [MINE SWEEPER](https://studyplayings.pages.dev/mine-sweeper.html)
- [DRIVE TO SURVIVE](https://studyplayings.pages.dev/drive-to-survive.html)
- [GREEDY SNAKE BRAIN HOLE EXPLOSION](https://themindskillplayplay.pages.dev/greedy-snake-brain-hole-explosion.html)
- [CATEGORY POOL](https://learnquester.github.io/category-pool.html)
- [CATEGORY FLASH](https://learnquester.github.io/category-flash.html)
- [ROBLOX CRAFT RUN](https://themindplay.pages.dev/roblox-craft-run.html)
- [DRAW BRIDGE BRAIN GAME](https://studyplayings.pages.dev/draw-bridge-brain-game.html)
- [DOWNTOWN PARKOUR DRIVE](https://themindplay.pages.dev/downtown-parkour-drive.html)
- [BREAK THE BLOCK THERE BRAINROT](https://themindplaying.web.app/break-the-block-there-brainrot.html)
- [CATEGORY FPS](https://themindskillplayplay.pages.dev/category-fps.html)
- [MAGICAL DIARY PAPER DRESS UP](https://themindplaying.web.app/magical-diary-paper-dress-up.html)
- [HEROIC KNIGHT](https://themindplaying.web.app/heroic-knight.html)
- [LIPSTICK COLLECTOR RUN](https://learnquester.github.io/lipstick-collector-run.html)
- [MUSIC RUSH](https://themindskillplayplay.pages.dev/music-rush.html)
- [BUBBLE SHOOTER WILD WEST](https://themindplaying.web.app/bubble-shooter-wild-west.html)
- [CATEGORY BOARDGAMES](https://learnquesters.pages.dev/category-boardgames.html)
- [CATEGORY SHOOTER](https://studyplayings.web.app/category-shooter.html)
- [FIND OBJECTS HIDDEN ITEM](https://themindplay.pages.dev/find-objects-hidden-item.html)
- [MAZE CRAZE](https://studyplayings.pages.dev/maze-craze.html)
- [ECHOLOCATION SHOOTER](https://studyplayings.pages.dev/echolocation-shooter.html)
- [METAXIS](https://themindplaying.web.app/metaxis.html)
- [THE SUPERHERO LEAGUE](https://learnquester.github.io/the-superhero-league.html)
- [BUBBLE POP LEGEND](https://themindplaying.web.app/bubble-pop-legend.html)
- [SOLITAIRE EMPEROR SECRETS OF FATE](https://themindskillplayplay.pages.dev/solitaire-emperor-secrets-of-fate.html)
- [CATEGORY RACING DRIVING 2](https://learnquesters.pages.dev/category-racing-driving-2.html)
- [CATEGORY INTERSTELLARUNBLOCKER](https://learnquester.github.io/category-interstellarunblocker.html)
- [CATEGORY PUZZLE 9](https://themindskillplayplay.pages.dev/category-puzzle-9.html)
- [DRAW AND ESCAPE](https://themindskillplayplay.pages.dev/draw-and-escape.html)
- [CATEGORY SIMULATION](https://themindskillplayplay.pages.dev/category-simulation.html)
- [HERO FIGHT CLASH](https://themindplaying.web.app/hero-fight-clash.html)
- [GREEK TOWER STACKER](https://themindskillplayplay.pages.dev/greek-tower-stacker.html)
- [LOGIC BLAST EXPLORER](https://thelearnquesters.pages.dev/logic-blast-explorer.html)
- [VEX TRY TO FLY](https://themindskillplayplay.pages.dev/vex-try-to-fly.html)
- [SOLITAIRES CRIME STORIES](https://themindplaying.web.app/solitaires-crime-stories.html)
- [BUBBLE RUSH](https://themindplaying.web.app/bubble-rush.html)
- [TINY CARS](https://themindplay.pages.dev/tiny-cars.html)
- [CATEGORY POOL17](https://thequizzone.pages.dev/category-pool17.html)
- [JELLY TOWER CRUSH](https://learnquester.pages.dev/jelly-tower-crush.html)
- [DREAM MANIA HAPPY MATCH](https://themindplay.pages.dev/dream-mania-happy-match.html)
- [TAP 3D BLOCKS](https://learnquester.pages.dev/tap-3d-blocks.html)
- [HIDDEN OBJECTS LOST ISLAND 2](https://studyplayings.pages.dev/hidden-objects-lost-island-2.html)
- [TARCAT](https://themindplaying.web.app/tarcat.html)
- [RICH CHOICE RUN](https://themindplaying.web.app/rich-choice-run.html)
- [MUTANT ASSASSIN 3D](https://thelearnquesters.pages.dev/mutant-assassin-3d.html)
- [CATEGORY SHOOTER 3](https://thequizzone.pages.dev/category-shooter-3.html)
- [PRINCESSES OF QUADROBICS](https://themindplaying.web.app/princesses-of-quadrobics.html)
- [PIRATE ISLAND](https://learnquester.pages.dev/pirate-island.html)
- [CATEGORY PENALTY16](https://studyplayings.web.app/category-penalty16.html)
- [BALL PAINT 3D](https://themindplaying.web.app/ball-paint-3d.html)
- [CATEGORY EDUCATIONAL](https://thequizzone.pages.dev/category-educational.html)
- [SORT PARKING](https://themindplaying.web.app/sort-parking.html)
- [JELLY MATH 3D](https://learnquesters.pages.dev/jelly-math-3d.html)
- [ULTIMATE TOWER DEFENSE](https://themindplaying.web.app/ultimate-tower-defense.html)
- [4 COLORS CARD MANIA](https://thelearnquesters.pages.dev/4-colors-card-mania.html)
- [ULTIMATE YATZY](https://themindplaying.web.app/ultimate-yatzy.html)
