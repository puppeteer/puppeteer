const puppeteer = require('puppeteer');
const bConfig = require('../config/browserConfig');
const userAgents = require('../config/userAgents')
const res = require('../config/Res');
const { config } = require('../database/database');
class Helper {

    static getResolution = () => {
        let maxlengthres = res.length
        // function randomIntFromInterval(min, max) { return Math.floor(Math.random() * (max - min + 1) + min)}
        let randomresindex = this.randomIntFromInterval(0,maxlengthres);
        let resolution = res[randomresindex]
        return resolution
    }
    static openurl = async(page,url) => {
        try {
            
            await page.goto(url,{
                waitUntil: 'networkidle2',
            });
            // await page.waitForNavigation()
        } catch (error) {
            console.log(error.message)
        }
        return page
    }
    static getuseragent = () => {
        let maxlengthua = userAgents.length
        let randomuserindex = this.randomIntFromInterval(0,maxlengthua);          
        let UA = userAgents[randomuserindex];
        return UA
    }
    static getProfiledBrowser = async (executabePath) => {
       
      // let bres = res[randomresindex];
      let options = {
          headless: bConfig.headless,
          timeout: 15000,
          ignoreHTTPSErrors: true,
          executablePath: executabePath,
          args: [
              "--no-sandbox",
              "--start-maximized",
              "--disable-infobars",
              "--disable-popup-blocking",
              "--disable-dev-shm-usage",
              "--disable-notifications",
              "--remote-debugging-port=9222",
              "--disable-web-security",
              // `--user-data-dir=${userDataDir}`
          ],
          ignoreDefaultArgs: ["--enable-automation"],
          //defaultViewport: null,
          // userAgent: UA


      }
      const browser = await puppeteer.launch(options);

      return browser;
    } 
    static  createpage = async () =>{
        let LoopCondition = true;
        let executablePath =bConfig.executablePath;
        // let useDataDir = bConfig.useDataDir;
        let browser = await this.getProfiledBrowser(executablePath);
        let userAgent = await this.getuseragent();
        console.log("res",userAgent);
        let res = await this.getResolution();
        console.log("res",res);
        let page = await browser.newPage();
        await page.setUserAgent(userAgent);
        await page.setViewport(res);
        let tabs = await browser.pages();
            if (tabs.length > 1) {
                tabs[0].close()
            }
        //await page.goto(config.SCRAPE.amazon.URL);
        return [page,browser];
      
      
    }
    static async getmetaDataA(page,config){
        try {
            let seltor = config.SCRAPE.amazon.prod_name;
            let temparr =[]
            let bulkInsertArr = []
            let productinfo =  await page.evaluate((config,seltor) =>{
                let detarray = []
                
                let parent = document.getElementsByClassName(config.SCRAPE.amazon.parentclass);
                console.log('parent.length:',parent.length);
                let productnamejson
                for (let scrapeindex = 0; scrapeindex < parent.length; scrapeindex++) {
                  try {
                    productnamejson =  parent[scrapeindex].getElementsByClassName(seltor)[0].textContent; 
                    console.log('p1',productnamejson) 
                  } catch (error) {console.log(error);}
                  try{
                    pricejson =  parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.mrp)[0].textContent;  
                    console.log('price',pricejson);
                  }catch(e){}
                  try{
                    ogprice = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.sale_price)[0].innerText;
                  }catch(e){
                    console.log('eee',e)
                  }
                  
                  try{
                    imagelink = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.Img)[0].srcset;
                    imagelinkarray = imagelink.split(' ')
                    imagelink = imagelinkarray[imagelinkarray.length-2]
                  }catch(e){console.log("error in images",e);}
      
                  let reviewscore
                  try {
                    reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.rate_score)[0].innerText;
                  } catch (error) {
                      console.log('rs',reviewscore)
                  }
                  let rnos;
                  try{
                    rnos = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revnos)[0].innerText
                  }catch(e){
                    console.log("rnos",rnos);
                  }
                  let prod_link
                  try {
                    prod_link = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.prod_link)[0].href
                  } catch (error) {
                    
                  }
      
                  console.log('IMG',imagelink)
                  console.log('r',reviewscore)
                  
                  detjson = {
                    price:pricejson,
                    ogprice:ogprice,
                    imagelink:imagelink,
                    reviewscore:reviewscore,
                    reviewnos:rnos,
                    productname:productnamejson,
                    prod_link:prod_link,
                  }
                  detarray.push(detjson)
                }
                console.log("detarray",detarray)
                return detarray
              },config,seltor)
              console.log('PI',productinfo)
              for(let i=0; i< productinfo.length; i++){
                temparr.push(productinfo[i].prod_link)
                temparr.push(productinfo[i].productname)
                temparr.push(productinfo[i].productname)
                temparr.push(productinfo[i].ogprice)
                temparr.push(productinfo[i].price)
                // imgarr.push(metadata[i].imagelink)
                // console.log(temparr)
                bulkInsertArr.push(temparr);
                temparr=[]
                // console.log(bulkInsertArr);
              }
              return productinfo;
            //   console.log(bulkInsertArr);
        } catch (error) {
            console.log("error",error)
            
        }

    }
    static async getmetaDataF(page, config){
      try {
          // let meta_array=[];
          let metadata = await page.evaluate(async (page,config) => {
              let meta_array=[];
              let details;
              let index;
              let prod_name;
              let description;
              let mrp;
              let sale_price;
              let assured;
              let img;
              let prod;
              let desc;
              let op;
              let sp;
              let asr;
              let images;
              let href_link;
              let obj;
              
              console.log("details", config.SCRAPE.flipkart.detail[0].parentclass);
              details = document.getElementsByClassName(config.SCRAPE.flipkart.detail[0].parentclass) // specification
              if (details.length != 0) { // SPECIFICATION
                  index = 0; 
                  
              } else {        // PRODUCT DET
                  details = document.getElementsByClassName(config.SCRAPE.flipkart.detail[1].parentclass)
                  index = 1;
              }
              try{
                  prod_name = document.getElementsByClassName(config.SCRAPE.flipkart.detail[index].prod_name);
              }catch(e){
                  console.log(error)
              }
              try{
                  description = document.getElementsByClassName(config.SCRAPE.flipkart.detail[index].description); 
              }catch(e){
                  console.log(error)
              }
              try{
                  mrp = document.getElementsByClassName(config.SCRAPE.flipkart.detail[index].mrp);
              }catch(e){
                  console.log(error)
              }
              // mrp = document.getElementsByClassName(config.SCRAPE.flipkart.mrp);
              // console.log("sel 1:", config.SCRAPE.flipkart.mrp);
              try {
                  sale_price = document.getElementsByClassName(config.SCRAPE.flipkart.detail[index].sale_price);                    
              } catch (error) {
                  console.log(error)
              }
              
              try {
                  assured = document.querySelectorAll(config.SCRAPE.flipkart.detail[index].assured);        
              } catch (error) {
                  console.log(error)
              }
              
              // assured = document.getElementsByClassName(config.SCRAPE.flipkart.assured);
              try{
                  img = document.getElementsByClassName(config.SCRAPE.flipkart.detail[index].img);
              }catch(error){
                  console.log(error)
              }
              
              console.log(prod_name);
              console.log(description);
              console.log(mrp);
              console.log(sale_price);
              console.log(assured);
              console.log(details.length)
              for (let i =0; i < details.length; i++){
                console.log(i)
                  try {
                      //obj 1 till 40
                      try {
                          prod = prod_name[i].textContent;
                      } catch (error) {
                          prod = "undefined";
                      }
                      try {
                          desc = description[i].textContent;
                      } catch (error) {
                          desc = "undefined";
                      }                        
                      try {
                          op = mrp[i].textContent;
                      } catch (error) {
                          op = "undefined";
                      }
                      try {
                          sp = sale_price[i].textContent;
                      } catch (error) {
                          sp = "undefined";
                      }
                      
                      try {
                          asr = assured[i].currentSrc;
                          asr = true;
                      } catch (error) {
                          asr = false;
                      }
                      try {
                          images = img[i].src;
                      } catch (error) {
                          images = "undefined";
                      }
                      try {
                          href_link = prod_name[i].href;
                      } catch (error) {
                          href_link = "undefined";
                      }
                      // let asr = assured[i].src
                      
                      
                      // console.log("href :", href_link);
                      obj = {
                        prod_link : href_link,
                          prod_name : prod,
                          description : desc,
                          original_price : op, 
                          sale_price : sp,
                          assurance : asr,
                          images : images,
                      }
                      console.log("object:",obj)
                        // console.log("meta array length: ", meta_array.length);
                                         
                      meta_array.push(obj)
                      // obj = {}

                      
                  } catch (error) {
                      console.log(error)
                  }
              }
              console.log("meta_array: ",meta_array);
              return meta_array;
          },page,config)
          // console.log("metadata",metadata)
          return metadata;
      } catch (e) {
          console.log(e);
      }

    }//flipkart//dv/
    static async getProductmetaA(page,config){
        try {
            let names =  await page.evaluate(async (config) =>{
                let productdetails;
                let asin;
                let manufactuerer
                try {
                    productdetails = document.getElementById(config.SCRAPE.amazon.proddetails).innerText;
                    console.log(productdetails)
                      
                } catch (error) {
                  productdetails = document.querySelectorAll('#detailBullets_feature_div')[0].innerText
                  
                 console.log(error);   
                }
                  asin = productdetails.split('Manufacturer')[1].split('\n')[0].replace('\t','').replace(':','')
                  manufactuerer = productdetails.split('Manufacturer')[1].split('\n')[0].replace('\t','')
                  sellor = [document.getElementById(config.SCRAPE.amazon.bylineInfo).href,
                  document.getElementById(config.SCRAPE.amazon.bylineInfo).innerHTML]
                  console.log(sellor)
                  let sellerarray = []
                  let sellers = document.getElementsByClassName(config.SCRAPE.amazon.merc)
                  console.log('sellers:ss ',sellers)
                  console.log('sl',sellers.length);
                  let seller;
                  for (let index = 0; index < sellers.length; index++) {
                    try{
                      console.log('index: ',index)
                      seller = document.getElementsByClassName('mbcMerchantName')[index].textContent
                      console.log(seller);
                      sellerarray.push(seller)
                    }catch(e){
                      console.log('Error: ',e)
                    }
                  }
            
                  console.log('SA',sellerarray)
                  console.log("before")
                  // page.waitForTimeout(5000);
                  console.log("after")
                  revgraph = document.getElementsByClassName(config.SCRAPE.amazon.rate_distribution)
                  console.log(revgraph);
                  let revarray = []
                  for (let index = 0; index < revgraph.length; index++) {
                    revarray.push(document.getElementsByClassName(config.SCRAPE.amazon.rate_distribution)[index].innerText)
                    // console.log(revarray)
                  }
                  
                  console.log(revarray)
                  // page.waitForTimeout(5000);
                  console.log("after")
                 images = document.querySelectorAll(config.SCRAPE.amazon.img_link)
                 let imagearray = [] 
                 for (let index = 0; index < images.length; index++) {
                 imagearray.push(images[index].src);     
                 }  
                 console.log("imgs",imagearray);
                let moresellers = document.querySelectorAll(config.SCRAPE.amazon.moresellers);
                let moresellerlength = moresellers.length;
                console.log(moresellerlength)
                let price;
                let ratings;
                let othersellers;
                // page.waitForTimeout(5000);
                let sellerlinklist;
                let sellerlink;
                let sellerstar;
                let othersellerdetailsjson;
                let othersellerarray=[]
                let shippername
                let sellername
                try{
                for (let sellerindex = 0; sellerindex < moresellerlength; sellerindex++) {
                  othersellers = document.querySelectorAll(config.SCRAPE.amazon.moresellers)[sellerindex];
                  console.log("seller",othersellers);
                  price = othersellers.getElementsByClassName(config.SCRAPE.amazon.moresellersprice)[0].textContent;
                  console.log("price",price);
                  ratings  = othersellers.querySelectorAll(config.SCRAPE.amazon.moresellersrating)[0].textContent
                  console.log("ratings",ratings);
                  details = othersellers.innerText;
                  shippername = othersellers.querySelectorAll(config.SCRAPE.amazon.moresellersshipper)[0].textContent
                  console.log("det",details);
                  sellerlinklist = othersellers.getElementsByClassName(config.SCRAPE.amazon.moresellerslink);
                  sellerlink = sellerlinklist[sellerlinklist.length-1].href
                  console.log("sl",sellerlink)
                  sellerstar = othersellers.querySelectorAll(config.SCRAPE.amazon.seller_rate)[0].outerHTML
                  sellerstar = sellerstar.replace('<i class="a-icon a-icon-star-mini a-star-mini-','')
                  sellerstar = sellerstar.replace(' aod-seller-rating-count-class"></i>','')
                  sellerstar = sellerstar.replace('-','.')
                  sellerrname = othersellers.querySelectorAll(config.SCRAPE.amazon.moresellersname)[0].textContent
                  console.log("sellerstar",sellerstar)
                  othersellerdetailsjson={
                    price:price,
                    ratings:ratings,
                    details:details,
                    sellerlink:sellerlink,
                    sellerstar:sellerstar,
                    shippername:shippername,
                    sellername:sellername
                  }
                  othersellerarray.push(othersellerdetailsjson);
                }}catch(e){
                  console.log("error",e)
                }
                let mainrating
                let mainseller
                let mainsellerlink
                let mainstar
                let mainsellername
                let shipinfo
                
                try{
                  
                    mainseller = document.querySelectorAll(config.SCRAPE.amazon.mainseller)[0];
                    shipinfo =mainseller.querySelector(config.SCRAPE.amazon.mainsellershipinfo).textContent;
                    mainsellername =mainseller.querySelector(config.SCRAPE.amazon.seller).textContent;
                    mainsellerlink =mainseller.querySelector(config.SCRAPE.amazon.seller).href;
                    mainrating = mainseller.querySelector(config.SCRAPE.amazon.mainsellerrating).textContent;
                    mainstar = mainseller.querySelector(config.SCRAPE.amazon.seller_rate).outerHTML;
                    console.log("ms",mainstar);
                    mainsellerdetailsjson = {
                      shipinfo:shipinfo,
                      mainsellername:mainsellername,
                      mainsellerlink:mainsellerlink,
                      mainrating:mainrating,
                      mainstar:mainstar
                    }
                    
                  }catch(e){
                    console.log("error",e)
                  }
            
                let  totalreviews={  
                 productdetails:productdetails,asin:asin,
                 sellers:sellerarray,
                 reviews:revarray,
                 images:imagearray,
                 mainseller:mainsellerdetailsjson,
                 othersellerarray:othersellerarray,
                 review_link:''
            
                }
            
                // page.goto(reviewlink);
                
                // page.click(button);
                return totalreviews;
                },config)
                // console.log("names",names);
                return names;
        } catch (error) {
            console.log("error in function",error)
            
        }
    }
    static async getProductmetaF(page, config){
      try {
          let data = await page.evaluate(async (page,config) => {
              let product_details;
              // let descript;
              // let base_price;
              // let discount_price;
              let img_link;
              let rate_score;
              let rate_review;
              let seller;
              let seller_rating;
              let review_link;
              let specification;
              let manufacturer_arr = [];
              let generic_details;
              let manufact_details;
              let detail_info;
              // let assured;
              try{
                  img_link = document.getElementsByClassName(config.SCRAPE.flipkart.img_link); //array of 7
                  console.log("image :", img_link);
              }catch(error){}
              try{
                  rate_score = document.getElementsByClassName(config.SCRAPE.flipkart.rate_score);
              }catch(error){
                  console.log(error);
              }
              try{
                  rate_review = document.getElementsByClassName(config.SCRAPE.flipkart.rate_review);
              }catch(error){
                  console.log(error);
              }
              try{
                  seller = document.querySelectorAll(config.SCRAPE.flipkart.seller); 
              }catch(error){
                  console.log(error);
              }
              try{
                  seller_rating = document.getElementsByClassName(config.SCRAPE.flipkart.seller_rating);
              }catch(error){
                  console.log(error);
              }
              try{
                  review_link = document.querySelectorAll(config.SCRAPE.flipkart.review_link);
              }catch(error){
                  console.log("not more than 3 reviews")
              }
              try {
                  specification = document.getElementsByClassName(config.SCRAPE.flipkart.specification);                
              } catch (error) {
                  console.log('specification selector not found')
              }
              try{
                  product_details = document.getElementsByClassName(config.SCRAPE.flipkart.product_details);
              }catch(e){
                  console.log('prod selector not found');
              }
              try{
                  generic_details = document.getElementsByClassName(config.SCRAPE.flipkart.generic_details);
              }catch(e){
                  console.log(error);
              }
              try{
                  manufact_details = document.getElementsByClassName(config.SCRAPE.flipkart.manufact_details);
              }catch(e){
                  console.log(error);
              }
              try{
                  detail_info = document.getElementsByClassName(config.SCRAPE.flipkart.detail_info);
              }catch(e){
                  console.log(error);
              }
              try{
                  manufact_closebtn = document.getElementsByClassName(config.SCRAPE.flipkart.manufact_closebtn);
              }catch(e){
                  console.log(error);
              }
              // try{
              //     other_sellers = document.getElementsByClassName(config.SCRAPE.flipkart.other_sellers);
              // }catch(e){
              //     console.log(error);
              // }        
              
              console.log("SELETORS FOUND")
  
  
              // // try {
              //     assured = document.querySelectorAll(config.SCRAPE.flipkart.assured);        
              // } catch (error) {assured = false}
                  
              let image_arr = [];
              for (let i=0; i < img_link.length; i++){
                  image_arr.push(img_link[i].src);
              }
              console.log("image :", image_arr);
              let rating = rate_score[0].textContent;
              console.log("rate_score :", rating);
              let rate_rev = rate_review[0].textContent;
              console.log("rate_review :", rate_rev);
              let sel_nm = seller[0].textContent;
              console.log("selnm :", sel_nm);
              let sel_rate = seller_rating[0].textContent;
              console.log("sel rate: ",sel_rate);
              let rlink = review_link[0].href;
              console.log("rev link: ", rlink);
              
              /*specifiaction*/
              specific_det = [];
              try {
                  // specific_det = [];
                  for(let i= 0 ; i< specification.length ;i++){
                      let detail = specification[i].innerText;
                      specific_det.push(detail);
                  }
                  console.log(specific_det);
                  // click read more
                  read_more = document.getElementsByClassName(config.SCRAPE.flipkart.read_more);
                  read_more[0].click();
                  // click manufact,product,import info
                  specif_manucfacturer = document.getElementsByClassName(config.SCRAPE.flipkart.specif_manucfacturer);
                  specif_manucfacturer[0].click();
              } catch (error) {
                  specific_det = 'undefined';
              }
              console.log("specific_det", specific_det);
              
              /*product details*/
              let prod_det;
              try {
                  prod_det = product_details[0].innerText;
                  // click manufact,product,import info
                  product_manufacturer = document.querySelectorAll(config.SCRAPE.flipkart.product_manufacturer);
                  product_manufacturer[0].click();
                  
              } catch (error) {
                  prod_det = 'undefined';
              }
              console.log("prod_details", prod_det );
              
              // let specif_manucfacturer;
              // try{
              //     specif_manucfacturer = document.getElementsByClassName(config.SCRAPE.flipkart.specif_manucfacturer);
              //     console.log("click selector:", specif_manucfacturer);
              //     specif_manucfacturer[0].click();
              // }catch(e){
              //     console.log(e); }
              
              let generic_det = generic_details[0].innerText;  // fetch generic det
              // let manufact_det = [];
              manufacturer_arr.push(generic_det);
              for(let i=0; i < manufact_details.length; i++){  // fetch manufact,product,import info
                  let category = manufact_details[i].innerText;
                  let cat_info = detail_info[0].innerText;
                  let manufact_obj = {
                      // category : cat_info
                  }
                  manufact_obj[category] = cat_info
                  console.log(manufact_obj)
                  manufacturer_arr.push(manufact_obj);
                  let clk = 1 // variable for click
                  try {
                      manufact_details[clk].click(); 
                      clk++;
                  } catch (error) {
                      console.log("no more elements")
                  }
              }
              // manufacturer_arr.push(generic_det, manufact_det);
              // close manufact,product,import 
              try {
                  manufact_closebtn[0].click();
              } catch (error) {
              }
              // click other sellers
              // try {
              //     other_sellers[0].click();
              //     console.log('Before wait')
              //     // await page.waitForSelector(seller_name)
              //     console.log('After click')
              
              // } catch (error) {
              //     console.log(error);
              // }
              
              console.log("entering obj..")
              let obj= {
                  // description : des,
                  // baseprice : base_p,
                  // salesprice : des_p,
                  images : image_arr,
                  ratings : rating,
                  reviews : rate_rev,
                  seller_name: sel_nm,
                  seller_rating: sel_rate,
                  review_url: rlink,
                  specification: specific_det,
                  product_details : prod_det,
                  Manufacturing_info : manufacturer_arr,
  
              }
              console.log("out of obj..")
              console.log("object: ",obj);
              // let manufact;
              // try{
              //     manufact = document.querySelectorAll(config.SCRAPE.flipkart.manufacturer);
              //     manufact[0].click();
              // }catch(e){}
              
              return obj;  
  
  
          },page,config)
          // console.log("DATA :", data) 
           
          // let sel_nm = seller_name[0].innerText;
          // console.log("seller_name :", sel_nm);


          return data;// return data;
          
      } catch (error) {
          console.log(error);
      }
      // try {
      //     //page = await page.click(config.SCRAPE.flipkart.nextbtn);
      //     //await page.waitForNavigation();                
      //     await page.click(config.SCRAPE.flipkart.other_sellers);
      //     console.log('Before wait')
      //     await page.waitForTimeout(8000)
      //     console.log('After wait')                
      // } catch (error) {
      //     console.log(error)
      // }

    }
    static async getSellerF(page,config){
      try {
          console.log("other seller selector",config.SCRAPE.flipkart.other_sellers);                
          await page.click(config.SCRAPE.flipkart.other_sellers);
          console.log('Before wait 8s')
          await page.waitForTimeout(8000)
          console.log('After wait')                
      } catch (error) {
          console.log(error)
      }
      try {
          let data = await page.evaluate(async (page,config) =>{
              console.log("page:",page)
              let seller_name;
              let seller_rate;
              let original_prc;
              let discount_price;
              let sellname;
              let sellrate;
              let org_prc;
              let aboutsell_btn;
              let seller_since;
              let dis_prc;
              let FSSAI_License;
              let F_License;
              let service_qlt;
              let prod_qlt;
              let sell_date;
              let seller_data = [];
              let obj;
              try{
                  seller_name = document.getElementsByClassName(config.SCRAPE.flipkart.seller_name);
              }catch(e){
                  console.log(error);
              }
              try{
                  seller_rate = document.getElementsByClassName(config.SCRAPE.flipkart.seller_rate);
              }catch(e){
                  console.log(error);
              }
              try{
                  original_prc = document.getElementsByClassName(config.SCRAPE.flipkart.original_prc);
              }catch(e){
                  console.log(error);
              }
              try{
                  discount_price = document.getElementsByClassName(config.SCRAPE.flipkart.discount_price);
              }catch(e){
                  console.log(error);
              }
              console.log("SELETORS FOUND");
              // try{
              //     seller_qaulity = document.getElementsByClassName(config.SCRAPE.flipkart.seller_qaulity);
              // }catch(e){
              //     console.log(error);
              // }
              function delay(time){
                  return new Promise(function(resolve){
                      setTimeout(resolve, time)
                  });
              }
              console.log("starting loop ")
              console.log(seller_name);
              console.log(seller_name.length);
              
              for(let i=0; i < seller_name.length ; i++){
                  sellname = seller_name[i].textContent;
                  console.log("sellname:", sellname);
                  // let sellrate = seller_rate[i].textContent;
                  // console.log("sellrate :", sellrate);
                  // let org_prc = original_prc[i].textContent;
                  try {
                      sellrate = seller_rate[i].textContent;
                  } catch (error) {
                      sellrate = "undefined";
                  }
                  try {
                      org_prc = original_prc[i].textContent;
                  } catch (error) {
                      org_prc = "undefined";
                  }
                  dis_prc = discount_price[i].textContent;
                  console.log("discount price :", dis_prc);
                  // click for about seller
                  try {
                      aboutsell_btn = document.querySelectorAll(config.SCRAPE.flipkart.aboutsell_btn);
                      console.log("before click");
                      console.log(aboutsell_btn[i]);
                      await aboutsell_btn[i].click();
                  } catch (error) {
                      console.log(error)
                  }
                  // get info about seller 
                  function info() {
                      return new Promise((resolve, reject) => {
                      setTimeout(async () => {
                          console.log("after click in 10s");
                          try{
                              seller_since = document.getElementsByClassName(config.SCRAPE.flipkart.seller_since);
                          }catch(e){
                              console.log(e);
                          }
                          try{
                              FSSAI_License = document.querySelectorAll(config.SCRAPE.flipkart.FSSAI_License);
                              F_License = FSSAI_License[0].innerText;
                              console.log("F_License :", F_License);

                          }catch(e){
                              F_License = ("not defined")
                              console.log(e);
                          }
                          try{
                              seller_qaulity = document.getElementsByClassName(config.SCRAPE.flipkart.seller_qaulity);
                          }catch(e){
                              console.log(e);
                          }
                          console.log("selectors found")
                          sell_date = seller_since[0].textContent;
                          console.log("sell_date :", sell_date);
                          prod_qlt = seller_qaulity[0].innerText;
                          console.log("prod_qlt :", prod_qlt);
                          service_qlt = seller_qaulity[1].innerText;
                          console.log("service_qlt :", service_qlt);
                          // let F_License = FSSAI_License[0].innerText;
                          // console.log("F_License :", F_License);
                          try {
                              aboutsell_close = document.getElementsByClassName(config.SCRAPE.flipkart.aboutsell_close);
                              aboutsell_close[0].click();
                          } catch (error) {
                              console.log(error)
                          }
                          // calling DELAY
                          console.log("calling after close ");
                          await delay(4000);
                          console.log("calling after close ");
                          // 
                          console.log("entering of obj..")
                          obj= {
                              seller_name: sellname,
                              seller_rating: sellrate,
                              baseprice : org_prc,
                              salesprice : dis_prc,
                              seller_since: sell_date,
                              product_qlt: prod_qlt,
                              service_qlt: service_qlt,
                              FSSAI_Lic : F_License,
                              
                          }
                          console.log("out of obj..")
                          console.log("object: ",obj);

                          // console.log("obj ready...")
                          // return obj;

                          resolve(obj);
                          // obj{}
                      },1000);
                      });
                  }
                  //  async function() {
                  const result = await info();
                  console.log(i+" " + result); // --> 'done!';
                  seller_data.push(result)


              }
              
              console.log("returned data: ", seller_data)
              return seller_data;  
          
          },page,config);
          return data;
      } catch (error) {
          console.log(error)
      }
    }
    static async getReviewGenA(page, config){
        let reviews;
        let nextpage;
        try {
            // let meta_array=[];
            [reviews,nextpage] = await page.evaluate( (page,config)=>{
                //let r = await page.$$('review')
                //console.log("r",r);
                //console.log("rlen",r.length);
                try {
                  np = document.getElementsByClassName('a-disabled')[0].textContent;  
                } catch (error) {
                  np = undefined; 
                  
                }
          
                let reviewarray =[];
                let reviewlist =[];
                console.log('config.SCRAPE.amazon.review: ',config.SCRAPE.amazon.review)
                //reviewlist = document.getElementsByClassName(config.SCRAPE.amazon.review);
                reviewlist = document.getElementsByClassName('review')
          
                console.log('reviewlist: ',reviewlist);
                console.log('reviewlist.length : ',reviewlist.length);
                console.log('reviewlist[3] : ',reviewlist[3]);
                let reviewtext;
                let reviewdate;
                let reviewtitle;
                let profilename;
                for (let reviewindex = 0; reviewindex < reviewlist.length; reviewindex++) {
                  console.log('reviewindex: ',reviewindex)
                  reviewcomponent = document.getElementsByClassName(config.SCRAPE.amazon.review_main)[reviewindex];
                  console.log(reviewcomponent);
                  reviewtext = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewtext)[0].innerText;
                  console.log("reviewtext",reviewtext)
                  reviewdate = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewdate)[0].innerText;
                  console.log("reviewdate",reviewdate)
                  reviewtitle = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewtitle)[0].innerText;
                  console.log("reviewtitle",reviewtitle)
                  profilename = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.buyer_name)[0].innerText;
                  console.log("profilename",profilename)      
                  
                  let reviewjson = {
                    title:reviewtitle,
                    text:reviewtext,
                    date:reviewdate,
                    user:profilename
                  }
                  console.log(reviewjson)
                  reviewarray.push(reviewjson);
                
                }
                
                console.log('testers',np);
                if (np =='Next page→') {
                  npl = false
                }else{
                  npl =true;
                }
                  
                
                
               return [reviewarray,npl];
             },page,config)
             console.log([reviews,nextpage]);
             return [reviews,nextpage];
        } catch (e) {
            console.log(e);
        }

    }//flipkart//dv/ 
    static async getReviewGenF(page, config){
      try {
          let data = await page.evaluate(async (config) => {
              let product_star;
              let total_rev_rate;
              let rate_distribution;
              // let review_desc;
              // let aboutsell_btn;
              // let seller_since;
              try{
                  product_star = document.getElementsByClassName(config.SCRAPE.flipkart.product_star);
              }catch(e){
                  console.log(error);
              }
              try{
                  total_rev_rate = document.getElementsByClassName(config.SCRAPE.flipkart.total_rev_rate);
              }catch(e){
                  console.log(error);
              }
              try{
                  rate_distribution = document.getElementsByClassName(config.SCRAPE.flipkart.rate_distribution);
              }catch(e){
                  console.log(error);
              }
              try{
                  nextRev_btn = document.getElementsByClassName(config.SCRAPE.flipkart.nextRev_btn);
              }catch(e){
                  console.log(error);
              }
              console.log(nextRev_btn);
              // try{
              //     review_rating = document.getElementsByClassName(config.SCRAPE.flipkart.review_rating);
              // }catch(e){
              //     console.log(error);
              // }
              console.log("SELETORS FOUND");
              let review_arr = [];
              let prod_star = product_star[0].innerText;
              console.log("prod_star:", prod_star);
              let total_rr = total_rev_rate[0].innerText
              console.log("total_rr:", total_rr);
              let rate_dist = rate_distribution[0].innerText.split("\n");  // '66\n28\n18\n5\n7' ['66', '28', '18', '5', '7']
              console.log("rate_dist:", rate_dist);
              let general_obj = {
                  product_star : prod_star,
                  numberof_revrate: total_rr,
                  rate_percentage: rate_dist,
              }
              review_arr.push(general_obj);  // general review details pushed
              console.log(review_arr);  
              // selector_arr.push(review_arr,nextRev_btn);
              // console.log(selector_arr);
              return review_arr; //review_arr

          },config)
          console.log("DATA in function:", data)  // to cmnt return data;
          return data;
      } catch (error) {
          console.log(error);
      }

  }
  static async getReviewLoopF(page, config){
      console.log("inside function");
      // click filter Negative first
      // try {
      //     // await page.click(config.SCRAPE.flipkart.review_filter);
      //     await page.select(config.SCRAPE.flipkart.review_filter, 'NEGATIVE_FIRST');
      //     console.log('Before wait of 5s')
      //     await page.waitForTimeout(5000)
      //     console.log('After wait')
                      
      // } catch (error) {
      //     console.log(error)
      // }
      //DELAY FUNCTION
      function delay(time){
          return new Promise(function(resolve){
              setTimeout(resolve, time)
          });
      }
      // get metadata
      try {
          let data = await page.evaluate(async (page,config) => {
              console.log("page ", page)
              let review_main;
              let reviewloop_arr = []; 
              let review_title;
              let review_text;
              let review_star;
              let buyer_name;
              let rev_date;
              let certified_location;
              let review_obj;

              try{
                  review_main = document.getElementsByClassName(config.SCRAPE.flipkart.review_main);
              }catch(e){
                  console.log(e);
              }
              console.log("selector ",review_main,review_main.length) ;
              // //DELAY FUNCTION
              // function delay(time){
              //     return new Promise(function(resolve){
              //         setTimeout(resolve, time)
              //     });
              // }
              // STARTS LOOP      
              for(let i = 0; i < review_main.length ; i++){      // loops over review on page a[0].getElementsByClassName("_6K-7Co")[0].innerText;
                  console.log("i :", i)
                  try {
                      review_title = review_main[i].getElementsByClassName(config.SCRAPE.flipkart.review_title)[0].innerText;
                      console.log("review_title:", review_title);
                  } catch (error) {
                      review_title = ("undefined");
                  }
                  try {
                      review_text = review_main[i].getElementsByClassName(config.SCRAPE.flipkart.review_text)[0].innerText;
                      console.log("review_text:", review_text);
                  } catch (error) {
                      review_text = ("undefined"); 
                  }
                  try {
                      review_star = review_main[i+1].getElementsByClassName(config.SCRAPE.flipkart.review_star)[0].innerText;
                      console.log("review_star:", review_star);
                  } catch (error) {
                      review_star = ("undefined"); 
                  }
                      // console.log("review_star:", review_star);
                  try {
                      buyer_name = review_main[i].getElementsByClassName(config.SCRAPE.flipkart.buyer_date)[0].innerText;
                      console.log("buyer_name:", buyer_name);                
                  } catch (error) {
                      buyer_name = ("undefined"); 
                  }
                  try {
                      rev_date = review_main[i].getElementsByClassName(config.SCRAPE.flipkart.buyer_date)[1].innerText;
                      console.log("review_date:", rev_date);                
                  } catch (error) {
                      rev_date = ("undefined"); 
                  }
                  // console.log("buyer_name:", buyer_name);
                  try {
                      certified_location = review_main[i].getElementsByClassName(config.SCRAPE.flipkart.certified_location)[0].innerText;
                      console.log("certified_location:", certified_location);    
                  } catch (error) {
                      certified_location = ("undefined"); 
                  }
                  review_obj = {
                      review_Title: review_title,
                      review_description : review_text,
                      review_rate : review_star,
                      profile_name : buyer_name,
                      review_date : rev_date,
                      certified_place : certified_location              
                  }
                  reviewloop_arr.push(review_obj);
                      
              }
              console.log("one page completed");
              //click next
              
              let nextRev_btn = document.querySelectorAll(config.SCRAPE.flipkart.nextRev_btn);
              console.log("seletor lenght: ",nextRev_btn.length)
              nextRev_btn[nextRev_btn.length - 1].click();
              // // calling DELAY
              // console.log("calling delay 4s after next");
              // await delay(4000);
              // console.log("after delay");

              return reviewloop_arr;
          },page,config)
          // calling DELAY
          console.log("calling delay 4s after next");
          await page.waitForTimeout(4000);
          console.log("after delay");
          // try {
          //     //page = await page.click(config.SCRAPE.flipkart.nextbtn);
          //     //await page.waitForNavigation();                
          //     // await page.click(config.SCRAPE.flipkart.nextbtn);
          //     console.log('Before wait outside evaluate 10s');
          //     await page.waitForTimeout(10000);
          //     console.log('After wait');
              
          // } catch (error) {
          //     console.log(error)
          // }
          return [data, page];
      } catch (error) {
          console.log(error)
      }
      
  }

  static randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
  }
  static stringConcat(arr){ 
    // let array = []
    console.log("got array",arr); // arr =[1,2,3]
    let concatarr = '';
    for (let index = 0; index < arr.length; index++) {
        concatarr = concatarr + `${arr[index]},` 
    } 
    concatarr = concatarr.slice(0,-1);   
    console.log('concatarr: ',concatarr);
    return concatarr
    // NgoWorker.finalstausupdate(stateids);  
    }
    static async typeKey(page,selector,keyword){
        await page.type(selector.searchBar, keyword , {delay: 100});  
          try {
              await page.click(selectorBtn) 
              await page.waitForTimeout(2000);
          } catch (error) {
              console.log(error)
          }
        return page
    }
    static async getKeySearch(id,page,config,platform_id){
        let flag = true;
        let page_count = 0;
        let metadata; // page data
        let temparr=[];
        // let imgarr=[];
        let bulkInsertArr = []; // key data
        while (flag) {
            page_count++;
            console.log("PAGE NUMBER:", page_count);
            metadata = await this.getmetaDataF(page, config); // page data
            console.log("DATA OF PAGE:",page_count,metadata);
            // data_array.push(metadata);
            for(let i=0; i< metadata.length; i++){
                temparr.push(id)
                temparr.push(platform_id)
                temparr.push(metadata[i].prod_link)
                temparr.push(metadata[i].prod_name)
                temparr.push(metadata[i].description)
                temparr.push(metadata[i].original_price)
                temparr.push(metadata[i].sale_price)
                temparr.push(metadata[i].assurance)
                temparr.push(metadata[i].images)

                bulkInsertArr.push(temparr);
                temparr=[]
            }
            console.log('bulkInsertArr',bulkInsertArr)
            console.log("==========================");
            
            if(page_count > 1){
                flag = false;
            }
            else{
                console.log("next page..");
                console.log(config.SCRAPE.flipkart.nextbtn);            
                
                try {   
                    await page.click(config.SCRAPE.flipkart.nextbtn);
                    console.log('Before wait')
                    await page.waitForTimeout(8000)
                    console.log('After wait')
                    
                } catch (error) {
                    console.log(error);
                }
    
            }          
        }
        return bulkInsertArr, imgarr;
    } 
    








}







module.exports = Helper;