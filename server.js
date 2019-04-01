const http = require("http");
const fs = require("fs");

const server = http.createServer();
 
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

server.on("request", (req, res) => {
    try {
        url = (req.url == "/") ? "/index.html" : req.url;
        let type = findType(url);
        url = "." + url;
        if (type == null || !fs.existsSync(url)) {
            throw new Error("not found");
        }
        if (type.search(/^text/) == 0) {
            res.end(fs.readFileSync(url, "utf-8"));
        }
        else {
            res.end(fs.readFileSync(url));
        }
        res.writeHead(200, {"Content-type" : type});
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
});

server.listen(8080, () => console.log("Server enabled"));