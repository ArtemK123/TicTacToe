const http = require("http");
const fs = require("fs");
const url = require("url");
const multiparty = require("multiparty");
const sqlite3 = require("sqlite3");

const server = http.createServer();
const db = new sqlite3.Database("./feedback/database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
    (err) => {(err != null) ? console.log(err) : 0});

db.run(`CREATE TABLE IF NOT EXISTS Feedback (
    id INTEGER PRIMARY KEY,
    name TEXT,
    org TEXT,
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

let copyFile = function(from, to) {
    if (fs.existsSync(to)) {
        let path = to.split('.');
        let index = 1;
        while(fs.existsSync("." + path[1] + "_" + index + "." + path[2])) {
            index++;
        }
        to = "." + path[1] + "_" + index + "." + path[2];
    }
    fs.copyFileSync(from, to);
    return to;
}

let handleForm = function(req) {
    if (req.headers['content-type'].indexOf("multipart/form-data") != -1) {
        let form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            let record = {};
            let empty = true;
            for (let field in fields) {
                record[field] = fields[field][0];
                if (record[field] != "" && field != "type") {
                    empty = false;
                }
            }
            if (!empty) {
                let pathes = {};
                for (let fileName in files) {
                    let file = files[fileName][0];
                    let name = file['originalFilename'];
                    let path = "./feedback/feedback_files/" + name;
                    path = copyFile(file['path'], path);
                    pathes[name] = path;
                }
                for (let file in pathes) {
                    record['file_path'] = pathes[file];
                }
                insertToDatabase(record);
                return true;
            }

            return false;
        })
    }
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
    if (req.method == "GET") {
        res = GETRequest(req, res);
    }
    else if (req.method == "POST") {
        res = POSTRequest(req, res);
    }
});

server.listen(8080, () => console.log("Server enabled"));