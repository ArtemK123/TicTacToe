const http = require("http");
const fs = require("fs");
const url = require("url");
const multiparty = require("multiparty");
const sqlite3 = require("sqlite3");

const server = http.createServer();

let throwError = function(err) {
    if (err) {
        throw err;
    }
}

const db = new sqlite3.Database("./feedback/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, throwError);

db.run(`CREATE TABLE IF NOT EXISTS Feedback (
    id INTEGER PRIMARY KEY,
    name TEXT,
    org TEXT,
    type TEXT,
    body TEXT,
    file_path TEXT);` , throwError);

const typeTable = {
    "html" : "text/html",
    "css" : "text/css",
    "js" : "application/javascript",
    "webm" : "video/webm",
    "json" : "application/json",
    "jpeg" : "image/jpeg",
    "png" : "image/png",
    "jpg" : "image/jpg"
}

let findType = function (url) {
    let expension = url.split('.').pop();
    let type = typeTable[expension];
    return type;
};

let parseDate = function(date) {
    let string = "" + date.getDate() + '-' + 
    (date.getMonth() + 1) + '-' + 
    date.getFullYear() + '__' + 
    date.getHours() + '-' +
    (date.getMinutes().toString().length == 1 ? ("0" + date.getMinutes()) : date.getMinutes())  + '-' +
    date.getMilliseconds();
    return string;
}

let handleForm = function(req) {
    if (req.headers['content-type'].indexOf("multipart/form-data") != -1) {
        let form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            if (err) {throwError(err)};
            let record = {};
            let isValid = false; // preventing of an empty form
            for (let field in fields) {
                record[field] = fields[field][0];
                if (record[field] != "" && field != "type") {
                    isValid = true;
                }
            }
            for (let fileName in files) {
                //only one iteration

                isValid = true;
                let file = files[fileName][0];
                let name = file['originalFilename'].split('.')[0];
                let expension = file['originalFilename'].split('.')[1];
                let date = new Date();
                let path = `./feedback/feedback_files/${name}(${parseDate(date)}).${expension}`;

                fs.copyFile(file['path'], path, throwError);
                // there isn`t any guarantee of successful copying, so image can be not found in 'path' directory
                record['file_path'] = path;
            }

            if (isValid) {
                insertToDatabase(record);
                return true;
            }
        
            return false;
        })
    }
};

let getAllRecords = function(callback) {
    let query = `SELECT * FROM Feedback`;
    db.all(query, [], (err, rows) => {
        let json = JSON.stringify(rows);
        callback(err, json);
    });
};

let insertToDatabase = function (record) {
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
    db.run(query, values, (err) => {(err != null) ? console.log(err) : 0});
};

let sendResponseWithData = function(err, res, data, content_type) {
    if (err) {
        if (err.code == "ENOENT") {
            res.writeHead(404, {"Content-type" : "text/plain"});
            res.end("404 - Not found");
        }
        else {
            res.writeHead(500, {"Content-type" : "text/plain"});
            res.end("500 - Server Error");
        }
    }
    else {
        res.writeHead(200, {"Content-type" : content_type});
        res.end(data);
    }
}

let GETRequest = function (req, res) {
    let path = url.parse(req.url).pathname;
    if (path.indexOf(".") == -1) {
        path += ".html";
    }
    let type = findType(path);
    let encode = (type.indexOf('text') != -1) ? "utf-8" : null;
    if (type == "application/json") {
        let file = path.split('/').pop();
        if (file == "allRecords.json") {
            getAllRecords((err, data) => {
                sendResponseWithData(err, res, data, type);    
            })                    
        }
    }
    else {
        fs.readFile("." + path, encode, (err, data) => {
            sendResponseWithData(err, res, data, type);
        });
    }
};

let POSTRequest = function(req, res) {
    if (req.headers['content-type'].indexOf("form") != -1) {
        let form_status = (handleForm(req)) ? "success" : "denied";
        res.writeHead(302, {
            'Location': req.url,
            'Method': 'GET',
            'form_status': form_status
        });
        res.end();
    }
}

server.on("request", (req, res) => {
    try {
        if (req.method == "GET") {
            res = GETRequest(req, res);
        }
        else if (req.method == "POST") {
            res = POSTRequest(req, res);
        }
    }
    catch (err) {
        console.log(err.message);
    }
});

server.listen(8080, () => console.log("Server running on port 8080"));