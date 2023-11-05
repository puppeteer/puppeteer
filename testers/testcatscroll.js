const puppeteer = require('puppeteer');
// let testinput = 'chocolate'
(async (testinput = 'choclate' ) => {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.goto('https://www.amazon.in');
    try {
      await page.waitForNavigation;
    } catch (error) {
      
    }
    await page.type('#twotabsearchtextbox',String(testinput));
    
    await page.click('#nav-search-submit-button');
    try {
      await page.waitForNavigation;
    } catch (error) {
      
    }
    let pagenos
    try {
        pagenos = await page.evaluate(() =>{
        console.log('before')
          let lastpage = document.querySelectorAll("#search > div.s-desktop-width-max.s-desktop-content.s-opposite-dir.sg-row > div.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span > div.s-main-slot.s-result-list.s-search-results.sg-row > div > div > div > span > span:nth-child(6)")
        console.log("lastpage",lastpage);
        lastpage = lastpage[0].innerHTML

        return lastpage;
      })
    } catch (error) {
      console.log("error",error)
    }
    // console.log(pagenos)
    // let options = await page.evaluate(() =>{
    //   let selector = document.querySelectorAll('#search > div> div> div > span > div > div > div > div > div > div > div > div > div > div > div > h2 > a > span')
    //   lastpage = lastpage[0].innerHTML
    //   return selector;
    // })
    // d = document.querySelectorAll('#search > div> div> div > span > div > div > div > div > div > div > div > div > div > div > div > h2 > a > span')


    // console.log(pagenos)
    // await page.waitForTimeout(10000);
    // await page.click('#search > div.s-desktop-width-max.s-desktop-content.s-opposite-dir.sg-row > div.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span:nth-child(4) > div.s-main-slot.s-result-list.s-search-results.sg-row > div:nth-child(3) > div > div > div > div > div > div > div > div.sg-col.sg-col-4-of-12.sg-col-8-of-16.sg-col-12-of-20.s-list-col-right > div > div > div.a-section.a-spacing-none.puis-padding-right-small.s-title-instructions-style > h2 > a > span')

    // await page.select('#searchDropdownBox > option:nth-child(18)');
    //await page.select('Furniture')
    // await page.await(300);
    // await page.keyboard.press('ArrowDown');
    // await page.keyboard.press('Enter');

    //   let k = await page.evaluate(() =>{
    //   show_ngo_info("305138");
    // })
//   console.log(k)
  
  })();
  