const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the website
  await page.goto('https://www.amazon.in/Ferrero-78205-Rocher-16-Pieces/dp/B00BYQEIL6/ref=sr_1_2_sspa?keywords=ferrero+rocher&sr=8-2-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1')  // Extract image URLs from the page
  const imageUrls = await page.$$eval('img', (images) =>
    images.map((img) => img.src)
  );

  // Create a directory to save the images
  const downloadDir = path.join(__dirname, 'downloaded_images');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  // Download and save each image
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const imageFileName = path.join(downloadDir, `image_${i}.jpg`);

    // Use Axios to download the image
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
    });

    // Pipe the image data to a file
    response.data.pipe(fs.createWriteStream(imageFileName));

    console.log(`Downloaded: ${imageFileName}`);
  }

  await browser.close();
})();
