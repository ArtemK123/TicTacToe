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

    accounts: {
        collection: null,
        getRecord(query, callback) {
            this.collection.findOne(query, (err, result) => {
                if (callback) {callback(err, result)};
            })
        },
        insertRecord(account, callback) {
            this.collection.insertOne(account, (err, res) => {
                if (callback) {
                    callback(err, res);
                }
            });
        },
        updateRecord(query, changes, callback) {
            this.collection.updateOne(
                query,
                {$set: changes}, 
                callback
            );
        }
    },

    game : {
        collection: null,
        getAllRecords (callback) {
            this.collection.find().toArray((err, arr) => {
                console.log(arr);
                if (callback) {callback(err, arr)};
            });   
        },
        insertRecord (record, callback) {
            console.log(`Inserting into Game_records: `);
            console.log(record);
            this.collection.insertOne(record, callback);
        }
    },
    open (callback) {
        const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
        mongoClient.connect((err, client) => {
            if (!err) {
                this.client = client;
                this.db = client.db("tictactoeDB");
                this.feedback.collection = this.db.collection("feedback");
                this.game.collection = this.db.collection("game");   
                this.accounts.collection = this.db.collection("accounts");     
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
            callback(new Error());
        }
    }
}

module.exports = databaseAPI;