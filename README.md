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
- [CATEGORY SECURLY](https://studyplaying.github.io/category-securly.html)
- [STICKMAN MEGA BOSS BATTLES](https://thelearnquester.web.app/stickman-mega-boss-battles.html)
- [CATEGORY SHOP](https://studyplayings.web.app/category-shop.html)
- [STUPIDITY TEST](https://studyplayings.pages.dev/stupidity-test.html)
- [SNAP FIX](https://quizverses-9d2f2.web.app/snap-fix.html)
- [SPRUNKI EASTER COLORING](https://learnquester.github.io/sprunki-easter-coloring.html)
- [RACING BALL ADVENTURE](https://quizverses-9d2f2.web.app/racing-ball-adventure.html)
- [XYTRIAN RUNNER](https://quizverses-9d2f2.web.app/xytrian-runner.html)
- [FUN TOWN PARKING](https://studyplayings.web.app/fun-town-parking.html)
- [CATEGORY SOCCER 2](https://studyplayings.web.app/category-soccer-2.html)
- [REAL IMPOSSIBLE SKY TRACKS CAR DRIVING](https://studyplayings.web.app/real-impossible-sky-tracks-car-driving.html)
- [LAMBO TRAFFIC RACER](https://quizverses-9d2f2.web.app/lambo-traffic-racer.html)
- [TWILIGHT SOLITAIRE TRIPEAKS](https://quizverses-9d2f2.web.app/twilight-solitaire-tripeaks.html)
- [TWO BLOCKS](https://studyquesthub.web.app/two-blocks.html)
- [TUNG SAHUR BOTS CHASE ROOM](https://learnquester.github.io/tung-sahur-bots-chase-room.html)
- [BLOCK MASTER SUPER PUZZLE](https://studyquests.pages.dev/block-master-super-puzzle.html)
- [CATEGORY WORLD CUP17](https://learnquester.github.io/category-world-cup17.html)
- [CATEGORY FARMING](https://studyquests.pages.dev/category-farming.html)
- [STACK FALL](https://quizverses-9d2f2.web.app/stack-fall.html)
- [FARM OF WORDS](https://studyplaying.github.io/farm-of-words.html)
- [ASSASSIN COMMANDO CAR DRIVING](https://quizverses-9d2f2.web.app/assassin-commando-car-driving.html)
- [SQUID GAME HUNTER](https://studyplaying.github.io/squid-game-hunter.html)
- [TOY CARS 3D RACING](https://quizverses-9d2f2.web.app/toy-cars-3d-racing.html)
- [EARWAX CLINIC](https://quizverses-9d2f2.web.app/earwax-clinic.html)
- [CATEGORY RACING DRIVING](https://learnquester.github.io/category-racing-driving.html)
- [PLANET TAKEOVER](https://studyplaying.github.io/planet-takeover.html)
- [SWIPETOWN](https://quizverses-9d2f2.web.app/swipetown.html)
- [ZINDEX](https://quizverses-9d2f2.web.app/zindex.html)
- [FURRY KUNG FU](https://studyplaying.github.io/furry-kung-fu.html)
- [GIRLFRIEND FROM HELL](https://quizverses-9d2f2.web.app/girlfriend-from-hell.html)
- [CATEGORY WATER39](https://learnquester.github.io/category-water39.html)
- [ALIEN STORM](https://studyplayings.web.app/alien-storm.html)
- [ASMR BEAUTY SUPERSTAR](https://quizverses-9d2f2.web.app/asmr-beauty-superstar.html)
- [SPRUNKI CHARACTER MAKER OC](https://studyquests.pages.dev/sprunki-character-maker-oc.html)
- [WORDS OR DIE](https://studyplayings.web.app/words-or-die.html)
- [CATEGORY SPORTS](https://learnquester.github.io/category-sports.html)
- [CRAZY SCREW KING](https://quizverses-9d2f2.web.app/crazy-screw-king.html)
- [ARROW TAP PUZZLE](https://quizverses-9d2f2.web.app/arrow-tap-puzzle.html)
- [GROW CASTLE DEFENCE](https://quizverses-9d2f2.web.app/grow-castle-defence.html)
- [CATEGORY PARKOUR55](https://studyplayings.web.app/category-parkour55.html)
- [BELL MADNESS](https://studyplayings.web.app/bell-madness.html)
- [CUBE DROP PUZZLE](https://quizverses-9d2f2.web.app/cube-drop-puzzle.html)
- [FOREST MATCH 4](https://quizverses-9d2f2.web.app/forest-match-4.html)
- [MONSTER TRUCK CRUSH](https://quizverses-9d2f2.web.app/monster-truck-crush.html)
- [SQUID ESCAPE BUT BLOCKWORLD](https://quizverses-9d2f2.web.app/squid-escape-but-blockworld.html)
- [SANTA GO](https://studyplaying.github.io/santa-go.html)
- [GOODS TRIPLE MATCH 3D](https://quizverses-9d2f2.web.app/goods-triple-match-3d.html)
- [GUN EVOLUTION](https://quizverses-9d2f2.web.app/gun-evolution.html)
- [CATEGORY JUMPING147](https://studyquests.pages.dev/category-jumping147.html)
- [CLEAN THE FLOOR](https://quizverses-9d2f2.web.app/clean-the-floor.html)
- [CUTE CRAFT LAB](https://studyquests.pages.dev/cute-craft-lab.html)
- [CATEGORY RPG80](https://learnquester.github.io/category-rpg80.html)
- [COLLECT EM ALL](https://quizverses-9d2f2.web.app/collect-em-all.html)
- [CATEGORY FARMING87](https://studyquests.pages.dev/category-farming87.html)
- [HUGGY WUGGY ESCAPE](https://quizverses-9d2f2.web.app/huggy-wuggy-escape.html)
- [BLOCKS BREAKER](https://studyplayings.web.app/blocks-breaker.html)
- [DOG ESCAPE](https://studyquests.pages.dev/dog-escape.html)
- [CATEGORY MINECRAFT81](https://studyquests.pages.dev/category-minecraft81.html)
- [CATEGORY MEME BLOXY24](https://studyquests.pages.dev/category-meme-bloxy24.html)
- [CATEGORY BUBBLE SHOOTER27](https://studyquesthub.web.app/category-bubble-shooter27.html)
- [HAPPY FARM THE CROP](https://studyplaying.github.io/happy-farm-the-crop.html)
- [STRIKE BREAKOUT](https://quizverses-9d2f2.web.app/strike-breakout.html)
- [WORDS WITH PROF WISELY](https://studyquests.pages.dev/words-with-prof-wisely.html)
- [CATEGORY DRESS UP](https://studyquests.pages.dev/category-dress-up.html)
- [ANIME COUPLE AVATAR MAKER](https://quizverses-9d2f2.web.app/anime-couple-avatar-maker.html)
- [SPIN SHOT SIEGE](https://studyquests.github.io/spin-shot-siege.html)
- [HOSPITAL GAME HAPPY CLINIC](https://studyplaying.github.io/hospital-game-happy-clinic.html)
- [GLAMOUR BEACHLIFE](https://studyquests.github.io/glamour-beachlife.html)
- [MOJO EMOJI](https://studyplaying.github.io/mojo-emoji.html)
- [NUWPYS ADVENTURE](https://quizverses-9d2f2.web.app/nuwpys-adventure.html)
- [BALL EATING SIMULATOR](https://studyquests.pages.dev/ball-eating-simulator.html)
- [CATEGORY TOWER DEFENSE](https://learnquester.github.io/category-tower-defense.html)
- [BUTTERFLY SORT PUZZLE](https://studyplaying.github.io/butterfly-sort-puzzle.html)
- [CATEGORY WEBGAME](https://learnquester.github.io/category-webgame.html)
- [NINJA CROSSWORD CHALLENGE](https://studyquests.pages.dev/ninja-crossword-challenge.html)
- [BATTLEDUDES IO](https://studyquests.github.io/battledudes-io.html)
- [CATEGORY BASKETBALL 2](https://studyquests.github.io/category-basketball-2.html)
- [CATEGORY CARTOON](https://studyplayings.web.app/category-cartoon.html)
- [QUEENS ROYAL SUDOKU PUZZLE](https://studyplayings.web.app/queens-royal-sudoku-puzzle.html)
- [OVERTIDE IO](https://learnquester.github.io/overtide-io.html)
- [DOWNHILL CAR RIDE CRASH TEST](https://learnquester.github.io/downhill-car-ride-crash-test.html)
- [MERGE GALAXY](https://learnquester.github.io/merge-galaxy.html)
- [FRUIT BALLS JUICY FUSION](https://studyplaying.github.io/fruit-balls-juicy-fusion.html)
- [MR MACAGI ADVENTURES](https://quizverses-9d2f2.web.app/mr-macagi-adventures.html)
- [DR PARKING](https://learnquester.github.io/dr-parking.html)
- [REACH 2048](https://studyplayings.pages.dev/reach-2048.html)
- [INDEX12](https://studyquests.github.io/index12.html)
- [BRAINROT MOB CLASH 3D](https://quizverses-9d2f2.web.app/brainrot-mob-clash-3d.html)
- [CYBER ROLLING GOING BALL 3D](https://learnquester.github.io/cyber-rolling-going-ball-3d.html)
- [BFFS SPRING BREAK FASHIONISTA](https://studyquests.github.io/bffs-spring-break-fashionista.html)
- [WONDERS OF EGYPT MATCH](https://quizverses.pages.dev/wonders-of-egypt-match.html)
- [UNDERWATER SURVIVAL](https://quizverses-9d2f2.web.app/underwater-survival.html)
- [SLAP MAN](https://quizverses-9d2f2.web.app/slap-man.html)
- [CATEGORY PLATFORM](https://studyquests.pages.dev/category-platform.html)
- [KABOOM MINER](https://quizverses-9d2f2.web.app/kaboom-miner.html)
- [BARBEE BLACK FRIDAY FASHION](https://quizverses-9d2f2.web.app/barbee-black-friday-fashion.html)
- [GUESS THE DRAWING](https://quizverses-9d2f2.web.app/guess-the-drawing.html)
- [HOOK MASTER MAFIA CITY](https://quizverses.pages.dev/hook-master-mafia-city.html)
- [POPPING PETS](https://learnquester.github.io/popping-pets.html)
- [HEAD JUMP](https://studyquests.github.io/head-jump.html)
- [PUZZLE WOOD BLOCK](https://quizverses-9d2f2.web.app/puzzle-wood-block.html)
- [BRAIN FIND CAN YOU FIND IT](https://quizverses.pages.dev/brain-find-can-you-find-it.html)
- [TRANSFORMERS BATTLE FOR THE CITY](https://studyquesthub.web.app/transformers-battle-for-the-city.html)
- [GLOBAL CITY QKK](https://studyplaying.github.io/global-city-qkk.html)
- [ELEVATOR FIGHT](https://studyplayings.pages.dev/elevator-fight.html)
- [CATEGORY BATTLE524](https://studyquests.pages.dev/category-battle524.html)
- [SHAPE TRANSFORM RACE](https://studyplayings.pages.dev/shape-transform-race.html)
- [TRIANGLES](https://studyquests.pages.dev/triangles.html)
- [CATEGORY HORROR](https://studyplayings.web.app/category-horror.html)
- [FPS TOY REALISM](https://quizverses-9d2f2.web.app/fps-toy-realism.html)
- [PIPE CONNECT](https://quizverses-9d2f2.web.app/pipe-connect.html)
- [BLOCK PUZZLE FROZEN JEWEL](https://studyplaying.github.io/block-puzzle-frozen-jewel.html)
- [CATEGORY SANDBOX41](https://studyplayings.web.app/category-sandbox41.html)
- [STAR ATTACK 3D](https://studyquesthub.web.app/star-attack-3d.html)
- [NO PAIN NO GAIN RAGDOLL SANDBOX](https://quizverses.pages.dev/no-pain-no-gain-ragdoll-sandbox.html)
- [WORMS ZONE](https://studyplayings.web.app/worms-zone.html)
- [KUNG FU LITTLE ANIMALS](https://quizverses-9d2f2.web.app/kung-fu-little-animals.html)
- [IDLE AIRPORT CEO](https://quizverses-9d2f2.web.app/idle-airport-ceo.html)
- [BLACK PINK STPATRICKS DAY CONCERT](https://studyplayings.pages.dev/black-pink-stpatricks-day-concert.html)
- [IDLE MARKET TYCOON](https://studyplaying.github.io/idle-market-tycoon.html)
- [SHAPE TRANSFORM RACE](https://studyplayings.web.app/shape-transform-race.html)
- [JEWEL LEGEND QUEST](https://studyplaying.github.io/jewel-legend-quest.html)
- [GET A COOL GUN](https://studyplayings.pages.dev/get-a-cool-gun.html)
- [BLOXORZ BLOCK PUZZLE 3D](https://studyplayings.web.app/bloxorz-block-puzzle-3d.html)
- [OFFLINE FPS ROYALE](https://quizverses-9d2f2.web.app/offline-fps-royale.html)
- [NINJA CLIMB](https://studyquests.github.io/ninja-climb.html)
- [GEOMETRY VERTICAL](https://studyquesthub.web.app/geometry-vertical.html)
- [CATEGORY BATTLE523](https://studyquests.github.io/category-battle523.html)
- [CATEGORY ADVENTURE 3](https://studyquests.github.io/category-adventure-3.html)
- [PULL THE THREAD PUZZLE](https://studyplayings.pages.dev/pull-the-thread-puzzle.html)
