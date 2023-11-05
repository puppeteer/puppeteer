const puppeteer = require('puppeteer');
//
async function scrapeAmazonProductPage(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  // Get the product description
  const description = await page.$eval('#productDescription', (element) =>
    element.textContent.trim()
  );

  // Get the product price
  const price = await page.$eval('#priceblock_ourprice', (element) =>
    element.textContent.trim()
  );

  // Scrape the first two pages of 5-star reviews
  const fiveStarReviews = await scrapeReviews(
    page,
    '#reviews-medley-footer .a-link-emphasis[href*="filter="]',
    '5',
    2
  );

  // Scrape the first two pages of 4-star reviews
  const fourStarReviews = await scrapeReviews(
    page,
    '#reviews-medley-footer .a-link-emphasis[href*="filter=4"]',
    '4',
    2
  );

  // Scrape the first two pages of 2-star reviews
  const twoStarReviews = await scrapeReviews(
    page,
    '#reviews-medley-footer .a-link-emphasis[href*="filter=2"]',
    '2',
    2
  );

  await browser.close();

  return {
    description,
    price,
    fiveStarReviews,
    fourStarReviews,
    twoStarReviews,
  };
}

async function scrapeReviews(page, selector, rating, pages) {
  // Click the "See all {rating}-star reviews" link
  await page.click(selector);

  // Wait for the reviews to load
  await page.waitForSelector('#cm-cr-dp-review-list');

  let reviews = [];

  // Scrape the reviews from each page
  for (let i = 0; i < pages; i++) {
    // Get the reviews on the current page
    const pageReviews = await page.$$eval(
      `#cm-cr-dp-review-list[data-hook="review"] .a-section[data-hook="review"] .a-row[data-hook="review"] .a-section[data-hook="review"] .review-data`,
      (elements) => elements.map((element) => element.textContent.trim())
    );

    // Add the current page's reviews to the array of all reviews
    reviews.push(...pageReviews);

    // Click the "Next" button to load the next page of reviews
    const nextButton = await page.$(
      '#cm_cr-pagination_bar .a-pagination .a-last a'
    );

    if (nextButton) {
      await Promise.all([page.waitForNavigation(), nextButton.click()]);
    } else {
      break;
    }
  }

  return reviews;
}

// Example usage:
scrapeAmazonProductPage('https://www.amazon.com/dp/B08V7FMPKN').then((data) =>
  console.log(data)
);
