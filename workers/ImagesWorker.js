const util = require('util');
const mysql = require('mysql');

const pool = require("../database/database")
let TABLE = "images" 
class ImagesWorker {
    
    static async insertImageUrls(imgarr) {
        let result
        try {
            if(imgarr.length > 0){

                const query = 'INSERT IGNORE INTO `images` ( product_id,image_link) VALUES ?;';
          
                
                result = await pool.query(query,[imgarr]);
                
            }
            
        } catch (error) {
            console.log('error',error.stack);
            
        }
        return result;
    }
}
module.exports = ImagesWorker