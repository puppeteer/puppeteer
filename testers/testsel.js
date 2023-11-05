const puppeteer = require('puppeteer');
const Helper = require('../utils/helper');
const config = require('../config/config');
const bConfig = require('../config/browserConfig');
const res = require('../config/Res');
// let testinput = 'chocolate'
// function randomIntFromInterval(min, max) { return Math.floor(Math.random() * (max - min + 1) + min)}

async function createpage(){
  let LoopCondition = true;
  let executablePath =bConfig.executablePath;
  // let useDataDir = bConfig.useDataDir;
  let browser = await Helper.getProfiledBrowser(executablePath);
  let userAgent = await Helper.getuseragent();
  console.log("res",userAgent);
  let res = await Helper.getResolution();
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
  async function searchkeyword(testinput) {
    let LoopCondition = true;
    let executablePath =bConfig.executablePath;
    // let useDataDir = bConfig.useDataDir;
    let browser = await Helper.getProfiledBrowser(executablePath);
    let userAgent = await Helper.getuseragent();
    console.log("res",userAgent);
    let page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.goto(config.SCRAPE.amazon.URL);
    let res = await Helper.getResolution();
    console.log("res",res);
    await page.setViewport(res);
    let tabs = await browser.pages();
        if (tabs.length > 1) {
            tabs[0].close()
        }
    await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
    await page.waitForTimeout (1000);
    await page.click('#nav-search-submit-button') 
  }
  async function searchkeyword(testinput) {
    let LoopCondition = true;
    let executablePath =bConfig.executablePath;
    // let useDataDir = bConfig.useDataDir;
    let browser = await Helper.getProfiledBrowser(executablePath);
    let userAgent = await Helper.getuseragent();
    console.log("res",userAgent);
    let page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.goto(config.SCRAPE.amazon.URL);
    let res = await Helper.getResolution();
    console.log("res",res);
    await page.setViewport(res);
    let tabs = await browser.pages();
        if (tabs.length > 1) {
            tabs[0].close()
        }
    await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
    await page.waitForTimeout (1000);
    await page.click(config.SCRAPE.amazon.searchbutton) 
  }
  async function getname(testinput) {
    //let createData = await this.createpage()
    //let [o,a] = await this.createpage()
    let LoopCondition = true;
    let executablePath =bConfig.executablePath;
    let res = await Helper.getResolution();
    console.log("res",res);
    // let useDataDir = bConfig.useDataDir;
    let browser = await Helper.getProfiledBrowser(executablePath);
    let userAgent = await Helper.getuseragent();
    console.log("res",userAgent);
    let page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport(res);
    let tabs = await browser.pages();
        if (tabs.length > 1) {
            tabs[0].close()
        }
    await page.goto(config.SCRAPE.amazon.URL);
    
    
    await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
    
    console.log('Before wait')
    await page.waitForTimeout (5000);
    console.log('after wait')
  
    await page.click(config.SCRAPE.amazon.searchbutton)
    await page.waitForNavigation
    try {
      await page.waitForNavigation  
    } catch (error) {
      console.log('error',error)
    }
    let seltor =config.SCRAPE.amazon.productselector
    console.log('seltor',seltor)
    console.log('Before wait')
    await page.waitForTimeout (5000);
    console.log('after wait')
    try {
      // await page.waitForNetworkIdle
      /*
      await page.waitForSelector(seltor)
      await page.evaluate(_ => {
        window.scrollBy(0, 3000);
      });
      */
      // await page.keyboard.press(rrow down')
      // await page.keyboard.press('arrow down')
      // await page.keyboard.press('arrow down')
      // await page.keyboard.press('arrow down')
      // await page.keyboard.press('arrow down')
      // // new Promise(r => setTimeout(r, 1000));
      let names =  await page.evaluate((seltor) =>{
        let namelist = []
        let names = document.querySelectorAll(seltor);
        console.log('len',names.length);
        console.log('names',names);
        for (let index = 0; index < names.length; index++) {
          namelist.push(names[index].innerHTML)
        }
        return namelist
      },seltor)
      console.log('names',names);  
    } catch (error) {
      console.log('error',error)
    }
    
    // let names =  await page.evaluate(() =>{
    //   let namelist = []
    //   let names = document.querySelectorAll(config.SCRAPE.amazon.productselector);
    //   for (let index = 0; index < names.length; index++) {
    //     namelist.push(names[index].innerHTML)
    //   }
    //   return namelist
    // })
    // console.log('names',names);
    }  
  async function getname2(testinput) {
    let [page,browser] = await createpage();
    let LoopCondition = true;
    let executablePath =bConfig.executablePath;
    let res = await Helper.getResolution();
    console.log("res",res);
    // let useDataDir = bConfig.useDataDir;
    // let browser = await Helper.getProfiledBrowser(executablePath);
    let userAgent = await Helper.getuseragent();
    console.log("res",userAgent);
    // let page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport(res);
    let tabs = await browser.pages();
        if (tabs.length > 1) {
            tabs[0].close()
        }
    await page.goto(config.SCRAPE.amazon.URL);
    await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
    console.log('Before wait')
    await page.waitForTimeout (5000);
    console.log('after wait')
    await page.click(config.SCRAPE.amazon.searchbutton)
    await page.waitForNavigation
    try {
      await page.waitForNavigation  
    } catch (error) {
      console.log('error',error)
    }
    let seltor =config.SCRAPE.amazon.productselector
    console.log('seltor',seltor)
    console.log('Before wait')
    await page.waitForTimeout (5000);
    console.log('after wait')
    try {
      // await page.waitForNetworkIdle
      /*
      await page.waitForSelector(seltor)
      await page.evaluate(_ => {
        window.scrollBy(0, 3000);
      });
      */
      // await page.keyboard.press(rrow down')
      // await page.keyboard.press('arrow down')
      // await page.keyboard.press('arrow down')
      // await page.keyboard.press('arrow down')
      // await page.keyboard.press('arrow down')
      // // new Promise(r => setTimeout(r, 1000));
      let names =  await page.evaluate((seltor) =>{
        let namelist = []
        let names = document.querySelectorAll(seltor);
        console.log('len',names.length);
        console.log('names',names);
        for (let index = 0; index < names.length; index++) {
          namelist.push(names[index].innerHTML)
        }
        return namelist
      },seltor)
      console.log('names',names);  
    } catch (error) {
      console.log('error',error)
    }
    
    } 
  

    async function getname3(testinput) {
      let [page,browser] = await createpage();
      await page.goto(config.SCRAPE.amazon.URL);
      await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
      console.log('Before wait')
      await page.waitForTimeout (5000);
      console.log('after wait')
      await page.click(config.SCRAPE.amazon.searchbutton)
      await page.waitForNavigation
      try {
        await page.waitForNavigation  
      } catch (error) {
        console.log('error',error)
      }
      // let seltor =config.SCRAPE.amazon.productselector
      // console.log('seltor',seltor)
      console.log('Before wait')
      await page.waitForTimeout (5000);
      console.log('after wait')
      try {
        let pagecount = 1
        let flag =true;
        while(flag){
        let seltor = config.SCRAPE.amazon.productname;
        let names =  await page.evaluate((config,seltor,pagecount) =>{
          let detarray = []
          // let parent = document.getElementsByClassName(config.SCRAPE.amazon.parentproducts);
          console.log('parent',config.SCRAPE.amazon.parentproducts)
          let parent = document.getElementsByClassName(config.SCRAPE.amazon.parentproducts);
          console.log(parent);
          for (let scrapeindex = 0; scrapeindex < parent.length; scrapeindex++) {
            let productnamejson
            try {
              productnamejson =  parent[scrapeindex].getElementsByClassName(seltor)[0].textContent; 
              console.log('p1',productnamejson) 
            } catch (error) {
              let productnamejson =  parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.productname2)[0].textContent;
              console.log('p2',productnamejson)
            }
            let pricejson =  parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.price)[0].textContent;  
            console.log('price',pricejson);
            let ogprice = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.ogprice)[0].innerText;
            let imagelink = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.Image)[0].outerHTML;
            let reviewscore
            try {
              reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revscore)[0].innerText;
            } catch (error) {
              // reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revscore)[0].innerText;
            }
            let rnos = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revnos)[0].innerText
            console.log('IMG',imagelink)
            console.log('r',reviewscore)
            detjson = {
              productname:productnamejson,
              price:pricejson,
              orgprice:ogprice,
              imagelink:imagelink,
              reviewscore:reviewscore,
              reviewnos:rnos
            }
            detarray.push(detjson)  
          }
          return detarray
        },config,seltor,pagecount)
        
        console.log('names',names);
        pagecount++;
        if(pagecount > 3){
          flag = false;
      }
      else{
          console.log("next page..");
          console.log(config.SCRAPE.amazon.nxtbtn);
  
          await page.click(config.SCRAPE.amazon.nxtbtn);
          page.waitForSelector(config.SCRAPE.amazon.nxtbtn);
        }  
      }  
      } catch (error) {
        console.log('error',error)
      }
      return [page,browser];
      } 


      async function getdata(testinput) {
        let [page,browser] = await createpage();
        await page.goto(config.SCRAPE.amazon.URL);
        await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
        console.log('Before wait')
        await page.waitForTimeout (5000);
        console.log('after wait')
        await page.click(config.SCRAPE.amazon.searchbutton)
        await page.waitForNavigation
        console.log('Before wait')
        await page.waitForTimeout (5000);
        console.log('after wait')
        let itr=0;
        let itrLimit =3;
        let itrFlag = true;
        while(itrFlag){
          try {
            await page.waitForTimeout(5000);
            console.log('####################################')
            console.log('Page No: ',itr)
            console.log('####################################')
            let seltor = config.SCRAPE.amazon.productname;
            let names =  await page.evaluate((config,seltor) =>{
              let detarray = []
              //console.log('parent',config.SCRAPE.amazon.parentproducts)
              let parent = document.getElementsByClassName(config.SCRAPE.amazon.parentproducts);
              console.log('parent.length: ',parent.length);
              let productnamejson
              
              for (let scrapeindex = 0; scrapeindex < parent.length; scrapeindex++) {
               
                try {
                  productnamejson =  parent[scrapeindex].getElementsByClassName(seltor)[0].textContent; 
                  console.log('p1',productnamejson) 
                } catch (error) {
                  let productnamejson =  parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.productname2)[0].textContent;
                  console.log('p2',productnamejson)
                }
                try{
                
                  pricejson =  parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.price)[0].textContent;  
                  console.log('price',pricejson);
                  
                }catch(e){

                }
                try{
                  ogprice = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.ogprice)[0].innerText;
           
                }catch(e){}
                
                try{
                  imagelink = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.Image)[0].outerHTML;
                }catch(e){}

                let reviewscore
                try {
                  reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revscore)[0].innerText;
                } catch (error) {
                  // reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revscore)[0].innerText;
                }
                let rnos;
                try{
                  rnos = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revnos)[0].innerText
                }catch(e){

                }
                
                console.log('IMG',imagelink)
                console.log('r',reviewscore)
                detjson = {
                  price:pricejson,
                  orgprice:ogprice,
                  imagelink:imagelink,
                  reviewscore:reviewscore,
                  reviewnos:rnos,
                  productname:productnamejson
                }
                console.log("detjson",detjson)
                detarray.push(detjson)
                console.log("detarrays",detarray)
  
                 
              }
              console.log("detarray",detarray)
              return detarray
            },config,seltor)
            console.log('names.length: ',names.length);
            console.log('names: ',names);
            itr++;
            if(itr==itrLimit){
              itrFlag=false;
            }else{
              try{
                await page.click(".s-pagination-next");
                
              }catch(e){
                console.log('Error in next click');
                itrFlag=false;
              }
            }
            
            
            
          } catch (error) {
            console.log(error);
          }
        }
        

                
        }  
        (async() => {
          // await getdata('choclate');
            // await testpagedata();
            
            await g("monkey");
            // await getinnerdata()
        })();
      

        async function getinnerdata() {
          let [p,browser] = await createpage();
          let page = await browser.newPage();
          try {
            await page.goto('https://www.amazon.in/Worlds-Greatest-Personal-Growth-Wealth/dp/9390391512/ref=sr_1_1_sspa?crid=7V692FSIWH3Y&keywords=books&qid=1665748432&qu=eyJxc2MiOiI4LjQwIiwicXNhIjoiOC4xNyIsInFzcCI6IjguMjIifQ%3D%3D&smid=A3H3WE9M6NY1KV&sprefix=book%2Caps%2C193&sr=8-1-spons&psc=1');
            // await page.goto('https://www.amazon.in/Worlds-Greatest-Personal-Growth-Wealth/dp/9390391512/ref=sr_1_1_sspa?crid=7V692FSIWH3Y&keywords=books&qid=1665748432&qu=eyJxc2MiOiI4LjQwIiwicXNhIjoiOC4xNyIsInFzcCI6IjguMjIifQ%3D%3D&smid=A3H3WE9M6NY1KV&sprefix=book%2Caps%2C193&sr=8-1-spons&psc=1');
            
            // await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
            // console.log('Before wait')
            // await page.waitForTimeout (5000);
            // console.log('after wait')
            // await page.click(config.SCRAPE.amazon.searchbutton)
            // await page.waitForNavigation
            // console.log('Before wait')
            // await page.waitForTimeout (5000);
            // console.log('after wait')
            let names = await page.evaluate((config,page) =>{
              let title = document.getElementById(config.SCRAPE.amazon.producttitle).textContent;
              console.log(title)
              let totalreviews = document.getElementsByClassName('review-text');
              console.log(totalreviews)
              for (let index = 0; index < totalreviews.length; index++) {
                let reviews  = document.getElementsByClassName('review-text')[index].innerText
                console.log(reviews)
                  
              }
              // page.goto(reviews);
              
  
            },config,page)  
          } catch (error) {
            console.log(error)
          }
                 
          // return [page,browser]      
          }       
        

          async function getpagedata() {
            let [page,browser] = await Helper.createpage();
            
            await page.goto('https://www.amazon.in/Ferrero-78205-Rocher-16-Pieces/dp/B00BYQEIL6/ref=sr_1_5?keywords=ferrero+rocher+chocolates&qid=1666678394&qu=eyJxc2MiOiI0LjM4IiwicXNhIjoiNC4xNiIsInFzcCI6IjMuMzkifQ%3D%3D&sprefix=ferer%2Caps%2C560&sr=8-5')
            // page.waitForNavigation()
            console.log("scrape")
            await page.click(".olp-link-widget");
            await page.waitForSelector("#aod-pinned-offer-show-more-link");
            await page.click("#aod-pinned-offer-show-more-link");
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
              await page.waitForSelector('.mbcMerchantName')
            names =  await page.evaluate(async () =>{
            let productdetails;
  
           
              productdetails = document.getElementById("prodDetails").innerText;
              console.log(productdetails)
              // console.log (productdetails)
              sellselector = 'bylineInfo'
              sellor = [document.getElementById("bylineInfo").href,
              document.getElementById("bylineInfo").innerHTML]
              console.log(sellor)
              let sellerarray = []
              let sellers = document.getElementsByClassName('mbcMerchantName')
              console.log('sellers:ss ',sellers)
              console.log("before")
              // await page.waitForTimeout(5000);
              console.log("after")
          
              //await page.waitForSelector('.mbcMerchantName')
              console.log("after 3")
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
              revgraph = document.getElementsByClassName("a-histogram-row")
              console.log(revgraph);
              let revarray = []
              for (let index = 0; index < revgraph.length; index++) {
                revarray.push(document.getElementsByClassName("a-histogram-row")[index].innerText)
                // console.log(revarray)
              }
              
              console.log(revarray)
              // page.waitForTimeout(5000);
              console.log("after")

             images = document.querySelectorAll("#altImages img")
             let imagearray = [] 
             for (let index = 0; index < images.length; index++) {
             imagearray.push(images[index].src);     
             }  
             console.log("imgs",imagearray);
             console.log("before")
            //  page.waitForTimeout(5000);
             console.log("after")
            let moresellers = document.querySelectorAll("#aod-offer");
            // let seller;
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
              othersellers = document.querySelectorAll("#aod-offer")[sellerindex];
              console.log(seller);
              price = othersellers.getElementsByClassName("a-offscreen")[0].textContent;
              console.log(price);
              ratings  = othersellers.querySelectorAll("#aod-offer-seller-rating")[0].textContent
              console.log(ratings);
              details = othersellers.innerText;
              shippername = othersellers.querySelectorAll('#aod-offer-shipsFrom')[0].textContent
              console.log("det",details);
              sellerlinklist = othersellers.getElementsByClassName("a-link-normal");
              sellerlink = sellerlinklist[sellerlinklist.length-1].href
              console.log("sl",sellerlink)
              sellerstar = othersellers.querySelectorAll("#aod-offer-seller-rating i ")[0].outerHTML
              sellerrname = othersellers.querySelectorAll('#aod-offer-soldBy')[0].textContent
              console.log(sellerstar)
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
              
                mainseller = document.querySelectorAll("#aod-pinned-offer-additional-content")[0];
                shipinfo =mainseller.querySelector("#aod-offer-shipsFrom").textContent;
                mainsellername =mainseller.querySelector(".a-link-normal").textContent;
                mainsellerlink =mainseller.querySelector(".a-link-normal").href;
                mainrating = mainseller.querySelector("#aod-offer-seller-rating").textContent;
                mainstar = mainseller.querySelector("#aod-offer-seller-rating i").outerHTML;
                console.log(mainstar);
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
             productdetails:productdetails,
             sellers:sellerarray,
             reviews:revarray,
             images:imagearray,
             mainseller:mainsellerdetailsjson,
             othersellerarray:othersellerarray

            }

            // page.goto(reviewlink);
            
            // page.click(button);
            return totalreviews;
            })
            // console.log("names",names);
        } catch (error) {
              
        }
          console.log("scrape2")
          console.log("names",names);
                   
            // return [page,browser]      
            }       
          
            async function testpagedata() {
              let [page,browser] = await createpage();
              // await page.goto('https://www.amazon.in/Ferrero-78205-Rocher-16-Pieces/dp/B00BYQEIL6/ref=sr_1_5?keywords=ferrero+rocher+chocolates&qid=1666678394&qu=eyJxc2MiOiI0LjM4IiwicXNhIjoiNC4xNiIsInFzcCI6IjMuMzkifQ%3D%3D&sprefix=ferer%2Caps%2C560&sr=8-5')
              // let testurl = 'https://www.amazon.in/Advanced-Grooming-Respect-Perfumed-Spray/dp/B00YXYXFUQ/?_encoding=UTF8&pd_rd_w=Ms8ta&content-id=amzn1.sym.ee95cf1c-a23b-442a-b489-0825c53f0fbe&pf_rd_p=ee95cf1c-a23b-442a-b489-0825c53f0fbe&pf_rd_r=4T2E5GV26EEWT20VM7G9&pd_rd_wg=yYOz5&pd_rd_r=6e646763-9833-4e08-800a-3f2a85ca7a95&ref_=pd_gw_trq_ed_kg2t0rnn'
              let testurl ='https://www.amazon.in/product-reviews/B077SZ667X/ref=cm_cr_getr_d_paging_btm_next_2?ie=UTF8&filterByStar=one_star&reviewerType=all_reviews&pageNumber=3#reviews-filter-bar' 
              page =await Helper.openurl(page,testurl)
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
                  reviewcomponent = document.getElementsByClassName(config.SCRAPE.amazon.review)[reviewindex];
                  console.log(reviewcomponent);
                  reviewtext = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewtext)[0].innerText;
                  console.log("reviewtext",reviewtext)
                  reviewdate = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewdate)[0].innerText;
                  console.log("reviewdate",reviewdate)
                  reviewtitle = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewtitle)[0].innerText;
                  console.log("reviewtitle",reviewtitle)
                  profilename = reviewcomponent.getElementsByClassName(config.SCRAPE.amazon.reviewprofile)[0].innerText;
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
              
              
              async function g(keyword) {
                let [page,browser] = await Helper.createpage();
                await page.goto(config.SCRAPE.amazon.URL);
                await page.type(config.SCRAPE.amazon.searchbox,String(keyword),{delay: 1000});
                console.log('Before wait')
                await page.waitForTimeout (5000);
                console.log('after wait')
                await page.click(config.SCRAPE.amazon.searchbutton)
                try {
                    await page.waitForNavigation         
                } catch (error) {
                    console.log("nav error")
                }
                // await page.waitForNavigation
                // console.log('Before wait')
                // await page.waitForTimeout (5000);
                // console.log('after wait')
                let itr=0;
                let itrLimit =3;
                let itrFlag = true;
                while(itrFlag){
                  try {
                    await page.waitForTimeout(5000);
                    console.log('####################################')
                    console.log('Page No: ',itr)
                    console.log('####################################')
                    let seltor = config.SCRAPE.amazon.productname;
                    let productinfo =  await page.evaluate((config,seltor) =>{
                      let detarray = []
                      let parent = document.getElementsByClassName(config.SCRAPE.amazon.parentproducts);
                      console.log('parent.length:',parent.length);
                      let productnamejson
                      for (let scrapeindex = 0; scrapeindex < parent.length; scrapeindex++) {
                        try {
                          productnamejson =  parent[scrapeindex].getElementsByClassName(seltor)[0].textContent; 
                          console.log('p1',productnamejson) 
                        } catch (error) {
                        console.log(error);
                        }
                        try{
                          pricejson =  parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.price)[0].textContent;  
                          console.log('price',pricejson);
                        }catch(e){
                        }
                        try{
                          ogprice = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.ogprice)[1].innerText;
                        }catch(e){}
                        
                        try{
                          imagelink = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.Image)[0].srcset;
                          imagelinkarray = imagelink.split(' ')
                          imagelink = imagelinkarray[imagelinkarray.length-2]
                        }catch(e){
                            console.log("error in images",e)
            ;            }
            
                        let reviewscore
                        try {
                          reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revscore)[0].innerText;
                        } catch (error) {
                            console.log('rs',reviewscore)
                          // reviewscore = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revscore)[0].innerText;
                        }
                        let rnos;
                        try{
                          rnos = parent[scrapeindex].getElementsByClassName(config.SCRAPE.amazon.revnos)[0].innerText
                        }catch(e){
                          console.log("rnos",rnos);
                        }
            
                        console.log('IMG',imagelink)
                        console.log('r',reviewscore)
                        
                        detjson = {
                          price:pricejson,
                          orgprice:ogprice,
                          imagelink:imagelink,
                          reviewscore:reviewscore,
                          reviewnos:rnos,
                          productname:productnamejson
                        }
                        // console.log("detjson",detjson)
                        detarray.push(detjson)
                        // console.log("detarrays",detarray)
            
                         
                      }
                      console.log("detarray",detarray)
                      return detarray
                    },config,seltor)
                    // console.log('productinfo.length: ',productinfo.length);
                    console.log('productinfo: ',productinfo);

                    itr++;
                    if(itr==itrLimit){
                      itrFlag=false;
                    }else{
                      try{
                        await page.click(".s-pagination-next");
                        
                      }catch(e){
                        console.log('Error in next click');
                        itrFlag=false;
                      }
                    }
                    
                    
                    
                  } catch (error) {
                    console.log(error);
                  }
                }
                }
                    
                


    