const puppeteer = require('puppeteer');
const Helper = require('./utils/helper');
const config = require('./config/config');
const bConfig = require('./config/browserConfig');
const res = require('./config/Res');
const ProductDetailsWorker = require('./workers/ProductDetailsWorker')


class ProductMetaF{

        static getproductdata = async (platform_id) => {
          console.log('platform_id', platform_id)
          let productUrlArr = await ProductDetailsWorker.getProductUrls(platform_id);
          console.log('productUrlArr', productUrlArr)


          // console.log("inside getKeydata function")
          // for(let i=0; i < productUrlArr.lenght; i++){
          //   let [page,browser] = await Helper.createpage(); 
          //   page = await Helper.openurl(page, productUrlArr[i])  // calling openurl
          //   // page = await Helper.openurl(page, config.SCRAPE.flipkart.product_urlspec)  // calling openurl
    
          //   console.log('before wait 5s');
          //   await page.waitForTimeout(5000)
          //   console.log('after wait 5s')
    
          //   console.log("Scrapping data..");
          //   let product_data = await Helper.getProductmetaF(page, config); // calling function getProductmeta
          //   console.log("PRODUCT DATA :", product_data)
          //   // await Helper.getSeller(page, config);
          //   console.log('before wait 5s');
          //   await page.waitForTimeout(5000)
          //   console.log('after wait 5s')
          //   /* OTHER SELLER DETAILS */
          //   let seller_data = await Helper.getSellerF(page, config); // calling function getSellerF
          //   console.log("done seller_data :", seller_data)
          // }

        }
          
               
      }

 module.exports = ProductMetaF

 