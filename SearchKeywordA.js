const puppeteer = require('puppeteer');
const Helper = require('./utils/helper');
const config = require('./config/config');
const bConfig = require('./config/browserConfig');
const res = require('./config/Res');
const PlatformWorker =  require('./workers/PlatformWorker');
const ProductMetaWorker =  require('./workers/ProductMetaWorker');
const ProductDetailsWorker = require('./workers/ProductDetailsWorker');




class SearchKeywordA{
    static  getSearchResult = async (platform,keyword,page,browser,keyword_id) => {
                // await page.goto(config.SCRAPE.amazon.URL);
                page =await Helper.openurl(page,config.SCRAPE.amazon.Url);
                // try {
                //   await page.type(config.SCRAPE.amazon.searchbar,String(keyword),{delay: 100});  
                // } catch (error) {
                  
                // }
                // console.log('Before wait')
                // await page.waitForTimeout (5000);
                // console.log('after wait')
                // try {
                //   await page.click(config.SCRAPE.amazon.searchBtn)  
                // } catch (error) {
                //   console.log("error in clicking search button",error);
                // }
                // try {
                //     await page.waitForNavigation         
                // } catch (error) {
                //     console.log("nav error")
                // }
                // try {
                  // console.log("type function congig btn",config.SCRAPE.amazon)
                  // console.log("type function congig bar",config.SCRAPE.amazon.searchbar)
                  console.log('selector.searchBar',config.SCRAPE.amazon.searchbar);
                page = await Helper.typeKey(page,config.SCRAPE.amazon,keyword); 
 
                // } catch (error) {
                //   console.log('t',error)
                // }
                
                await page.waitForTimeout(5000);
                let itr=0;
                let itrLimit =3;
                let itrFlag = true;
                let ogprice
                let temparr = []
                let bulkInsertArr =[]
                while(itrFlag){
                  try {
                    await page.waitForTimeout(5000);
                    console.log('####################################')
                    console.log('Page No: ',itr)
                    console.log('####################################')
                    let metadata = await Helper.getmetaDataA(page,config)
                    // console.log('productinfo: ',productinfo);
                    for(let i=0; i< metadata.length; i++){
                      temparr.push(keyword_id)
                      temparr.push(metadata[i].prod_link)
                      temparr.push(metadata[i].productname)
                      temparr.push(metadata[i].productname)
                      temparr.push(metadata[i].ogprice)
                      temparr.push(metadata[i].price)
                      temparr.push(metadata[i].imagelink)
                      // imgarr.push(metadata[i].imagelink)
                      // console.log(temparr)
                      bulkInsertArr.push(temparr);
                      temparr=[]
                      // console.log(bulkInsertArr);
                  }
                    // console.log("",bulkInsertArr)

                    itr++;
                    if(itr==itrLimit){
                      itrFlag=false;
                      console.log("changing to false",itrFlag);
                    }else{
                      try{
                        console.log("nextpage");
                        await page.click(config.SCRAPE.amazon.nextbtn);
                        
                      }catch(e){
                        console.log('Error in next click');
                        itrFlag=false;
                      }
                    }
                    
                    
                    
                    
                  } catch (error) {
                    console.log(error);
                  }

                }
                return bulkInsertArr;

        }

     static main = async () =>{

     }   
    
  
    // static run = async () => {
    //   let platform_id = await PlatformWorker.getPlatformId('amazon');
    //   let keywords = await ProductMetaWorker.getkeywordsAmazon('A');
    //   console.log("keywords:",keywords)
    //   // console.log("id:",Object.values(keywords[0]))
    //   let key = keywords.map(({id,name})=>(name));
    //   let id = keywords.map(({id,name})=>(id));
    //   console.log(id)
    //   await ProductMetaWorker.bulkupdateStatusByIdsAmazon('O',id)
    //   let keyidarr = []
    //   for(let i=0; i< key.length; i++){
    //     // let key = key[i].name
    //     console.log("key:",key)
    //     // let id = keywords[i].id
    //     // keyidarr.push(id)
    //     await this.getSearchResult(platform_id,key[i])
    //   }
    //   // await ProductMetaWorker.bulkupdateStatusByIdsAmazon(O,keyidarr)
      
    // }//main file create and run willl call it 
    
    static run = async () => {
      let runcount = 0;
      let flag = true;
      let keywords;
      let platform_id = await PlatformWorker.getPlatformId('amazon'); // get platform_id
      console.log('platform_id', platform_id)
      while (flag) {
        runcount++;
        console.log('runcount:', runcount)
        
        try {
          keywords = await ProductMetaWorker.getkeywordsAmazon('A');  // get keywords
          console.log("keywords:",keywords)
          let key = keywords.map(({id,name})=>(name));
          let ids = keywords.map(({id,name})=>(id));
          console.log('key',key);
          console.log('ids',ids);
          let bulkarray = []
          if (keywords.length == 0) {
            console.log('sleeping for 1 minutes')
            Thread.sleep(60000);          
          } else {
            let [page,browser] = await Helper.createpage();
            for (let index = 0; index < keywords.length; index++) {
             bulkarray=  await this.getSearchResult(platform_id,key[index],page,browser,ids[index]); 
             console.log("final array to push,",bulkarray); 
             await ProductDetailsWorker.insertDetailsBulk(bulkarray)
            }
             // call main
          } 
        }catch (error) {
          console.log(error.stack);
          throw error;
        }
        flag = false; // temp
      
    }
  }
  }





module.exports = SearchKeywordA;
