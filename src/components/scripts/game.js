let makeTimestamp = function() {
    let date = new Date();
    let timestamp = "";
    timestamp += date.getDate() + "." +
    (date.getMonth() + 1) + "." +
    date.getFullYear() + " - " +
    date.getHours() + ':' +
    (date.getMinutes().toString().length == 1 ? ("0" + date.getMinutes()) : date.getMinutes()) + ":" +
    date.getMilliseconds();
    return timestamp;
}

let sendPostMessage = function(args) {
    let request = new XMLHttpRequest();
    request.open("POST", "index.html", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(args));
}

let sendStartMessage = function() {
    let record = {
        source : "system",
        record : "Game started",
        timestamp : makeTimestamp()
    }
    sendPostMessage(record);
}

let sendTurnMessage = function(player, cell) {
    let record = {
        source : player,
        record : cell.id,
        timestamp : makeTimestamp()
    }
    sendPostMessage(record);
}

let sendClearMessage = function() {
    let record = {
        source : "system",
        record : "Board was cleared",
        timestamp : makeTimestamp()
    }
    sendPostMessage(record);
}

let sendWinnerMessage = function(winner) {
    let record = {
        source : "system",
        record : `${winner} has won`,
        timestamp : makeTimestamp()
    }
    sendPostMessage(record);
}

window.onload = function () {
    let turn = 0;
    let pause = false;
    sendStartMessage();

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
    
    document.getElementById('gameboard').onclick = function(event) {
        if (!pause && event.target.className == 'cell' && event.target.innerHTML == "") {
            let player = "";
            if (turn == 0) {
                player = "X";
            }
            else {
                player = "O";
            }
            event.target.innerHTML = player
            sendTurnMessage(player, event.target);
            turn = (turn + 1) % 2;
            // winner can be null - game continues in this case
            let winner = checkWinner();
            if (winner) {
                document.getElementById(`${winner}_score`).innerHTML = parseInt(document.getElementById(`${winner}_score`).innerHTML, 10) + 1;
                pause = true;
                sendWinnerMessage(winner);
                alert(`${winner} - winner`);
            }
        }
    }

    let checkWinner = function() {
        let cells = document.getElementsByClassName("cell");
        for (let comb of winningCombinations) {
            let sign = (cells[comb[0]].innerHTML != "") ? cells[comb[0]].innerHTML : null;
            let match = true;
            for (let pos of comb) {
                if (cells[pos].innerHTML != sign) {
                    match = false;
                }
            }
            if (match) {
                return sign;
            }
        }
        return null;
    }

    document.getElementById('clear_button').onclick = function(event) {
        turn = 0;
        pause = false;
        let cells = document.getElementsByClassName('cell');
        for (let cell of cells) {
            cell.innerHTML = "";
        }
        sendClearMessage();
    };

    document.getElementById('restart_button').onclick = function(event) {
        document.getElementById('X_score').innerHTML = "0";
        document.getElementById('O_score').innerHTML = "0";
        document.getElementById('clear_button').click();
        sendStartMessage();
    };
}