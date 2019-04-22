const http = require("http");
const fs = require("fs");
const url = require("url");
const querystring = require("querystring");
const sqlite3 = require("sqlite3");

const server = http.createServer();
const db = new sqlite3.Database("./feedback/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
    (err) => {(err != null) ? console.log(err) : 0});

db.run(`CREATE TABLE IF NOT EXISTS Feedback (
    form_id INTEGER PRIMARY KEY,
    name TEXT,
    organization TEXT,
    type TEXT,
    body TEXT,
    file_path TEXT);` ,
    [], (err) => {(err != null) ? console.log(err) : 0});

const typeTable = {
    "text/html": /.html/,
    "text/css": /.css/,
    "application/javascript": /.js/,
    "video/webm": /.webm/
}

let findType = function (url) {
    for (let key in typeTable) {
        if (url.search(typeTable[key]) != -1) {
            return key;
        }
    }
    return null;
};

let GETRequest = function (req, res) {
    let path = url.parse(req.url).pathname;
    if (path.indexOf(".") == -1) {
        path += ".html";
    }
    let type = findType(path);
    try {
        if (type == null || !fs.existsSync("." + path)) {
            throw new Error("not found");
        }
        res.writeHead(200, {"Content-type" : type});
        if (type.search(/^text/) == 0) {
            res.end(fs.readFileSync("." + path, "utf-8"));
        }
        else {
            res.end(fs.readFileSync("." + path));
        }
    } catch (err) {
        if (err.message == "not found") {
            res.writeHead(404, {"Content-type" : "text/plain"});
            res.end("404 - Not found");
        }
        else {
            res.writeHead(500, {"Content-type" : "text/plain"});
            res.end("500 - Server Error");
        }
    }
    return res;
};

let collectRequestData = function(request, callback) {
    const FORM_URLENCODED = 'multipart/form-data'
    if (request.headers['content-type'] === FORM_URLENCODED) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(querystring.parse(body));
        });
    }
    else {
        callback(null);
    }
};

let writeFormToDatabase = function(data) {
    let query = `INSERT INTO Feedback
    (name, organization, type, body, file_path) 
    VALUES (?), (?), (?), (?), (?)`;
    console.log(data);
}

let POSTRequest = function(req, res) {
    if (req.headers['content-type'].indexOf("form") != -1) {
        collectRequestData(req, writeFormToDatabase);
    }
    res.writeHead(302, {
        'Location': req.url,
        'Method': 'GET'
    });
    res.end();
}

server.on("request", (req, res) => {
    if (req.method == "GET") {
        res = GETRequest(req, res);
    }
    else if (req.method == "POST") {
        res = POSTRequest(req, res);
    }
});

server.listen(8080, () => console.log("Server enabled"));