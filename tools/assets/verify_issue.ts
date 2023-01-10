import {spawnSync} from 'child_process';
import {readFile, writeFile} from 'fs/promises';

(async () => {
  const error = await readFile('puppeteer-error.txt', 'utf-8');
  const behavior = JSON.parse(
    await readFile('puppeteer-behavior.json', 'utf-8')
  ) as {flaky?: boolean; noError?: boolean};

  let maxRepetitions = 1;
  if (behavior.flaky) {
    maxRepetitions = 100;
  }

  let status: number | null = null;
  let stderr = '';
  let stdout = '';

  const preHook = async () => {
    console.log('Writing output and error logs...');
    await Promise.all([
      writeFile('output.log', stdout),
      writeFile('error.log', stderr),
    ]);
  };

  let checkStatusWithError: () => Promise<void>;
  if (behavior.noError) {
    checkStatusWithError = async () => {
      if (status === 0) {
        await preHook();
        console.log('Script ran successfully; no error found.');
        process.exit(0);
      }
    };
  } else {
    checkStatusWithError = async () => {
      if (status !== 0) {
        await preHook();
        if (stderr.toLowerCase().includes(error.toLowerCase())) {
          console.log('Script failed; error found.');
          process.exit(0);
        }
        console.error('Script failed; unknown error found.');
        process.exit(1);
      }
    };
  }

  for (let i = 0; i < maxRepetitions; ++i) {
    const result = spawnSync('npm', ['start'], {
      shell: true,
      encoding: 'utf-8',
    });
    status = result.status;
    stdout = result.stdout ?? '';
    stderr = result.stderr ?? '';
    await checkStatusWithError();
  }

  await preHook();
  if (behavior.noError) {
    console.error('Script failed; unknown error found.');
  } else {
    console.error('Script ran successfully; no error found.');
  }
  process.exit(1);
})();
