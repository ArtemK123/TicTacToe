const sqlite3 = require('sqlite3');

let databaseAPI = {
    name: "Sqlite3",
    feedback : {
        db: null,
        init : function(callback) {
            this.db.run(`CREATE TABLE IF NOT EXISTS Feedback (
                id INTEGER PRIMARY KEY,
                name TEXT,
                org TEXT,
                type TEXT,
                body TEXT,
                file_path TEXT);` , callback);
        },
        getAllRecords : function(callback) {
            let query = `SELECT * FROM Feedback`;
            this.db.all(query, [], (err, rows) => {
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
            this.db.run(query, values, callback);
        }
    },
    game : {
        db: null,
        init : function(callback) {
            this.db.run(`CREATE TABLE IF NOT EXISTS Game_records (
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
            this.db.run(query, values, callback);
        },
        getAllRecords : function(callback) {
            let query = `SELECT * FROM Game_records`;
            this.db.all(query, [], (err, rows) => {
                callback(err, rows);
            });
        },
    },
    open: function(callback) {
        let db = new sqlite3.Database(`${__dirname}/../storage/database.db`, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
            this.feedback.db = db;
            this.game.db = db;         
            callback(err);
        });
    },
    
    close: function() {

    }
}

module.exports = databaseAPI;
