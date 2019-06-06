const http = require("http");
const fs = require("fs");
const url = require("url");
const multiparty = require("multiparty");
const database = require(`${__dirname}/scripts/mongoDB.js`);

database.open((err) => {
    if (err) {
        throw err;
    }
    console.log("Connected to database"); 
});

const server = http.createServer();

let throwError = function(err) {
    if (err) {
        throw err;
    }
}

const feedbackDB = database.feedback;
const gameDB = database.game;

const typeTable = {
    "html" : "text/html",
    "css" : "text/css",
    "js" : "application/javascript",
    "webm" : "video/webm",
    "json" : "application/json",
    "jpeg" : "image/jpeg",
    "png" : "image/png",
    "jpg" : "image/jpg",
    "pug" : "text/html"
}

let parseDate = function(date) {
    let string = "" + date.getDate() + '-' + 
    (date.getMonth() + 1) + '-' + 
    date.getFullYear() + '_' + 
    date.getHours() + '-' +
    (date.getMinutes().toString().length === 1 ? ("0" + date.getMinutes()) : date.getMinutes())  + '-' +
    date.getMilliseconds();
    return string;
}

let parseQueryToObj = function(query) {
    let res = {};
    let searchParams = new url.URLSearchParams(query);
    searchParams.forEach((value, name) => {
        res[name] = value;
    });
    return res;
}

let readPostBody = function(req, res, callback) {
    let queryData = "";
    req.on('data', function(data) {
        queryData += data;
        if(queryData.length > 1e6) {
            queryData = "";
            res.writeHead(413);
            res.end();
            req.connection.destroy();
        }
    });

    req.on('end', function() {
        callback(queryData);
    });
}

let handleForm = function(req, callback) {
    if (req.headers['content-type'].indexOf("multipart/form-data") !== -1) {
        let form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            if (err) {throwError(err)};
            let record = {};
            let isValid = false; // preventing of an empty form
            for (let field in fields) {
                record[field] = fields[field][0];
                if (record[field] !== "" && field !== "type") {
                    isValid = true;
                }
            }
            record['file_path'] = "";
            let writeRecord = (err) => {
                if (isValid) {
                    feedbackDB.insertRecord(record, throwError);
                }
                callback(err, isValid);
            }
            if (files) {
                let file = files["file"][0];
                let name = file['originalFilename'].split('.')[0];
                let expension = file['originalFilename'].split('.')[1];
                let date = new Date();
                let path = `/storage/feedback_files/${name}(${parseDate(date)}).${expension}`;
                
                fs.copyFile(file['path'], __dirname + path, (err) => {    
                    if (!err) {
                        isValid = true;
                    };
                    record['file_path'] = "." + path;
                    writeRecord(err);
                });
            }
            else{
                writeRecord();
            }
        })
    }
};

let sendResponseWithData = function(err, res, data, content_type) {
    if (err) {
        if (err.code === "ENOENT") {
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

let handleMap = {
    "/contacts" : function (req, res) {
            if (req.method === "POST") {
                handleForm(req, (err, successful) => {
                if (err) {
                    res.writeHead(500, "Server cannot handle form");
                    res.end();
                    throw err;
                }
                else {
                    if (successful) {
                        res.writeHead(200, "OK");    
                    }
                    else {
                        res.writeHead(400, "Error");
                    }
                    res.end();
                }
            })
        }
    },
    "/storage/database" : function (req, res) {
        if (req.method === "GET") {
            let queries = parseQueryToObj(url.parse(req.url).query);
            let type = "apllication/json";
            if (queries["table"] === "feedback") {
                feedbackDB.getAllRecords((err, rows) => {
                    let data = JSON.stringify(rows);
                    sendResponseWithData(err, res, data, type);
                });
            }
            else if (queries["table"] === "game_records") {
                gameDB.getAllRecords((err, rows) => {
                    let data = JSON.stringify(rows);
                    sendResponseWithData(err, res, data, type);
                })
            }
        }
    },
    "/game" : function(req, res) {
        let path = `${__dirname}` + url.parse(req.url).pathname;
        if (req.method === "POST") {
            readPostBody(req, (queryData) => {
                let record = JSON.parse(queryData);
                gameDB.insertRecord(record, (err) => {
                    if (err) {
                        res.writeHead(500, "Error while inserting in database");
                        res.end();
                        throw err;
                    }
                    else {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                });
            })
        }
    },
    //default option
    "" : function(req, res) {
        if (req.method === "GET") {
            let path = url.parse(req.url).pathname;
            let expension = path.split('.').pop();
            let type = typeTable[expension];
            let encode = null;
            if (type !== undefined && type.indexOf('text') !== -1) {
                encode = (type.indexOf('text') !== -1) ? "utf-8" : null;    
            }
            fs.readFile(`${__dirname}` + path, encode, (err, data) => {
                sendResponseWithData(err, res, data, type);
            });
        }
    }
}

server.on("request", (req, res) => {
    try {
        //check cookie
        let path = url.parse(req.url).pathname;
        for (let handler in handleMap) {
            if (path.indexOf(handler) !== -1) {
                handleMap[handler](req, res);
                break;
            }
        }
        // else login
    }
    catch (err) {
        console.log(err);
    }
});

server.listen(8080, () => console.log("Server running on port 8080"));
