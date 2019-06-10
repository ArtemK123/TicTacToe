const http = require("http");
const fs = require("fs");
const url = require("url");
const multiparty = require("multiparty");
const database = require(`${__dirname}/scripts/mongoDB.js`);
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

database.open((err) => {
    if (err) {
        throw err;
    }
    console.log("Connected to database"); 
});

const server = http.createServer();
server.listen(8080, () => console.log("Node server is running on port 8080"));
const wss = new WebSocket.Server({ port: 8000 }, () => {console.log("WebSocket server is running on port 8000")});

let rooms = [];
const jwtKey = "shhhh";

const feedbackDB = database.feedback;
const gameDB = database.game;
const accountsDB = database.accounts;
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
};

let parseDate = function(date) {
    let string = "" + date.getDate() + '-' + 
    (date.getMonth() + 1) + '-' + 
    date.getFullYear() + '_' + 
    date.getHours() + '-' +
    (date.getMinutes().toString().length === 1 ? ("0" + date.getMinutes()) : date.getMinutes())  + '-' +
    date.getMilliseconds();
    return string;
};

let parseQueryToObj = function(query) {
    let res = {};
    let searchParams = new url.URLSearchParams(query);
    searchParams.forEach((value, name) => {
        res[name] = value;
    });
    return res;
};

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
        callback(req, res, queryData);
    });
};

