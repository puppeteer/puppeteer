const fetch = require('node-fetch');
const ReviewScraper = require('./ReviewScrapperA');

async function summarize(url) {
  const reviews = await ReviewScraper.getreviewdataA(url);
  const response = await fetch(
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
    {
      headers: { Authorization: "Bearer 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" },
      method: "POST",
      body: JSON.stringify({
        inputs: reviews,
        options: {
          max_length: 400,
          min_length: 200,
          do_sample: false,
        },
      }),
    }
  );
  const result = await response.json();
  return result;
}


module.exports = { summarize };