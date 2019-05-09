const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("./feedback/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
(err) => {(err != null) ? console.log(err) : console.log("Connected to database")});

let showFeedback = `SELECT * FROM Feedback`;
let showGame = `SELECT * FROM Game_records`;
let clearFeedback = `DELETE FROM Feedback WHERE id>-1`;
let clearGame = `DELETE FROM Game_records WHERE id>-1`;
let dropFeedback = `DROP table Feedback`;
let dropGame = `DROP table Game_records`;

db.all(clearGame, [], (err, rows)=>{  
    if(err){  
        console.log(err)
    }  
    console.log(rows);
});