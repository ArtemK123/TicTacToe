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

let TicTacToe = function() {
    //global class for managing games

    this.games = [];
    this.freeUsers = [];
    this.users = {};
    
    this.start = (user, callback) => {
        if (this.freeUsers.length > 0) {
            let opponent = this.freeUsers.shift();
            let game = new Game(user, opponent);
            let id = this.games.length
            this.games[id] = game;
            this.users[user] = id;
            this.users[opponent] = id;
            callback(true, id, opponent);
        }
        else {
            this.freeUsers.push(user);
            callback(false);
        }
    }
    this.end = (user, callback) => {
        let indexInFree = this.freeUsers.indexOf(user);
        if (indexInFree !== -1) {
            this.freeUsers.splice(indexInFree, 1);
        }
        if (this.users[user] === undefined) return;
        let gameId = this.users[user];  
        if(this.games[gameId] === undefined) return;
        let game = this.games[gameId];
        let winner = null;
        let opponent = null
        // wierd winner behaviour - should be reversed
        if (user === game.x) {
            winner = "X";
            opponent = game.o
        }
        else {
            winner = "O"
            opponent = game.x;
        }
        delete this.games[gameId];
        game = null;
        delete this.users[user];
        callback(opponent, winner);
    }
    this.step = (gameId, i, callback) => {
        this.games[gameId].step(i, callback);
    }
}

let Game = function(user, opponent) {
    this.board = Array(24).fill(null);
    this.x = user;
    this.o = opponent;
    this.state = null;
    this.turn = "X";
    this.winningCombinations = null;

    this.checkWinner = () => {
        let isDraw = true;
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === null) {
                isDraw = false;
                break;
            }
        }
        if (isDraw) return "draw";
        for (let i = 0; i < this.winningCombinations.length; i++) {
            let positions = this.winningCombinations[i];
            let winner = this.board[positions[0]];
            let isWinner = true;
            for (let i = 1; i < positions.length; i++) {
                if (!winner || winner !== this.board[positions[i]]) {
                    isWinner = false;          
                }
            } 
            if (isWinner) {
                return winner;
            }
        }
        return null;
    }
    this._createCombinations = function() {
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
    this.winningCombinations = this._createCombinations();
    this.step = function (i, callback) {
        if (this.board[i] != null) return;
        this.board[i] = this.turn;
        this.turn = (this.turn === "X") ? "O" : "X";
        callback(this.checkWinner(), this.board, this.turn);
    }
}

let tictactoe = new TicTacToe();

wss.on('connection', function connection(client) {
    console.log(`New player connected`);
    client.on('message', function incoming(json) {
        try {
            let message = JSON.parse(json);
            accountsDB.getRecord({'jwt' : message.jwt}, (err, record) => {
                if (!record) {
                    client.send(JSON.stringify({query: "redirect", redirectUrl: "/login"}));
                    return;
                }
                client.jwt = jwt;
                if (message.query === "start") {
                    tictactoe.start(client, (isStarted, gameId, opponent) => {
                        if (isStarted) {
                            client.send(JSON.stringify({
                                query: "start",
                                sign: "O",
                                "gameId": gameId
                            }));
                            opponent.send(JSON.stringify({
                                query: "start",
                                sign: "X",
                                "gameId": gameId
                            }));
                        }
                        else {
                            client.send(JSON.stringify({query: "wait"}));
                        }
                    })
                }
                else if (message.query === "step") {
                    tictactoe.step(message.gameId, message.i, (winner, footPrint, turn) => {
                        let game = tictactoe.games[message.gameId];
                        let record = JSON.stringify({
                            query: "step",
                            'footPrint': footPrint,
                            'turn': (winner) ? winner : turn
                        });
                        game.x.send(record);
                        game.o.send(record);
                        if (winner) {
                            record = JSON.stringify({
                                query: "gameover",
                                winner: winner
                            });
                            game.x.send(record);
                            game.o.send(record);
                            if (winner !== "draw") {
                                accountsDB.getRecord({jwt: game.x.jwt}, (err, record) => {
                                    if (record) {
                                        (winner === "X") ? record.wins++ : record.loses++;
                                        accountsDB.updateRecord({jwt: record.jwt}, record, () => {
                                            console.log("X account updated");    
                                        });    
                                    }
                                })
                                accountsDB.getRecord({jwt: game.o.jwt}, (err, record) => {
                                    if (record) {
                                        (winner === "O") ? record.wins++ : record.loses++;
                                        accountsDB.updateRecord({jwt: record.jwt}, record, () => {
                                            console.log("O account updated");    
                                        });    
                                    }
                                })
                            }
                        };
                    });
                }
                else if (message.query === "disconnect") {
                    tictactoe.end(client, (opponent, winner) => {
                        console.log(`Player disconnected`);
                        accountsDB.getRecord({jwt: client.jwt}, (err, record) => {
                            if (record) {
                                record.loses++;
                                accountsDB.updateRecord({jwt: record.jwt}, record, () => {
                                    console.log("Liver account updated");
                                });    
                            }
                        })
                        if (opponent) {
                            opponent.send(JSON.stringify({
                                query: "gameover",
                                winner
                            }));
                            accountsDB.getRecord({jwt: opponent.jwt}, (err, record) => {
                                if (record) {
                                    record.wins++;
                                    accountsDB.updateRecord({jwt: record.jwt}, record, () => {
                                        console.log("Winner account updated");
                                    });    
                                }
                            })
                        }                        
                    })
                }
            })
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
