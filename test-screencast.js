import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const executablePath = path.join(__dirname, 'test', 'fixtures', 'headless_shell');
  console.log(`Using executable: ${executablePath}`);

  if (!fs.existsSync(executablePath)) {
    console.error(`Executable not found at ${executablePath}`);
    process.exit(1);
  }

  try {
    fs.chmodSync(executablePath, 0o755);
  } catch (err) {
    console.warn(`Could not chmod executable: ${err.message}`);
  }

  const browser = await puppeteer.launch({
    headless: 'shell',
    defaultViewport: null,
    executablePath: executablePath,
    dumpio: true,
  });
  const page = await browser.newPage();
  
  console.log('Navigating to page...');
  await page.goto('https://westonruter.github.io/html5-audio-read-along/');

  // 1. Create CDP Session
  const client = await page.createCDPSession();

  console.log('Resizing page...');
  await page.resize({
    contentHeight: 1400,
    contentWidth: 1600,
  });

  // 2. Start the screen recording
  console.log('Starting screen recording...');
  await client.send('Page.startScreenRecording', {
    maxWidth: 800,
    maxHeight: 700,
    audio: true
  });

  console.log(`Screen recording started.`);

  // 3. Perform some actions to record
  console.log('Waiting 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Resizing page again...');
  await page.resize({
    contentHeight: 700,
    contentWidth: 800,
  });

  console.log('Waiting 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 4. Stop the recording
  console.log('Stopping screen recording...');
  const { stream } = await client.send('Page.stopScreenRecording');
  console.log('Screen recording stopped. Reading stream chunks...');

  // 5. Read the mp4 data via IO.read
  const outputFilename = 'screencast.mp4';
  if (fs.existsSync(outputFilename)) {
    fs.unlinkSync(outputFilename);
  }

  let eof = false;
  while (!eof) {
    const result = await client.send('IO.read', {
      handle: stream,
      size: 1024 * 1024 // 1 MB chunks
    });

    eof = result.eof;
    if (result.data) {
      const buffer = Buffer.from(result.data, result.base64Encoded ? 'base64' : 'utf8');
      fs.appendFileSync(outputFilename, buffer);
    }
  }

  console.log(`Screen recording saved to ${outputFilename}`);

  await client.send('IO.close', { handle: stream });
  await browser.close();
  
  console.log('Test completed successfully.');
})();
