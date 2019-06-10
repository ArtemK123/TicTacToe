import React from 'react'
import "../css/Game.css"
import {Link, Redirect} from "react-router-dom"

function Square(props) {
    return (
      <button className="square" onClick={props.onClick}>
        {props.value}
      </button>
    );
  }

  class Board extends React.Component {
    renderSquare(i) {
      return (
        <Square
          value = {this.props.squares[i]}
          onClick={() => this.props.onClick(i)}
        />
      )}
    render() {
    
    return (
      <div className="gameboard">
          <div>
                {this.renderSquare(0)}  
                {this.renderSquare(1)}  
                {this.renderSquare(2)}  
                {this.renderSquare(3)}  
                {this.renderSquare(4)}  
          </div>
          <div>
                {this.renderSquare(5)}  
                {this.renderSquare(6)}  
                {this.renderSquare(7)}  
                {this.renderSquare(8)}  
                {this.renderSquare(9)}  
          </div>
          <div>
                {this.renderSquare(10)}  
                {this.renderSquare(11)}  
                {this.renderSquare(12)}  
                {this.renderSquare(13)}  
                {this.renderSquare(14)}  
          </div>
          <div>
                {this.renderSquare(15)}  
                {this.renderSquare(16)}  
                {this.renderSquare(17)}  
                {this.renderSquare(18)}  
                {this.renderSquare(19)}  
          </div>
          <div>
                {this.renderSquare(20)}  
                {this.renderSquare(21)}  
                {this.renderSquare(22)}  
                {this.renderSquare(23)}  
                {this.renderSquare(24)}  
          </div>
      </div>);
    }
}

class Gamearea extends React.Component {
    constructor(props) {
        super(props);
          
        // fetch(`/game?query=getName&jwt=${localStorage.getItem('jwt')}`)
        // .then((res) => ((res) ? res.json() :  null))
        // .then((record) => {
        //     if (record && record.name) {
        //         this.setState({'name': record.name});
        //     }
        // })
        this.state = {
            squares: Array(24).fill(null),
            name: null,
            redirectUrl: null,
            gameState: "loaded",
            isXNext: true
        };    
    }
    showName() {
        if (this.state.name !== null) {
            return <span className="name">Hello, {this.state.name}</span>;
        } 
    }
    checkState() {
        if (this.state.gameState === "") {
            return <span className="stateTitle">Press start</span>
        }
        else if (this.state.gameState === "searching") {
            return <span className="stateTitle">Searching for opponent</span>    
        }
        else if (this.state.gameState === "playing") {
            return <span className="stateTitle">Game found, let`s play</span>
        }
        else if (this.state.gameState === "X" || this.state.gameState === "O") {
            return <span className="stateTitle">Winner - {this.state.gameState}</span>
        }
    }
    handleClick(i) {
        if (this.state.gameState === "playing") {
            console.log(this.sign, this.state.isXNext);
            if ((this.state.isXNext && this.sign === "X") || (!this.state.isXNext && this.sign === "O")) {
                console.log("data is sent");
                this.webSocket.send(JSON.stringify({
                    query: "make_move",
                    footprint: this.state.history,
                    cell: i,
                    jwt: localStorage.getItem('jwt')
                }))
            }
        }
    }
    componentDidMount() {
        let webSocket = localStorage.getItem("webSocket");
        if (!webSocket) {
            let connection = new WebSocket("ws://localhost:8000");
            connection.onopen(() => {
                localStorage.setItem({'webSocket' : connection})
            });
        }
    }
    startGame(event) {
        let token = localStorage.getItem("jwt");
        let webSocket = localStorage.getItem("webSocket");
        webSocket.send(JSON.stringify({
            jwt: token,
            query: "start"
        }));
        localStorage.setItem({"webSocket": webSocket});



        
        // if (this.state.gameState === 'loaded' || this.state.gameState === 'gameover') {
        //     let webSocket = new WebSocket("ws://localhost:8000");
        //     webSocket.onmessage = (message) => {
        //         let record = JSON.parse(message.data);   
        //     };
        //     localStorage.setItem({"webSocket": webSocket});

            // fetch(`/game?query=startGame&jwt=${token}`)
            // .then(res => res.json())
            // .then(response => {
            //     console.log(response);
            //     if (response.result === "found") {
            //         this.roomId = response.roomId;
            //         this.webSocket = new WebSocket("ws://localhost:8000");
            //         this.webSocket.onopen = () => {
            //             this.webSocket.send(JSON.stringify({
            //                 query: "init",
            //                 roomId: this.roomId,
            //                 jwt: localStorage.getItem("jwt")
            //             }));
            //         }
            //         this.webSocket.onmessage = (json) => {
            //             try {
            //                 let message = JSON.parse(json.data);
            //                 if (message.query === "change_state") {
            //                     if (message.state === "searching") {
            //                         this.setState({gameState: "searching"});
            //                     }
            //                     else if (message.state === "found") {
            //                         this.setState({gameState: "playing"});
            //                         this.sign = message.sign;
            //                     }
            //                     else if (message.state === "gameover") {
            //                         this.setState({gameState: message.winner, history: message.footPrint});
            //                     }
            //                 }
            //                 if (message.query === "new_turn") {
            //                     this.setState({history: message.footPrint, isXNext: message.isXNext});
            //                 }
            //             } 
            //             catch (err) {
            //                 console.log(err);
            //             }
            //         }
            //     }
            //     else if (response.result === "redirect") {
            //         this.setState({redirectUrl: response.redirectUrl});
            //     }
            // }).catch(err => console.log(err)); 
    }
    render() {
        return (
            <div className="gamearea">
                <div className="gameboard">
                    <Board
                    squares={this.state.squares}
                    onClick={i => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">>
                    <div className="nameBox">{this.showName()}</div>
                    <div className="searchingBox">{this.checkState()}</div>
                </div>
                <button className="startButton" onClick={this.startGame.bind(this)}>Start game</button>
                {(() => {
                    if (this.state.redirectUrl) return <Redirect to={this.state.redirectUrl}/> 
                })()}
            </div>
        );
    }
}

class Game extends React.Component {
    render() {
        return (<div id='game_main'>
            <header>
                <h3>Хрестики-нулики</h3>
                    <nav>
                        <ul>
                            <li><Link to="/about">Про гру</Link></li>
                            <li><Link to="/contacts">Контакти</Link></li>
                        </ul>
                    </nav>
            </header>          
                <Gamearea/>
            <footer>
                <p>Copyright 2019 - All rights are reserved</p>
            </footer>
        </div>)
    }
}

export default Game