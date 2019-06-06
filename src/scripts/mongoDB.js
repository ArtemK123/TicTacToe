const MongoClient = require("mongodb").MongoClient;

let databaseAPI = {
    name: "MongoDB",
    client: null,
    db: null,

    feedback : {
        collection: null,
        init : function() {
            // for substitutability with sqllite database
        },
        getAllRecords : function(callback) {
            this.collection.find().toArray((err, arr) => {
                if (callback) {callback(err, arr)};
            });        
        },
        _checkRecord : function(record) {
            let validKeys = {
                "name" : "string", 
                "org" : "string", 
                "type": "string",
                "body": "string",
                "file_path": "string"
            };

            for (let key in record) {
                if (typeof record[key] != validKeys[key]) {
                    return false;
                }
            }
            return true;
        },

        insertRecord : function (record, callback) {
            console.log(`Inserting into Feedback: `);
            console.log(record);
            if (this._checkRecord(record)) {
                this.collection.insertOne(record, callback);
            }
            else {
                callback(new Error("Record is not valid"));
            }
        }
    },

    game : {
        collection: null,
        init : function() {
            //for substitutability with sqlite3
        },
        getAllRecords : function(callback) {
            this.collection.find().toArray((err, arr) => {
                console.log(arr);
                if (callback) {callback(err, arr)};
            });   
        },
        _checkRecord : function(record) {
            let validKeys = {
                "source" : "string", 
                "record" : "string", 
                "timestamp": "string"
            };

            for (let key in record) {
                if (typeof record[key] != validKeys[key]) {
                    return false;
                }
            }
            return true;
        },
        insertRecord : function (record, callback) {
            console.log(`Inserting into Game_records: `);
            console.log(record);
            if (this._checkRecord(record)) {
                this.collection.insertOne(record, callback);
            }
            else {
                callback(new Error("Invald record"));
            }
        },
    },
    open: function(callback) {
        const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
        mongoClient.connect((err, client) => {
            if (!err) {
                this.client = client;
                this.db = client.db("tictactoeDB");
                this.feedback.collection = this.db.collection("feedback");
                this.game.collection = this.db.collection("game");        
            }   
            callback(err);
        })
    },


    close: function(callback) {
        if (this.client) {
            this.client.close();
            callback(null);
        }
        else {
            console.log("Client isn`t exist");
            callback(new Error);
        }
    }
}

module.exports = databaseAPI;