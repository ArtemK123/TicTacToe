const http = require("http");
const fs = require("fs");
const url = require("url");
const multiparty = require("multiparty");

const server = http.createServer();

const database = require('./db.js');
let throwError = function(err) {
    if (err) {
        throw err;
    }
}

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
    date.getFullYear() + '_' + 
    date.getHours() + '-' +
    (date.getMinutes().toString().length == 1 ? ("0" + date.getMinutes()) : date.getMinutes())  + '-' +
    date.getMilliseconds();
    return string;
}

let handleForm = function(req, callback) {
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
            record['file_path'] = undefined;
            let writeRecord = (err) => {
                if (isValid) {
                    database.insertRecord(record, throwError);
                }
                callback(err, isValid);
            }
            for (let fileName in files) {
                //only one iteratiot

                let file = files[fileName][0];
                if (file['size'] == 0) {
                    writeRecord();
                }

                let name = file['originalFilename'].split('.')[0];
                let expension = file['originalFilename'].split('.')[1];
                let date = new Date();
                let path = `./feedback/feedback_files/${name}(${parseDate(date)}).${expension}`;
                
                fs.copyFile(file['path'], path, (err) => {    
                    if (!err) {
                        isValid = true;
                    };
                    record['file_path'] = path;
                    writeRecord(err);
                });
            }
        })
    }
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
            database.getAllRecords((err, data) => {
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
        handleForm(req, (err, successful) => {
            if (err) {
                res.writeHead(500, "Cannot handle form");
                throw err;
            }
            let path = url.parse(req.url).pathname;
            fs.readFile("." + path, "utf-8", (err, html) => {
                if (err) {
                    throw err;
                }
                let elem;
                if (successful) {
                    elem = `<span id="form_success" style="display: inline">&#9745;</span>`;               
                }
                else {
                    elem = `<span id="form_denied" style="display: inline">&#9746;</span>`;
                }
                let start = html.slice(0, html.indexOf('</form>'));
                let end = html.slice(html.indexOf("</form>"));
                html = start + elem + end;
                res.writeHead(200, {"Content-type" : "text/html"});
                res.end(html);
            })    
        })
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