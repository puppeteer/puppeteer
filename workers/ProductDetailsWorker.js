const util = require('util');
const mysql = require('mysql');

const pool = require("../database/database")
let TABLE = "product_details" 
class ProductDetailsWorker {
    
    static async getProductUrls(platform_id) {
        try {
            const query = `select url from ${TABLE} where platform_id = ? limit 3;` ;
            
            const result = await pool.query(query,[platform_id]);

            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
     

    static async insertDetailsBulk(mainArr) {
        let result
        try {
            if(mainArr.length > 0){

                const query = 'INSERT IGNORE INTO `product_details` ( `url`,`title`, `description`, `mrp`,`selling_price`, `image_url`)VALUES ?;'

                
                result = await pool.query(query,[mainArr]);
                
            }
            
        } catch (error) {
            console.log('error',error.stack);
            
        }
        return result;
    }
    
    static async updateProductStatusByIds(status,ids){ // update product status O to C by id
        try {
            const query = `UPDATE ${TABLE} SET status= ? WHERE id =?;`;
            const result = await pool.query(query,[status,ids]);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        }
    }

    static async updateReviewStatusByIds(status,ids){ // update review status O to C by id
        try {
            const query = `UPDATE ${TABLE} SET review_status= ? WHERE id=?;`;
            const result = await pool.query(query,[status,ids]);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        }
    }
    static async bulkUpdateStatusByIds(status,ids){ // Bulk update status A to O
        try {
            const query = `UPDATE ${TABLE} SET status= ? WHERE id IN (${ids});`; //  IN (${ids})= '1,3,4
            const result = await pool.query(query,[status]);
            return result;
        }catch{
            console.log(error.stack);
            throw error;
        }
    }
    static async bulkUpdateReviewStatusByIds(review_status,ids){ //  Bulk update review status A to O
        try {
            const query = `UPDATE ${TABLE} SET review_status= ? WHERE id IN (${ids});`; //  IN (${ids})= '1,3,4
            const result = await pool.query(query,[review_status]);
            return result;
        }catch{
            console.log(error.stack);
            throw error;
        }
    }
    static async getReviewUrls(review_status,platform_id) {
        try {
            const query = `select review_link from ${TABLE} where review_status = ? and platform_id =? limit 3;` 
            const result = await pool.query(query,[review_status,platform_id]);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
    static async updateDetailsBulk(mainArr) {
        let result
        try {
            if(mainArr.length > 0){

                const query = `UPDATE ${TABLE} SET 5_star_rating= ?,
                4_star_rating= ?,
                3_star_rating = ?,
                2_star_rating = ?,
                1_star_rating = ?, 
                5_star_review = ?, 
                4_star_review = ?, 
                3_star_review = ?, 
                2_star_review = ?,
                1_star_review = ? 
                 where product_id= ?;`
               
                result = await pool.query(query,mainArr);
                
            }
            
        } catch (error) {
            console.log('error',error.stack);
            
        }
        return result;
    }





}

module.exports = ProductDetailsWorker
