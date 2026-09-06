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
- [ITALIAN BRAINROT JIGSAW](https://themindzone.pages.dev/italian-brainrot-jigsaw.html)
- [ESCAPE ROOM MYSTERY KEY](https://studyquesthub.web.app/escape-room-mystery-key.html)
- [GIRLFRIEND FROM HELL](https://quizverses-9d2f2.web.app/girlfriend-from-hell.html)
- [BUSY BEE HIVE](https://quizverses.github.io/busy-bee-hive.html)
- [NUTS BOLTS WOOD PUZZLE GAME](https://studyquests.github.io/nuts-bolts-wood-puzzle-game.html)
- [HERO STORY MONSTERS CROSSING](https://studyplayings.web.app/hero-story-monsters-crossing.html)
- [AVATAR MASTER FIX UP FACE](https://studyplaying.github.io/avatar-master-fix-up-face.html)
- [PIXEL DESTROYER](https://studyquests.github.io/pixel-destroyer.html)
- [MATH STARS](https://quizverses.pages.dev/math-stars.html)
- [CATEGORY MAKEUP CATEGORY](https://studyplaying.github.io/category-makeup-category.html)
- [LOL FUNNY DANCE](https://learnquester.github.io/lol-funny-dance.html)
- [PEOPLE PLAYGROUND RAGDOLL ARENA](https://studyplaying.github.io/people-playground-ragdoll-arena.html)
- [FUSION 2048](https://studyquests.github.io/fusion-2048.html)
- [ROBBIE STAND ON THE RIGHT COLOR](https://quizverses.pages.dev/robbie-stand-on-the-right-color.html)
- [TRACESOCCER UBC](https://studyquesthub.web.app/tracesoccer-ubc.html)
- [PONGOAL](https://quizverses.pages.dev/pongoal.html)
- [FRUIT MERGE JUICY DROP GAME](https://quizverses.github.io/fruit-merge-juicy-drop-game.html)
- [CATEGORY CAR](https://studyplaying.github.io/category-car.html)
- [ANIMAL TRANSFORM RACE](https://quizverses.pages.dev/animal-transform-race.html)
- [BLOCKSSS](https://studyplayings.pages.dev/blocksss.html)
- [CATEGORY SOCCER 2](https://studyplayings.web.app/category-soccer-2.html)
- [MATH CROSSWORD PUZZLE GENIUS EDITION](https://quizverses-9d2f2.web.app/math-crossword-puzzle-genius-edition.html)
- [SOLITAIRE MATCH](https://studyplaying.github.io/solitaire-match.html)
- [SNEAKY FRIENDS](https://studyquests.github.io/sneaky-friends.html)
- [SITEMAP](https://studyplayings.web.app/sitemap.html)
- [CATEGORY HORROR 2](https://studyplayings.web.app/category-horror-2.html)
- [ADDICTION SOLITAIRE](https://quizverses-9d2f2.web.app/addiction-solitaire.html)
- [MAKEUP FRUITS](https://studyplayings.pages.dev/makeup-fruits.html)
- [CATEGORY MOUSE1 707](https://studyplaying.github.io/category-mouse1-707.html)
- [K POP HUNTER HALLOWEEN FASHION](https://quizverses.pages.dev/k-pop-hunter-halloween-fashion.html)
- [CATEGORY SIMULATION 2](https://studyplayings.web.app/category-simulation-2.html)
- [ZOMBIE SIEGEIO](https://studyplayings.web.app/zombie-siegeio.html)
- [KIOMET COM](https://quizverses.pages.dev/kiomet-com.html)
- [HAZEL TANGLE ROPE 3D SORTING PUZZLE](https://studyquests.github.io/hazel-tangle-rope-3d-sorting-puzzle.html)
- [CATEGORY FASHION105](https://studyquests.pages.dev/category-fashion105.html)
- [CATEGORY MOUSE1 697](https://quizverses.github.io/category-mouse1-697.html)
- [CATEGORY STICKMAN175](https://studyplayings.web.app/category-stickman175.html)
- [FISH MASTER GO FISH](https://studyquests.github.io/fish-master-go-fish.html)
- [CATEGORY COOKING46](https://studyplayings.pages.dev/category-cooking46.html)
- [EATING SIMULATOR](https://studyquests.github.io/eating-simulator.html)
- [KINGDOM PUZZLES](https://quizverses-9d2f2.web.app/kingdom-puzzles.html)
- [TILEMAN IO](https://studyplayings.pages.dev/tileman-io.html)
- [COLOR SCREW RESCUE PUZZLE](https://quizverses.github.io/color-screw-rescue-puzzle.html)
- [CATEGORY COOKING](https://quizverses-9d2f2.web.app/category-cooking.html)
- [STREET TRAFFIC RACER](https://studyplayings.pages.dev/street-traffic-racer.html)
- [BACKWOODS](https://studyplayings.pages.dev/backwoods.html)
- [CATEGORY CUTE](https://thelearnquester.web.app/category-cute.html)
- [CATEGORY DRESS UP CATEGORY](https://studyplayings.pages.dev/category-dress-up-category.html)
- [CATEGORY CUTE62](https://studyplayings.pages.dev/category-cute62.html)
- [JELLO BUBBLES](https://studyplayings.pages.dev/jello-bubbles.html)
- [CATEGORY FARMING](https://studyquests.pages.dev/category-farming.html)
- [CATEGORY CARE](https://studyplayings.web.app/category-care.html)
- [SUPERHEROES AND THE WAND](https://studyquests.github.io/superheroes-and-the-wand.html)
- [CATEGORY CASUAL 12](https://studyplaying.github.io/category-casual-12.html)
- [BOUNCY BLOB RACE OBSTACLE COURSE](https://quizverses.github.io/bouncy-blob-race-obstacle-course.html)
- [LITTLE DENTIST DASH](https://quizverses.pages.dev/little-dentist-dash.html)
- [KUNG FU LITTLE ANIMALS](https://quizverses-9d2f2.web.app/kung-fu-little-animals.html)
- [HIDDEN KITTY](https://quizverses.github.io/hidden-kitty.html)
- [CAT ESCAPE HIDE AND SEEK](https://studyplayings.pages.dev/cat-escape-hide-and-seek.html)
- [NETQUEL COM](https://quizverses.github.io/netquel-com.html)
- [FROGIO](https://studyquests.github.io/frogio.html)
- [SNAKE HUNTER](https://studyquests.github.io/snake-hunter.html)
- [CANDY MATCH PUZZLE](https://quizverses.pages.dev/candy-match-puzzle.html)
- [INDEX13](https://studyplaying.github.io/index13.html)
- [CATEGORY STICKMAN](https://studyplayings.web.app/category-stickman.html)
- [UNSCREW THEM ALL](https://quizverses.github.io/unscrew-them-all.html)
- [CATEGORY COLLECT600](https://studyquests.pages.dev/category-collect600.html)
- [ROBOT BAND FIND THE DIFFERENCES](https://studyquests.github.io/robot-band-find-the-differences.html)
- [CATEGORY COLLECT](https://studyplaying.github.io/category-collect.html)
- [BRAIN FIND CAN YOU FIND IT](https://studyplayings.pages.dev/brain-find-can-you-find-it.html)
- [MR MACAGI ADVENTURES](https://quizverses-9d2f2.web.app/mr-macagi-adventures.html)
- [HERO RAGDOLL FIGHTING](https://learnquester.github.io/hero-ragdoll-fighting.html)
- [ZOMBIE OUTBREAK SURVIVE](https://quizverses.github.io/zombie-outbreak-survive.html)
- [MAGIC FINGER PUZZLE 3D](https://studyquests.github.io/magic-finger-puzzle-3d.html)
- [STICKMAN FIGHT PRO](https://quizverses-9d2f2.web.app/stickman-fight-pro.html)
- [CATEGORY 3D1 383](https://studyplayings.web.app/category-3d1-383.html)
- [DR PARKING](https://quizverses.pages.dev/dr-parking.html)
- [VEGAMIX MATCH 3 VILLAGE](https://studyquests.github.io/vegamix-match-3-village.html)
- [CATEGORY MOUSE](https://studyplayings.pages.dev/category-mouse.html)
- [IDLE AIRPORT CEO](https://quizverses-9d2f2.web.app/idle-airport-ceo.html)
- [AVATAR MASTER FIX UP FACE](https://learnquester.github.io/avatar-master-fix-up-face.html)
- [INDEX5](https://studyquests.github.io/index5.html)
- [MAKE TWO](https://quizverses-9d2f2.web.app/make-two.html)
- [CATEGORY DRESS UP](https://studyplayings.web.app/category-dress-up.html)
- [ADDICTION SOLITAIRE](https://studyplayings.pages.dev/addiction-solitaire.html)
- [PHANTOM THIEF CAT RUNNING](https://learnquester.github.io/phantom-thief-cat-running.html)
- [RUN FROM BABA YAGA](https://learnquester.github.io/run-from-baba-yaga.html)
- [MATE IN CHESS](https://studyquests.github.io/mate-in-chess.html)
- [HEAD RUNNER DASH](https://studyquesthub.web.app/head-runner-dash.html)
- [CUT GRASS](https://studyquests.github.io/cut-grass.html)
- [DOMINO SMASH 3D](https://quizverses.github.io/domino-smash-3d.html)
- [HAMSTERCYCLE](https://quizverses-9d2f2.web.app/hamstercycle.html)
- [GUN MATCH SCREW](https://studyplayings.pages.dev/gun-match-screw.html)
- [INDEX27](https://studyplaying.github.io/index27.html)
- [CATEGORY CASUAL 3](https://studyplayings.web.app/category-casual-3.html)
- [ARROW ESCAPE PUZZLE](https://quizverses-9d2f2.web.app/arrow-escape-puzzle.html)
- [FOOD JAM](https://quizverses.pages.dev/food-jam.html)
- [MURDER](https://studyquests.pages.dev/murder.html)
- [CATEGORY BATTLE ROYALE](https://studyplayings.web.app/category-battle-royale.html)
- [MY FARM LIFE](https://quizverses-9d2f2.web.app/my-farm-life.html)
- [INDEX8](https://studyplayings.web.app/index8.html)
- [PUSH THE FROG](https://studyquesthub.web.app/push-the-frog.html)
- [INDEX14](https://studyplayings.pages.dev/index14.html)
- [MY FARM LIFE](https://learnquester.github.io/my-farm-life.html)
- [CATEGORY GAMES](https://studyplayings.pages.dev/category-games.html)
- [GROW A GARDEN ONLINE OFFLINE](https://studyplaying.github.io/grow-a-garden-online-offline.html)
- [ASMR NAIL TREATMENT](https://quizverses.github.io/asmr-nail-treatment.html)
- [CATEGORY PUZZLE 10](https://quizverses.github.io/category-puzzle-10.html)
- [CATEGORY MONSTER206](https://quizverses.github.io/category-monster206.html)
- [DOMINO ONLINE MULTIPLAYER](https://studyquesthub.web.app/domino-online-multiplayer.html)
- [CRAZY BIKE STUNTS PVP](https://quizverses-9d2f2.web.app/crazy-bike-stunts-pvp.html)
- [FRUIT JAM MERGE PUZZLE GAME](https://studyplaying.github.io/fruit-jam-merge-puzzle-game.html)
- [TRAFFIC TAP PUZZLE](https://learnquester.github.io/traffic-tap-puzzle.html)
- [ROPE RESCUE UNIQUE PUZZLE](https://studyplaying.github.io/rope-rescue-unique-puzzle.html)
- [BUBBLE ESCAPE](https://quizverses.pages.dev/bubble-escape.html)
- [UNTWIST ROAD](https://quizverses.github.io/untwist-road.html)
- [CATEGORY PENALTY](https://studyplayings.web.app/category-penalty.html)
- [SORT AND STYLE BACK TO SCHOOL](https://studyquests.pages.dev/sort-and-style-back-to-school.html)
- [LUCY ALL SEASON FASHIONINSTA](https://quizverses.github.io/lucy-all-season-fashioninsta.html)
- [FURY ROAD ZOMBIE CRASH](https://studyplayings.pages.dev/fury-road-zombie-crash.html)
- [POXEL IO](https://quizverses-9d2f2.web.app/poxel-io.html)
- [CATEGORY CARE](https://studyquests.github.io/category-care.html)
- [CATEGORY BATTLE524](https://quizverses-9d2f2.web.app/category-battle524.html)
- [MOON LEAGUE SPORTS SEASON](https://studyplaying.github.io/moon-league-sports-season.html)
- [TANK STARS](https://studyplayings.pages.dev/tank-stars.html)
- [K WEDDING DREAM](https://quizverses.github.io/k-wedding-dream.html)
- [CATEGORY LISTS](https://studyplayings.pages.dev/category-lists.html)
- [BLOCK DIGGER](https://studyquests.github.io/block-digger.html)
- [EARWAX CLINIC](https://quizverses-9d2f2.web.app/earwax-clinic.html)
- [CHICKEN SCREAM RACE](https://studyquests.github.io/chicken-scream-race.html)
