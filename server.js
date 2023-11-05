const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ReviewScraper = require('./ReviewScrapperA');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.post('/api/reviews', async (req, res) => {
  try {
    const url = req.body.url;
    const reviews = await ReviewScraper.getreviewdataA(url);
    res.status(200).json({ reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}!`));
