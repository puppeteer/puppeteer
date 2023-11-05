const puppeteer = require('puppeteer');
const Helper = require('./utils/helper');
const config = require('./config/config');
const bConfig = require('./config/browserConfig');
const res = require('./config/Res');



class ReviewScrapper{

static getreviewdataA=async ()=>{
    let [page,browser] = await Helper.createpage();
    page =await Helper.openurl(page,config.SCRAPE.amazon.review_url)
    console.log("scrape")

    await page.click(config.SCRAPE.amazon.button)
    console.log('Wait for 5s..')
    await page.waitForTimeout(5000)
    console.log('done wait for 5s..')
    let reviews;
    let nextpage;
   
    try {
    console.log('Before evaluate')
    do{
      try {
        await page.waitForTimeout(5000)
      } catch (error) {
      console.log('er',error);                  
      }
      // await page.waitForNavigation();
    [reviews,nextpage] = await Helper.getReviewGenA(page,config)
  console.log("revdet",reviews);
  // nextpage = document.getElementsByClassName('a-last');
  console.log(nextpage)
  await page.waitForTimeout(10000)
  // page.waitForSelector('#cm_cr-pagination_bar > ul > li.a-last > a')
  
    if (nextpage == false) {
      break
    }else{
      await page.click('#cm_cr-pagination_bar > ul > li.a-last > a')
    }
  }while ( nextpage ==true);
} catch (error) {
      console.log(error)
}
  console.log("scrape2")
  // console.log(names);
           
    // return [page,browser]      
  }
  static getreviewdataF = async () => {
    console.log("inside getreviewdata function")
    let [page,browser] = await Helper.createpage(); 
    page = await Helper.openurl(page, config.SCRAPE.flipkart.review_url)  // calling openurl

    console.log('before wait 5s');
    await page.waitForTimeout(5000)
    console.log('after wait 5s')

    console.log("Scrapping data.."); 
    // General details
    let review_gendata = await Helper.getReviewGenF(page, config);  // call getReviewGen
    console.log("Review data: General :", review_gendata)
    
    
    // Loop details
    try {
        // await page.click(config.SCRAPE.flipkart.review_filter);
        await page.select(config.SCRAPE.flipkart.review_filter, 'NEGATIVE_FIRST');
        console.log('Before wait of 5s')
        await page.waitForTimeout(5000)
        console.log('After wait')
                    
    } catch (error) {
        console.log(error)
    }
    let flag = true;
    let page_count = 0;
    let review_array=[];
    let review_metadata;
    while (flag) {
        page_count++;
        console.log("PAGE NUMBER:", page_count);
        // let data_array=[];
        [review_metadata,page] = await Helper.getReviewLoopF(page, config); // call  getReviewLoop return one page data(10 obj) 
        // console.log("data length ",review_metadata.length); 
        console.log("Review metadata: ",review_metadata[9]); 
        review_array.push(review_metadata);
        console.log("==========================");
        // console.log("Review data: General :", review_array);

        if(page_count > 1){
            flag = false;
        }
        else{
            console.log("next page..");            
            


        }
    }
    console.log("Review data: General :", review_array);

  }
   
}

module.exports = ReviewScrapper;