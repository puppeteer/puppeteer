const util = require('util');
const mysql = require('mysql');

const pool = require("../database/database")
let TABLE = "platform" 
class PlatformWorker {
    
    static async getPlatformId(platform_name) {
        try {
            const query = `select platform_id from ${TABLE} where platform_name = ? ;` ;
            
            const result = await pool.query(query,[platform_name]);

            return result;
        } catch (error) {
            console.log(error.stack);
            throw error;
        } 
    }
}
module.exports = PlatformWorker