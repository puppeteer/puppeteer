const http = require('http');
const fs = require('fs');

// Check if a URL argument is provided
if (process.argv.length < 3) {
  console.log('Usage: node downloadImage.js <URL>');
  process.exit(1);
}

const imageUrl = process.argv[2]; // Get the URL from the command-line argument
const imageFileName = 'image.jpg'; // You can specify your desired local file name here

http.get(imageUrl, (response) => {
  const fileStream = fs.createWriteStream(imageFileName);

  response.on('data', (chunk) => {
    fileStream.write(chunk);
  });

  response.on('end', () => {
    fileStream.end();
    console.log(`Downloaded: ${imageFileName}`);
  });
});
