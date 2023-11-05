const form = document.querySelector('#review-form');
const reviewsDiv = document.querySelector('#reviews');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const urlInput = form.elements.url;
  const reviewUrl = urlInput.value;
  
  // Call the API to scrape reviews using the reviewUrl
  
  const response = await fetch('/scrape-reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: reviewUrl })
  });
  
  const reviews = await response.json();
  
  // Render the reviews on the page
  
  let reviewsHtml = '';
  
  reviews.forEach(review => {
    reviewsHtml += `<div>
                      <h2>${review.title}</h2>
                      <p>${review.text}</p>
                    </div>`;
  });
  
  reviewsDiv.innerHTML = reviewsHtml;
});
