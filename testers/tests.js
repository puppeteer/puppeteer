const { getSummarizedReviews } = require('./reviewmainA');
asy
await getSummarizedReviews("https://www.amazon.in/Lux-Cozi-Cotton-Boxers-8904209873170_COZI_Bigshot_SLP_DRW_90_Assorted/dp/B071GYQ6T2/ref=pd_ci_mcx_mh_mcx_views_1?pd_rd_w=0PgZx&content-id=amzn1.sym.7938e11a-362b-421f-bd30-8dd8d3c4b65f&pf_rd_p=7938e11a-362b-421f-bd30-8dd8d3c4b65f&pf_rd_r=VRVK44VM5RMKEBX1PDW7&pd_rd_wg=Gvm8G&pd_rd_r=2daceaf2-962a-432b-aaac-faaaed91d77b&pd_rd_i=B071GYQ6SY&th=1&psc=1")
  .then((summarized) => {
    console.log(summarized);
  })
  .catch((error) => {
    console.error(error);
  });
