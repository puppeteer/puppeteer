# Puppeteer (Aglide's version)

> A fork of [Puppeteer](https://github.com/puppeteer/puppeteer) - a JavaScript library providing a high-level API to control Chrome or Firefox over the DevTools Protocol or WebDriver BiDi.

## Development Setup

### Prerequisites

- Node.js (check `.nvmrc` or `package.json` for version requirements)
- npm

### Installing Dependencies

```bash
git clone <your-repo-url>
cd puppeteer-aglide
npm install
```

To download Firefox instead of Chrome by default:
```bash
PUPPETEER_BROWSER=firefox npm install
```

### Building

**Build all packages:**
```bash
npm run build
```

**Build only puppeteer-core:**
```bash
npm run build --workspace puppeteer-core
```

> This will automatically build all dependent packages.

**Watch mode (for development):**
```bash
npm run build --watch --workspace puppeteer-core
```

**Clean stale artifacts:**
```bash
npm run clean
# Or for a specific package:
npm run clean --workspace puppeteer-core
```

### Testing

**Run all tests:**
```bash
npm test
```

> This runs `test:{chrome,firefox}:headless` by default.

**Other test commands:**

| Command | Description |
|---------|-------------|
| `npm run test-install` | Tests whether puppeteer and puppeteer-core install properly |
| `npm run test-types` | Tests TypeScript types using tsd |
| `npm run test:chrome:headless` | Tests on Chrome (headless) |
| `npm run test:firefox:headless` | Tests on Firefox (headless) |
| `npm run unit` | Runs unit tests only (no browser) |

### Code Style

Check code style:
```bash
npm run lint
```

Auto-fix formatting issues:
```bash
npm run format
```

## Usage

```ts
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto('https://example.com');
// ... your automation code

await browser.close();
```

## Project Structure

- `packages/puppeteer-core` - Core library (browser-agnostic)
- `packages/puppeteer` - Main package (includes browser download)
- `test/` - Test source code
- `tools/` - Build and utility scripts
