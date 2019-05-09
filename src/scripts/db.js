const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("./storage/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
(err) => {(err != null) ? console.log(err) : console.log("Connected to database")});

let databaseAPI = {
    feedback : {
        init : function(callback) {
            db.run(`CREATE TABLE IF NOT EXISTS Feedback (
                id INTEGER PRIMARY KEY,
                name TEXT,
                org TEXT,
                type TEXT,
                body TEXT,
                file_path TEXT);` , callback);
        },
        getAllRecords : function(callback) {
            let query = `SELECT * FROM Feedback`;
            db.all(query, [], (err, rows) => {
                callback(err, rows);
            });
        },
        insertRecord : function (record, callback) {
            let query = `INSERT INTO Feedback
                (name, org, type, body, file_path) VALUES
                ((?), (?), (?), (?), (?))`;
            console.log(`Inserting into Feedback: `);
            console.log(record);
            let values = [];
            values.push(record['name']);
            values.push(record['org']);
            values.push(record['type']);
            values.push(record['body']);
            values.push(record['file_path']);
            db.run(query, values, callback);
        }
    },
    game : {
        init : function(callback) {
            db.run(`CREATE TABLE IF NOT EXISTS Game_records (
                id INTEGER PRIMARY KEY,
                source TEXT,
                record TEXT,
                timestamp TEXT)`, callback);
        },
        insertRecord : function (record, callback) {
            let query = `INSERT INTO Game_records
                (source, record, timestamp) VALUES
                ((?), (?), (?))`;
            console.log(`Inserting into Game_records: `);
            console.log(record);
            let values = [];
            values.push(record['source']);
            values.push(record['record']);
            values.push(record['timestamp']);
            db.run(query, values, callback);
        },
        getAllRecords : function(callback) {
            let query = `SELECT * FROM Game_records`;
            db.all(query, [], (err, rows) => {
                callback(err, rows);
            });
        },
    }
}

module.exports = databaseAPI;

