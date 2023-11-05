const Helper = require('../utils/helper');
(async () => {
    const ProductMetaWorker = require("./ProductMetaWorker")
    // let namesA = await ProductMetaWorker.getkeywordAmazon('A')
    // console.log('namesA',namesA)
    
    // let namesF = await ProductMetaWorker.getkeywordFlipkart('A')
    // console.log('namesF',namesF)
    let arr =[1,3,4];
    let para = Helper.stringConcat(arr)
    console.log('para',para)
    ProductMetaWorker.bulkupdateStatusByIdsAmazon('O', para) // '1,3,4'
    console.log('bulk updated')
    // ProductMetaWorker.updateAmazonStatusById('C','1')
    // ProductMetaWorker.updateFlipkartStatusById('C','2')
  })();

  