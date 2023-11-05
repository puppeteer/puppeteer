const util = require('util');
const mysql = require('mysql');

const pool = require("../database/database")
let TABLE = "product_details" 
class ReviewWorker {
    
     

    static async insertReviewBulk(mainArr) {
        let result
        try {
            if(mainArr.length > 0){

                const query = 'INSERT IGNORE INTO `review` (`id`, `product_details_id`, `url`, `review_title`, `review_desc`, `user`, `star`, `date`, `is_verified`)VALUES ?;'

                
                result = await pool.query(query,[mainArr]);
                
            }
            
        } catch (error) {
            console.log('error',error.stack);
            
        }
        return result;
    }
    






}

module.exports = ReviewWorker