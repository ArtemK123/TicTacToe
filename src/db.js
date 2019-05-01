const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("./feedback/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
(err) => {(err != null) ? console.log(err) : 0});

let sql = `SELECT * FROM Feedback`;
let sqlDrop = `DROP table Feedback`;
let sqlClear = `DELETE FROM Feedback WHERE id>-1`;

db.all(sql, [], (err, rows)=>{  
    if(err){  
        console.log(err)
    }  
    console.log(rows);
});  