let handleForm = function(req, callback) {
    if (req.headers['content-type'].indexOf("multipart/form-data") !== -1) {
        let form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            if (err) throw err;
            let record = {};
            let isValid = false; // preventing of an empty form
            for (let field of ['name', 'org', 'type', 'body']) {
                record[field] = fields[field][0];
                if (record[field] !== "" && field !== "type") {
                    isValid = true;
                }
            }
            record['file_path'] = "";
            let writeRecord = (err) => {
                if (isValid) {
                    feedbackDB.insertRecord(record, (err) => {if (err) throw err});
                }
                callback(err, isValid);
            }
            if (files["file"]) {
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
            else {
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
                    res.writeHead(204, "No content");
                }
                res.end();
            }
        })}
    },
    "/registration" : function(req, res) {
        if (req.method === "GET") {
            let queries = parseQueryToObj(url.parse(req.url).query);
            accountsDB.getRecord({email: queries['email']}, (err, record) => {
                if (err) {
                    res.writeHead(500);
                    res.end();
                    throw err;
                }
                if (record) {
                    res.writeHead(200, "Account is found");
                    res.end(JSON.stringify({"found": true}));            
                }
                else {
                    res.writeHead(203, "Account isn`t found");
                    res.end(JSON.stringify({"found": false}));
                }
            })
        }
        else if (req.method === "POST") {
            readPostBody(req, res, (req, res, data) => {
                let newAccount = JSON.parse(data).account;
                newAccount.jwt = "";
                newAccount.isAdmin = false;
                newAccount.loses = 0;
                newAccount.wins = 0;
                console.log("New user created", newAccount);
                accountsDB.insertRecord(newAccount, (err, result) => {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                        throw res;
                    }
                    else {
                        res.writeHead(200);
                        res.end();
                    };
                });    
            })
        }
    },
    "/login": function(req, res) {
        if (req.method === "GET") {
            let query = parseQueryToObj(url.parse(req.url).query);
            accountsDB.getRecord({email: query.email}, (err, result) => {
                if (err) throw err;
                if (!result) {
                    res.writeHead(203, "Account with this email not found. Please, create new account");
                    res.end();
                }
                else if (result.password !== query['password']) {
                    res.writeHead(204, "Wrong password");
                    res.end();
                } 
                else {
                    // user identified - jwt will be created
                    let token = jwt.sign({email: result.email, admin: result.isAdmin, name: result.name}, jwtKey);
                    res.writeHead(200, "Access allowed");
                    res.end(JSON.stringify({jwt: token}));
                    result.jwt = token;
                    accountsDB.updateRecord({email: result.email}, result, (err, res) => {if (err) throw err});
                }
            });
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
        if (req.method === "POST") {
            readPostBody(req, (queryData) => {
                let record = JSON.parse(queryData.account);
                gameDB.insertRecord(record, (err) => {
                    if (err) { 
                        throw err;
                    }
                    else {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                });
            })
        }
        else if (req.method === 'GET') {
            let vars = parseQueryToObj(url.parse(req.url).query);
            if (vars.query === "getName") {
                accountsDB.getRecord({jwt: vars.jwt}, (err, record) => {
                    if (record) {
                        res.writeHead(200, "Found", {'Content-type' : 'application/json'});
                        res.end(JSON.stringify({"name": record.name}));
                    }
                    else {
                        res.writeHead(203, "Not found");
                        res.end();
                    }
                })
            } 
            else if (vars.query === "startGame") {
                accountsDB.getRecord({jwt: vars.jwt}, (err, record) => {
                    if (err) throw err;
                    if (!record) {
                        res.writeHead(203, "Player should sign in first");
                        res.end(JSON.stringify({redirectUrl:"/login", result: "redirect"}));    
                    }
                    else {
                        let availableRoom = null;
                        for (let room of rooms) {
                            if (room.clients.length < 2) {
                                availableRoom = room;
                            }
                        }
                        if (!availableRoom) {
                            let index = rooms.length;
                            if (index > 20) {
                                res.writeHead(204, "All rooms are full");
                                res.end(JSON.stringify({result: "denied"}));
                            }
                            availableRoom = {
                                id: index,
                                clients: [],
                                footPrint: null,
                                isXNext: true,
                                isPlaying: false
                            };
                            rooms.push(availableRoom);
                        }
                        // placeholder for preventing concurency issues
                        availableRoom.clients.push("Placeholder");
                        res.writeHead(200, "Found");
                        res.end(JSON.stringify({roomId: availableRoom.id, result: "found"}));
                    } 
                })
            }
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

let createCombinations = function() {
    let winningCombinations = [];
    let diagonalCombination1 = [];
    let diagonalCombination2 = [];

    for (let i = 0; i < 5; i++) {
        let horizontalCombination = [];
        let verticalCombination = [];
        for (let j = 0; j < 5; j++) {
            horizontalCombination.push(i * 5 + j);
            verticalCombination.push(j * 5 + i);
        }
        winningCombinations.push(horizontalCombination);
        winningCombinations.push(verticalCombination);
        diagonalCombination1.push(5 * i + i);
        diagonalCombination2.push(5 * i + (4 - i));
    }
    winningCombinations.push(diagonalCombination1);
    winningCombinations.push(diagonalCombination2);
    return winningCombinations;
}

wss.checkWinner = function(footPrint) {
    for (let i = 0; i < this.winningCombinations.length; i++) {
        let positions = this.winningCombinations[i];
        let winner = footPrint[positions[0]];
        let isWinner = true;
        for (let i = 1; i < positions.length; i++) {
            if (!winner || winner !== footPrint[positions[i]]) {
                isWinner = false;          
            }
        } 
        if (isWinner) {
            return winner;
        }
    }
    return null
}

wss.winningCombinations = createCombinations();

wss.on('connection', function connection(client) {
    client.on('message', function incoming(json) {
        try {
            let message = JSON.parse(json);
            if (message.query === "start") {
                accountsDB.getRecord({'jwt' : message.jwt}, (err, record) => {
                    if (!record) {
                        client.send(JSON.stringify({query: "redirect", redirectUrl: "/login"}));
                    }
                    else {
                        //create new game here
                    }
                });

            }
            else if (message.query === "turn") {
                accountsDB.getRecord({'jwt' : message.jwt}, (err, record) => {
                    if (!record) {
                        client.send(JSON.stringify({query: "redirect", redirectUrl: "/login"}));
                    }
                    else {
                        // Change board. Check winner.
                    }
                });
            }

            //     let index = rooms[request.roomId].clients.indexOf("Placeholder");
            //     if (index === 0) {
            //         // first player in the room
            //         rooms[request.roomId].clients[index] = client;
            //         client.room = request.roomId;
            //         client.jwt = request.jwt;
            //         client.sign = "X";
            //         client.send(JSON.stringify({query: "change_state", state: "serching", sign: "X"}));
            //     }
            //     else if (index === 1) {
            //         // second player in the room
            //         rooms[request.roomId].clients[index] = client;
            //         client.room = request.roomId;
            //         client.room.isPlaying = true;
            //         client.sign = "O";
            //         client.jwt = request.jwt;
            //         client.send(JSON.stringify({query: "change_state", state: "found", sign: "O"}));
            //     }
            //     else {
            //         throw new Error("Wrong index of client");
            //     }
            // }
            // else if (request.query === "make_move") {
            //     if (request.jwt !== client.jwt) throw new Error("Wrong jwt");
            //     let sign = (client.room.isXNext) ? "X" : "O";
            //     client.room.isXNext = !client.room.isXNext;
            //     client.room.footPrint[request.i] = sign;
            //     let pushMessageToRoom = function(message, room) {
            //         room.clients[0].send(message);
            //         room.clients[1].send(message);
            //     }
            //     let winner = wss.checkWinner(client.room.footPrint);
            //     if (winner) {
            //         // updating accounts
            //         accountsDB.getRecord({jwt: client.room.clients[0].jwt}, (err, record) => {
            //             (winner === "X") ? record.wins++ : record.loses++;
            //             accountsDB.updateRecord({jwt: client.room.clients[0].jwt}, record);
            //         });
            //         accountsDB.getRecord({jwt: client.room.clients[1].jwt}, (err, record) => {
            //             (winner === "O") ? record.wins++ : record.loses++;
            //             accountsDB.updateRecord({jwt: client.room.clients[1].jwt}, record);
            //         });
            //         pushMessageToRoom({query: "change_state", "winner": winner, footPrint: client.room.footPrint}, client.room);
            //     }
            //     pushMessageToRoom({query: "new_turn", footPrint: client.room.footPrint, isXNext: client.room.isXNext}, client.room);
            // } 
        } 
        catch (err) {
            console.log(err.message);
        }
    });
});

server.on("request", (req, res) => {
    try {
        let path = url.parse(req.url).pathname;
        for (let handler in handleMap) {
            if (path.indexOf(handler) !== -1) {
                handleMap[handler](req, res);
                break;
            }
        }
    }
    catch (err) {
        console.log(err);
        res.writeHead(500);
        res.end();
    }
});
