import { spawnSync, execSync } from 'child_process';
import { version } from '../package.json';
import path from 'path';
const PROJECT_FOLDERS_ROOT = 'test-ts-types';
const EXPECTED_ERRORS = new Map<string, string[]>([
  [
    'ts-esm-import-esm-output',
    [
      "bad.ts(6,35): error TS2551: Property 'launh' does not exist on type",
      "bad.ts(8,29): error TS2551: Property 'devics' does not exist on type",
      'bad.ts(12,39): error TS2554: Expected 0 arguments, but got 1.',
    ],
  ],
  [
    'ts-esm-import-cjs-output',
    [
      "bad.ts(6,35): error TS2551: Property 'launh' does not exist on type",
      "bad.ts(8,29): error TS2551: Property 'devics' does not exist on type",
      'bad.ts(12,39): error TS2554: Expected 0 arguments, but got 1.',
    ],
  ],
  [
    'ts-cjs-import-cjs-output',
    [
      "bad.ts(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.ts(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.ts(11,39): error TS2554: Expected 0 arguments, but got 1.',
    ],
  ],
  [
    'js-esm-import-cjs-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<Element> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
  [
    'js-cjs-import-esm-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<Element> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
  [
    'js-esm-import-esm-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<Element> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
  [
    'js-cjs-import-cjs-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<Element> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
]);
const PROJECT_FOLDERS = [...EXPECTED_ERRORS.keys()];

function packPuppeteer() {
  console.log('Packing Puppeteer');
  const result = spawnSync('npm', ['pack'], {
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    console.log('Failed to pack Puppeteer', result.stderr);
    process.exit(1);
  }

  return `puppeteer-${version}.tgz`;
}

const tar = packPuppeteer();
const tarPath = path.join(process.cwd(), tar);

function compileAndCatchErrors(projectLocation) {
  let failed = false;
  let tsErrorMesssage: string[] = [];
  let result;
  try {
    result = execSync(`cd ${projectLocation} && npm run compile`, {
      encoding: 'utf-8',
      stdio: 'pipe', // means the output isn't logged by default
    });
  } catch (error) {
    // We expect to always get here, as each project has some typos to test if
    // our types are used correctly to catch errors;
    failed = true;
    tsErrorMesssage = (error.stdout as string).split('\n');
  }

  if (!failed) {
    console.error(
      `Running tsc on ${projectLocation} succeeded without triggering the expected errors.`
    );
    console.log(result);
    process.exit(1);
  }

  return {
    failed,
    tsErrorMesssage,
  };
}

function testProject(folder: string) {
  console.log('\nTesting:', folder);
  const projectLocation = path.join(
    process.cwd(),
    PROJECT_FOLDERS_ROOT,
    folder
  );
  const tarLocation = path.relative(projectLocation, tarPath);
  console.log('===> Installing Puppeteer from tar file');
  execSync(
    `cd ${projectLocation} && PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-package-lock ${tarLocation}`,
    { encoding: 'utf-8' }
  );
  console.log('===> Running compile to ensure expected errors only.');
  const result = compileAndCatchErrors(projectLocation);
  const expectedErrors = EXPECTED_ERRORS.get(folder) || [];
  if (
    result.tsErrorMesssage.find(
      (line) => line.includes('good.ts') || line.includes('good.js')
    )
  ) {
    console.error(
      `Error for ${projectLocation} contained unexpected failures in good.ts/good.js:\n${result.tsErrorMesssage}`
    );
    process.exit(1);
  }
  const errorsInTsMessage = result.tsErrorMesssage.filter(
    (line) => line.includes('bad.ts') || line.includes('bad.js')
  );
  const expectedErrorsThatHaveOccurred = new Set<string>();
  const unexpectedErrors = errorsInTsMessage.filter((message) => {
    const isExpected = expectedErrors.some((expectedError) => {
      const isExpected = message.startsWith(expectedError);
      if (isExpected) {
        expectedErrorsThatHaveOccurred.add(expectedError);
      }
      return isExpected;
    });
    return !isExpected;
  });

  if (unexpectedErrors.length) {
    console.error(
      `${projectLocation} had unexpected TS errors: ${unexpectedErrors.join(
        '\n'
      )}`
    );
    process.exit(1);
  }
  expectedErrors.forEach((expected) => {
    if (!expectedErrorsThatHaveOccurred.has(expected)) {
      console.error(
        `${projectLocation} expected error that was not thrown: ${expected}`
      );
      process.exit(1);
    }
  });
  console.log('===> ✅ Type checked correctly.');
}

PROJECT_FOLDERS.forEach((folder) => {
  testProject(folder);
});
