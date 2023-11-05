const puppeteer = require('puppeteer');
const Helper = require('./utils/helper');
const config = require('./config/config');
const bConfig = require('./config/browserConfig');
const res = require('./config/Res');
const ProductDetailsWorker =  require('./workers/ProductDetailsWorker');


class ProductMeta{
        static getproductdataA = async (url,page,browser)=> {
            // let [page,browser] = await Helper.createpage();
            page =await Helper.openurl(page,config.SCRAPE.amazon.product_url);
            console.log("assemblytest",config.SCRAPE.amazon.product_url)
            console.log("assemblytest",url) 
            // page.waitForNavigation()
            console.log("scrape")
            await page.click(config.SCRAPE.amazon.widget);
            await page.waitForSelector(config.SCRAPE.amazon.showmore);
            await page.click(config.SCRAPE.amazon.showmore);
            await page.waitForNavigation;
            let names;
              console.log("before")
              await page.waitForTimeout(5000);
              console.log("after")
            try {
              await page.waitForNavigation;
              console.log("before")
              await page.waitForTimeout(5000);
              console.log("after")
              await page.waitForSelector(config.SCRAPE.amazon.merchantselector)
              names = await Helper.getProductmetaA(page,config);
              console.log("names",names);
           
          } catch (error) {
              
        }
          console.log("scrape2")
          // console.log("names",names);
                   
            // return [page,browser]      
        }
        static main = async () =>{
          // let url = await ProductDetailsWorker.getProductUrls(1)
          let url = ['https://www.amazon.in/Ferrero-78205-Rocher-16-Pieces/dp/B00BYQEIL6/ref=sr_1_2_sspa?keywords=ferrero+rocher&sr=8-2-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1']
          let urlarray = url.map(({url})=>(url));
          console.log(urlarray)
          let [page,browser] = await Helper.createpage();
          for (let index = 0; index < urlarray.length; index++) {
            console.log(urlarray[index]);
            await this.getproductdataA(urlarray[index],page,browser);
            await ProductDetailsWorker.updateDetailsBulk()

          }

        }
               
      }

 module.exports = ProductMeta

 