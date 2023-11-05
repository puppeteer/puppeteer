const util = require('util');
const mysql = require('mysql');

const pool = require("../database/database")
let TABLE = "product_meta" 
class ProductMetaWorker {
    
    static async getkeywordsAmazon(status) {
        try {
            const query = `select id,name from ${TABLE} where crawl_status_amazon = ? limit 3;` ;
            
            const result = await pool.query(query,[status]);

            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
    static async getkeywordsFlipkart(status) {
        try {
            const query = `select id,name from ${TABLE} where crawl_status_flipkart = ? limit 3;`;
            
            const result = await pool.query(query,[status]);

            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
    static async bulkupdateStatusByIdsAmazon(status,ids){ // bulk A to O
        try {
            const query = `UPDATE ${TABLE} SET crawl_status_amazon= ? WHERE id IN (${ids});`; //  (${ids})= '1,3,4'
            const result = await pool.query(query,[status]);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        }
    }
    static async bulkupdateStatusByIdsFlipkart(status,ids){ // bulk A to O
        try {
            const query = `UPDATE ${TABLE} SET crawl_status_flipkart = ? WHERE id IN (${ids});`;
            const result = await pool.query(query,[status]);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        }
    }

    static async updateAmazonStatusById(status,id) { // O to C
        try {
            let query = `update ${TABLE} set crawl_status_amazon = ? where id =?`;
            console.log('query ',query[status, id])
            const result = await pool.query(query,[status, id]);
            //console.log('result ',result)
           // console.log(result[0].stateid);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
    static async updateFlipkartStatusById(status,id) { 
        try {
            let query = `update ${TABLE} set crawl_status_flipkart = ? where id =?`;
            // console.log('query ',query[status, id])
            const result = await pool.query(query,[status, id]);
            //console.log('result ',result)
           // console.log(result[0].stateid);
            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
   




}

module.exports = ProductMetaWorker