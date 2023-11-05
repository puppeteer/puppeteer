const http = require('http');
const fs = require('fs');

const imageUrl = 'https://www.amazon.in/Ferrero-78205-Rocher-16-Pieces/dp/B00BYQEIL6/ref=sr_1_2_sspa?keywords=ferrero+rocher&sr=8-2-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1'
const imageFileName = 'image.jpg'; // Replace with the desired file name

const fileStream = fs.createWriteStream(imageFileName);

const request = http.get(imageUrl, (response) => {
  response.on('data', (chunk) => {
    fileStream.write(chunk);
  });

  response.on('end', () => {
    fileStream.end();
    console.log(`Downloaded: ${imageFileName}`);
  });

  response.on('error', (error) => {
    console.error('Error downloading image:', error);
  });
});

request.on('error', (error) => {
  console.error('Error making the request:', error);
});

fileStream.on('error', (error) => {
  console.error('Error writing to the file:', error);
});
