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
- [FIRESIDE SOLITAIRE](https://quizverses.pages.dev/fireside-solitaire.html)
- [GEOMETRY STARS](https://quizverses.pages.dev/geometry-stars.html)
- [CATEGORY PREMIUM PERKS74](https://quizverses.pages.dev/category-premium-perks74.html)
- [TILE CONNECT PAIR MATCH PUZZLE](https://themindplays.pages.dev/tile-connect-pair-match-puzzle.html)
- [TRIPEAKS SOLITAIRE ESCAPES](https://quizverses.pages.dev/tripeaks-solitaire-escapes.html)
- [CATEGORY ADVENTURE](https://studyquests.pages.dev/category-adventure.html)
- [OVERTIDE IO](https://studyquests.github.io/overtide-io.html)
- [UNCLE BULLET 007](https://quizverses.pages.dev/uncle-bullet-007.html)
- [CATEGORY WATER39](https://quizverses.pages.dev/category-water39.html)
- [CATEGORY MERGE GAMES](https://studyquesthub.web.app/category-merge-games.html)
- [CATEGORY DEFENSE176](https://studyquests.github.io/category-defense176.html)
- [CATEGORY SIDE SCROLLING184](https://quizverses.pages.dev/category-side-scrolling184.html)
- [BUBBLE BLITZ GALAXY](https://quizverses.pages.dev/bubble-blitz-galaxy.html)
- [CATEGORY FLASH 2](https://studyplayings.web.app/category-flash-2.html)
- [SHEEP SHEEP DUCK](https://quizverses.pages.dev/sheep-sheep-duck.html)
- [TSUNAMI RACE](https://studyquesthub.web.app/tsunami-race.html)
- [CHILDREN HAPPY FARM DUDU](https://thelearnquester.web.app/children-happy-farm-dudu.html)
- [BLOCK MERGE CITY](https://thelearnquester.web.app/block-merge-city.html)
- [CATEGORY DRESS UP 2](https://studyquests.github.io/category-dress-up-2.html)
- [CATEGORY TITANIUMNETWORK PROXIES](https://studyquests.github.io/category-titaniumnetwork-proxies.html)
- [CATEGORY PLATFORM](https://quizverses.pages.dev/category-platform.html)
- [CATEGORY PREMIUM PERKS74](https://thelearnquester.web.app/category-premium-perks74.html)
- [FIRE BALL AND WATER BALL PARKOUR LOVE BALLS](https://learnquesters.pages.dev/fire-ball-and-water-ball-parkour-love-balls.html)
- [MOJICON GARDEN JIGSOLITAIRE](https://studyquests.github.io/mojicon-garden-jigsolitaire.html)
- [CATEGORY SOCCER60](https://studyquests.github.io/category-soccer60.html)
- [MAHJONG PET QUEST](https://quizverses.pages.dev/mahjong-pet-quest.html)
- [PET DOCTOR BUSINESS TYCOON PET CARE GAME](https://thelearnquester.web.app/pet-doctor-business-tycoon-pet-care-game.html)
- [FUNNY FEVER HOSPITAL](https://quizverses-9d2f2.web.app/funny-fever-hospital.html)
- [CATEGORY EXPLOIT](https://thelearnquester.web.app/category-exploit.html)
- [MERGE PLANETS](https://quizverses.pages.dev/merge-planets.html)
- [CUTE SHEEP SKYBLOCK](https://quizverses.pages.dev/cute-sheep-skyblock.html)
- [HYPER SURVIVE](https://studyquests.github.io/hyper-survive.html)
- [FOOD TRUCK CHEF COOKING](https://studyquests.github.io/food-truck-chef-cooking.html)
- [STICKER JAM PEEL OFF MATCH](https://quizverses-9d2f2.web.app/sticker-jam-peel-off-match.html)
- [MONSTER SCHOOL VS SIREN HEAD](https://quizverses-9d2f2.web.app/monster-school-vs-siren-head.html)
- [WORD SEARCH UNIVERSE](https://studyquests.github.io/word-search-universe.html)
- [CATEGORY MAHJONG 2](https://studyquesthub.web.app/category-mahjong-2.html)
- [CATEGORY BUBBLE SHOOTER](https://thelearnquester.web.app/category-bubble-shooter.html)
- [TOILET TIME](https://thelearnquester.web.app/toilet-time.html)
- [CATEGORY TOP DOWN251](https://quizverses-9d2f2.web.app/category-top-down251.html)
- [COE SNAKE](https://quizverses-9d2f2.web.app/coe-snake.html)
- [OMG WORD RAINBOW](https://learnquester.pages.dev/omg-word-rainbow.html)
- [TCG CARD CLICKER](https://quizverses.pages.dev/tcg-card-clicker.html)
- [CATEGORY PUZZLE 2](https://thelearnquester.web.app/category-puzzle-2.html)
- [CATEGORY SCHOOL UNBLOCKER](https://studyquests.github.io/category-school-unblocker.html)
- [GET READY WITH ME CONCERT DAY](https://studyquests.github.io/get-ready-with-me-concert-day.html)
- [CATEGORY STICKMAN175](https://quizverses-9d2f2.web.app/category-stickman175.html)
- [CATEGORY AVOID295](https://studyquests.pages.dev/category-avoid295.html)
- [MEME WARS](https://learnquester.pages.dev/meme-wars.html)
- [CAR DEALER IDLE](https://learnquester.pages.dev/car-dealer-idle.html)
- [CATEGORY THINKY 2](https://learnquesters.pages.dev/category-thinky-2.html)
- [CATEGORY SPORTS](https://studyquests.github.io/category-sports.html)
- [CATEGORY SORTING](https://thelearnquester.web.app/category-sorting.html)
- [CLAP CLAP NIGHTMARE](https://quizverses-9d2f2.web.app/clap-clap-nightmare.html)
- [DINOSAURS VS ASTEROIDS](https://learnquesters.pages.dev/dinosaurs-vs-asteroids.html)
- [GRAVITY SPEED RUN](https://quizverses-9d2f2.web.app/gravity-speed-run.html)
- [MICKEY RUN ADVENTURE GAME](https://thelearnquester.web.app/mickey-run-adventure-game.html)
- [DONUT RUN](https://thelearnquester.web.app/donut-run.html)
- [CATEGORY SCHOOL](https://studyquests.github.io/category-school.html)
- [ARCADE GP](https://learnquesters.pages.dev/arcade-gp.html)
- [INDEX19](https://thelearnquester.web.app/index19.html)
- [SURVIVAL SWORD BATTLE](https://studyquests.pages.dev/survival-sword-battle.html)
- [HOSPITAL GAME HAPPY CLINIC](https://learnquesters.pages.dev/hospital-game-happy-clinic.html)
- [CATEGORY MANAGEMENT209](https://studyquests.pages.dev/category-management209.html)
- [ENCHANTED EASTER ADVENTURE](https://learnquester.pages.dev/enchanted-easter-adventure.html)
- [FURRY WEDDING PROPOSAL](https://learnquesters.pages.dev/furry-wedding-proposal.html)
- [BARREL ROLLER AMAZING RUNNER](https://quizverses.pages.dev/barrel-roller-amazing-runner.html)
- [CATEGORY SNAKE](https://studyquests.github.io/category-snake.html)
- [BUBBITS](https://studyquests.pages.dev/bubbits.html)
- [CATEGORY SOCCER60](https://thelearnquester.web.app/category-soccer60.html)
- [WIPE INSIGHT MASTER](https://studyquests.pages.dev/wipe-insight-master.html)
- [MINI GRAND THEFT CITY](https://quizverses.pages.dev/mini-grand-theft-city.html)
- [CATEGORY SECURLY](https://thelearnquester.web.app/category-securly.html)
- [FUN MINI GAMES FOR PRINCESS](https://learnquester.pages.dev/fun-mini-games-for-princess.html)
- [CATEGORY STRATEGY 2](https://quizverses-9d2f2.web.app/category-strategy-2.html)
- [COLOR MAZE](https://learnquesters.pages.dev/color-maze.html)
- [FUN GOLF](https://studyquests.github.io/fun-golf.html)
- [CATEGORY MOBILE2 095](https://studyquests.pages.dev/category-mobile2-095.html)
- [DOP DRAW ONE PART](https://learnquester.pages.dev/dop-draw-one-part.html)
- [FISHING CATCH THE SECRET BRAINROT](https://learnquester.pages.dev/fishing-catch-the-secret-brainrot.html)
- [PANDA RESTAURANT](https://learnquester.pages.dev/panda-restaurant.html)
- [BANG BANG MAHJONG](https://thelearnquester.web.app/bang-bang-mahjong.html)
- [UNICORN PRINCESS DRESS UP](https://quizverses-9d2f2.web.app/unicorn-princess-dress-up.html)
- [CATEGORY FASHION105](https://thelearnquester.web.app/category-fashion105.html)
- [MY PERFECT YEAR PLANNER](https://learnquesters.pages.dev/my-perfect-year-planner.html)
- [CATEGORY SPACE57](https://studyquests.github.io/category-space57.html)
- [SQUID CHALLENGE PLAY TO SURVIVE](https://learnquesters.pages.dev/squid-challenge-play-to-survive.html)
- [CATEGORY UNBLOCKEDGAMES](https://quizverses-9d2f2.web.app/category-unblockedgames.html)
- [WOLF LIFE SIMULATOR](https://learnquester.pages.dev/wolf-life-simulator.html)
- [CATEGORY RAMMERHEAD](https://thelearnquester.web.app/category-rammerhead.html)
- [CATEGORY GROW](https://studyquests.pages.dev/category-grow.html)
- [SUMMER CONNECT](https://thelearnquester.web.app/summer-connect.html)
- [CATEGORY PIXEL313](https://thelearnquester.web.app/category-pixel313.html)
- [CATEGORY STICKMAN175](https://studyquests.github.io/category-stickman175.html)
- [CATEGORY WAR](https://quizverses-9d2f2.web.app/category-war.html)
- [CATEGORY STICKMAN](https://thelearnquester.web.app/category-stickman.html)
- [PONGOAL](https://quizverses.pages.dev/pongoal.html)
- [CATEGORY PROXY LIST](https://thelearnquester.web.app/category-proxy-list.html)
- [ASMR BEAUTY SUPERSTAR](https://quizverses-9d2f2.web.app/asmr-beauty-superstar.html)
- [PICK BRAINROT 3D BATTLE](https://quizverses.pages.dev/pick-brainrot-3d-battle.html)
- [MY COTTAGECORE AESTHETIC LOOK](https://learnquesters.pages.dev/my-cottagecore-aesthetic-look.html)
- [PLANE CRASH RAGDOLL SIMULATOR](https://learnquester.pages.dev/plane-crash-ragdoll-simulator.html)
- [CATEGORY RPG](https://quizverses.pages.dev/category-rpg.html)
- [WINTER WOLF](https://learnquester.pages.dev/winter-wolf.html)
- [KINGS AND QUEENS MAHJONG](https://studyquests.github.io/kings-and-queens-mahjong.html)
- [BRIDGE FIGHT](https://quizverses-9d2f2.web.app/bridge-fight.html)
- [MOSCOW METRO DRIVER 3D](https://quizverses.pages.dev/moscow-metro-driver-3d.html)
- [ALPHABET MERGE AND FIGHT](https://learnquesters.pages.dev/alphabet-merge-and-fight.html)
- [DAILY JEWELS BLITZ MAHJONG](https://learnquester.pages.dev/daily-jewels-blitz-mahjong.html)
- [CATEGORY MAHJONG](https://studyquests.pages.dev/category-mahjong.html)
- [ROYAL GARDEN MATCH](https://studyquests.pages.dev/royal-garden-match.html)
- [MERGE BALLS NEW YEARS TOYS IN 3D](https://learnquester.pages.dev/merge-balls-new-years-toys-in-3d.html)
- [CATEGORY SPACE](https://quizverses.pages.dev/category-space.html)
- [BOYFRIEND FOR HIRE](https://quizverses-9d2f2.web.app/boyfriend-for-hire.html)
- [CATEGORY MEDIEVAL15](https://studyquests.pages.dev/category-medieval15.html)
- [CATEGORY CLASSIC98](https://thelearnquester.web.app/category-classic98.html)
- [SQUID GAME HUNTER](https://quizverses.pages.dev/squid-game-hunter.html)
- [3D BALL BALANCER](https://studyquests.pages.dev/3d-ball-balancer.html)
- [MINI SHOOTERS](https://learnquester.pages.dev/mini-shooters.html)
- [CATEGORY THINKY 2](https://thelearnquester.web.app/category-thinky-2.html)
- [SLOPE SNOWBALL](https://quizverses-9d2f2.web.app/slope-snowball.html)
- [JIGSOLITAIRE](https://learnquester.pages.dev/jigsolitaire.html)
- [NOOB IN GEOMETRY DASH](https://learnquester.pages.dev/noob-in-geometry-dash.html)
- [THREAD SORT](https://themindzone.pages.dev/thread-sort.html)
- [GOBATTLEIO](https://quizverses-9d2f2.web.app/gobattleio.html)
- [MERGE PIXEL](https://themindzone.pages.dev/merge-pixel.html)
- [ASMR TATTOO TREATMENT](https://themindzone.pages.dev/asmr-tattoo-treatment.html)
- [MERGE IN SPACE](https://themindzone.pages.dev/merge-in-space.html)
- [REAL CAR PARKING AND STUNT](https://thelearnquesters.pages.dev/real-car-parking-and-stunt.html)
- [K POP HUNTERS VALENTINE STYLE](https://studyquests.github.io/k-pop-hunters-valentine-style.html)
