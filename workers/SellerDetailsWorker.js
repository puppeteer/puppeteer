const util = require('util');
const mysql = require('mysql');

const pool = require("../database/database")
let TABLE = "product_details" 
class SellerDetailsWorker {
    
    static async getProductUrl(platform_id) {
        try {
            const query = `select name from ${TABLE} where platform_id = ? limit 3;` ;
            
            const result = await pool.query(query,[platform_id]);

            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
     

    static async insertSellerDetailsBulk(mainArr) {
        let result
        try {
            if(mainArr.length > 0){

                const query = 'INSERT IGNORE INTO `seller_details` (`id`, `seller_hash`, `seller_name`, `platform`, `selling_since`, `fssai`, `overall_rating`, `overall_review`, `5_star_rating`, `4_star_rating`, `3_star_rating`, `2_star_rating`, `1_star_rating`, `5_star_review`, `4_star_review`, `3_star_review`, `2_star_review`, `1_star_review`, `status`)VALUES ?;'

                
                result = await pool.query(query,[mainArr]);
                
            }
            
        } catch (error) {
            console.log('error',error.stack);
            
        }
        return result;
    }
    






}

module.exports = SellerDetailsWorker