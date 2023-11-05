// ['3', '33', '33', '333', '33', '3333', '333', '333', '3333', '3333', '3333', '3333', '3333', '333', '3', '3', '3', '3', '3', '3']
// const ProductMetaWorker = require("./ProductMetaWorker")
const Helper = require('../utils/helper');
(async () => {
    const ProductDetailsWorker = require("./ProductDetailsWorker")
    const ImagesWorker =  require('./ImagesWorker')


    let bulkInsertArr=   [
      [
        'https://www.flipkart.com/jinal-woven-embellished-banarasi-art-silk-saree/p/itm663f70b5bc552?pid=SARGG3AHAHXVNWXT&lid=LSTSARGG3AHAHXVNWXTYIX9BL&marketplace=FLIPKART&q=silk&store=clo&srno=s_1_1&otracker=search&otracker1=search&fm=organic&iid=en_30OSLkKJpB8N7tEwYfoysgHdvEQ6dr0YQiUdZCGKSZ3QyFC5x6qpJAKbsI6t6Mqmtv97SuGeAOPQkkJe9X%2BPug%3D%3D&ppt=hp&ppn=homepage&ssid=3egw9tns1s0000001668246681962&qH=5339078d0c2b1aae',
        'Jinal & Jinal',
        'Woven, Embellished Banarasi Art Silk Saree',
        '₹1,249',
        '₹2,399',
         false,
        'https://rukminim1.flixcart.com/image/452/542/l4ln8nk0/sari/1/v/p/free-aarya-ishika-fab-unstitched-original-imagfguy6emggfgb.jpeg?q=50'
      ],
      [
        'https://www.flipkart.com/sangeet-baby-boys-festive-party-kurta-waistcoat-pyjama-set/p/itm7643d29f521d6?pid=KETGJ2R95HDBXKJD&lid=LSTKETGJ2R95HDBXKJDURTCVP&marketplace=FLIPKART&q=silk&store=clo&srno=s_1_2&otracker=search&otracker1=search&fm=organic&iid=en_30OSLkKJpB8N7tEwYfoysgHdvEQ6dr0YQiUdZCGKSZ3dqA1u78BCri3pvjkBXH4RKdd0Mn12EZElrvttRSXX0Q%3D%3D&ppt=hp&ppn=homepage&ssid=3egw9tns1s0000001668246681962&qH=5339078d0c2b1aae',
        'Sangeet',
        'Baby Boys Festive & Party Kurta, Waistcoat and Pyjama S...',
        '₹449',
        '₹1,299',
        true,
        'https://awsminim1.flixcart.com/image/452/542/xif0q/kids-ethnic-set/i/c/y/1-2-years-wjs-mr-fashion-original-imaggnyyzhsceujt.jpeg?q=50'
      ]]
    
    ProductDetailsWorker.insertDetailsBulk(bulkInsertArr)
      // [['122','2222','33333333333', '4444444444444444', '555555555555', '666666666666666', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22','23'],['888888888122','28222','3838333333333', '44448444444444444', '5555555558555', '6666666668666666', '887', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22','23'],['1622','62222','333366666663333333', '44444444444444644', '555555566655555','6666666', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22','23']])
    // ProductDetailsWorker.updateReviewStatusByIds('A',4)

    // let imgarr = [
    //   [1,'https://rukminim1.flixcart.com/image/452/542/kl2mljk0/sari/c/f/u/free-cotton-01-jashvicreation-unstitched-original-imagya4ezrhxdk7r.jpeg?q=50'],
    //   [2,'https://awsabscf.flixcart.com/image/452/542/l4ln8nk0/sari/1/v/p/free-aarya-ishika-fab-unstitched-original-imagfguy6emggfgb.jpeg?q=50']
    // ]
    // ImagesWorker.insertImageUrls(imgarr)
    // let arr =[1,2,3];
    // let para = Helper.stringConcat(arr)
    // console.log('para',para)
    // let review_link = await ProductDetailsWorker.getReviewUrls('A', 1);
    // console.log('review_links', review_link)
    
    // let prod_id =[1,2];
    // let para = Helper.stringConcat(prod_id)
    // console.log('para',para)
    
    // let updatearr= ['345','333', '22', '34', '44', '3', '2', '1', '6', '3','1'] 
    // ProductDetailsWorker.updateDetailsBulk(updatearr)
    // console.log('done')
  })();
