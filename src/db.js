const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("./feedback/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
(err) => {(err != null) ? console.log(err) : 0});

/*let sql = `SELECT * FROM Feedback`;
let sqlDrop = `DROP table Feedback`;
let sqlClear = `DELETE FROM Feedback WHERE id>-1`;

db.all(sql, [], (err, rows)=>{  
    if(err){  
        console.log(err)
    }  
    console.log(rows);
}); */ 

let databaseAPI = {
    init : function(callback) {
        db.run(`CREATE TABLE IF NOT EXISTS Feedback (
            id INTEGER PRIMARY KEY,
            name TEXT,
            org TEXT,
            type TEXT,
            body TEXT,
            file_path TEXT);` , 
        (err) => {callback(err)});
    },
    getAllRecords : function(callback) {
        let query = `SELECT * FROM Feedback`;
        db.all(query, [], (err, rows) => {
            let json = JSON.stringify(rows);
            callback(err, json);
        });
    },
    insertRecord : function (record, callback) {
        let query = `INSERT INTO Feedback
            (name, org, type, body, file_path) VALUES
            ((?), (?), (?), (?), (?))`;
        console.log(record);
        let values = [];
        values[0] = record['name'];
        values[1] = record['org'];
        values[2] = record['type'];
        values[3] = record['body'];
        values[4] = record['file_path'];
        db.run(query, values, callback);
    }
}

module.exports = databaseAPI;