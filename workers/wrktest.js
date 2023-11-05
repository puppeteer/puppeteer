const Helper = require('../utils/helper');
(async () => {
    const SellerDetailsWorker = require("./SellerDetailsWorker")
    const ReviewWorker = require("./ReviewWorker")
    // await SellerDetailsWorker.insertSellerDetailsBulk([['1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],['2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2']])
    console.log('inserted')
    
    await ReviewWorker.insertReviewBulk([['1', '1', '1', '1', '1', '1', '1', '1', '1'],['2', '2', '2', '2', '2', '2', '2', '2', '2']])
    console.log('inserted')
    // let [id,urls] = await SellerDetailsWorker.getProductUrl(1)
    // console.log('id', id)
    // console.log('urls', urls)
    // // ProductMetaWorker.updateFlipkartStatusById('C','3')

    // let arr =[1,2,3];
    // let para = Helper.stringConcat(arr)
    // console.log('para',para)
    // SellerDetailsWorker.bulkupdateStatusByIds('O', para) // '1,3,4'
    // console.log('bulk updated')
  })();
  