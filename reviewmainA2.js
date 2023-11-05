const fetch = require('node-fetch');
const ReviewScraper = require('./ReviewScrapperA2');
let url ='https://www.amazon.in/Ferrero-78205-Rocher-16-Pieces/dp/B00BYQEIL6/ref=sr_1_2_sspa?keywords=ferrero+rocher&sr=8-2-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1'
const reviews =  ReviewScraper.getreviewdataA(url);
console.log(reviews);
// async function summarize2(url) {
//   const reviews = await ReviewScraper.getreviewdataA(url);
//   const response = await fetch(
//     "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
//     {
//       headers: { Authorization: "Bearer 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" },
//       method: "POST",
//       body: JSON.stringify({
//         inputs: reviews,
//         options: {
//           max_length: 400,
//           min_length: 200,
//           do_sample: false,
//         },
//       }),
//     }
//   );
//   const result = await response.json();
//   return result;
// }


// module.exports = { summarize2 };