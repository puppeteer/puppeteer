import { spawnSync } from 'child_process';
import { version } from '../package.json';
import path from 'path';
import fs from 'fs';
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
      "bad.js(15,9): error TS2322: Type 'ElementHandle<HTMLElement> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
  [
    'js-cjs-import-esm-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<HTMLElement> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
  [
    'js-esm-import-esm-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<HTMLElement> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
    ],
  ],
  [
    'js-cjs-import-cjs-output',
    [
      "bad.js(5,35): error TS2551: Property 'launh' does not exist on type",
      "bad.js(7,29): error TS2551: Property 'devics' does not exist on type",
      'bad.js(11,39): error TS2554: Expected 0 arguments, but got 1.',
      "bad.js(15,9): error TS2322: Type 'ElementHandle<HTMLElement> | null' is not assignable to type 'ElementHandle<HTMLElement>'",
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

  // Move from puppeteer-X.Y.Z.tgz to puppeteer.tgz so we don't have to update
  // it when versions change.
  const moveResult = spawnSync('mv', [
    `puppeteer-${version}.tgz`,
    'puppeteer.tgz',
  ]);
  if (moveResult.status !== 0) {
    console.log('Failed to rename Puppeteer tar', moveResult.stderr);
    process.exit(1);
  }

  return `puppeteer.tgz`;
}

const tar = packPuppeteer();
const tarPath = path.join(process.cwd(), tar);

function compileAndCatchErrors(projectLocation) {
  const { status, stdout, stderr } = spawnSync('npm', ['run', 'compile'], {
    cwd: projectLocation,
    encoding: 'utf-8',
  });
  const tsErrorMesssage = stdout.split('\n');

  if (status === 0) {
    console.error(
      `Running tsc on ${projectLocation} succeeded without triggering the expected errors.`
    );
    console.log(stdout, stderr);
    process.exit(1);
  }

  return {
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
  console.log('===> Clearing left over node_modules to ensure clean slate');
  try {
    fs.rmdirSync(path.join(projectLocation, 'node_modules'), {
      recursive: true,
    });
  } catch (_error) {
    // We don't care if this errors because if it did it's most likely because
    // there was no node_modules folder, which is fine.
  }
  console.log('===> Installing Puppeteer from tar file', tarLocation);
  const { status, stderr, stdout } = spawnSync(
    'npm',
    ['install', tarLocation],
    {
      env: {
        ...process.env,
        PUPPETEER_SKIP_DOWNLOAD: '1',
      },
      cwd: projectLocation,
      encoding: 'utf-8',
    }
  );

  if (status > 0) {
    console.error(
      'Installing the tar file unexpectedly failed',
      stdout,
      stderr
    );
    process.exit(status);
  }
  console.log('===> Running compile to ensure expected errors only.');
  const result = compileAndCatchErrors(projectLocation);
  const expectedErrors = EXPECTED_ERRORS.get(folder) || [];
  if (
    result.tsErrorMesssage.find(
      (line) => line.includes('good.ts') || line.includes('good.js')
    )
  ) {
    console.error(
      `Error for ${projectLocation} contained unexpected failures in good.ts/good.js:\n${result.tsErrorMesssage.join(
        '\n'
      )}`
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
  console.log('===> ✅ Type-checked correctly.');
}

PROJECT_FOLDERS.forEach((folder) => {
  testProject(folder);
});
