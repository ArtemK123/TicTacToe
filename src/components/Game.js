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
        this.state = {
            squares: Array(24).fill(null),
            name: null,
            redirectUrl: null,
            gameState: "loaded",
            turn: null,
            gameId: -1,
            sign: null
        };    
    }
    showName() {
        if (this.state.name !== null) {
            return <span className="name">Hello, {this.state.name}</span>;
        } 
        else {
            return <span className="name">You should sign in first</span>;
        }
    }
    startGame(event) {
        let token = localStorage.getItem("jwt");
        if (!token) {
            return    
        }
        if (!this.webSocket) {
            let socket = new WebSocket("ws://localhost:8000");
            socket.onopen = () => {
                this.webSocket = socket;
                this.webSocket.send(JSON.stringify({
                    jwt: token,
                    query: "start"
                }), (err) => {console.log("Connected to server")});
            };
            socket.onmessage = (mEvent) => {
                let message = JSON.parse(mEvent.data);
                if (message.query === "redirect") {
                    this.setState({
                        redirectUrl: message.redirectUrl
                    })
                }
                else if (message.query === "wait") {
                    this.setState({
                        gameState: "searching"
                    });
                }
                else if (message.query === "start") {
                    this.setState({
                        gameId: message.gameId,
                        sign: message.sign,
                        turn: "X",
                        gameState: "playing",
                        squares: new Array(24).fill(null)
                    })
                }
                else if (message.query === "gameover" && this.state.gameState !== "gameover") {
                    this.setState({
                        gameState: "gameover",
                        turn: message.winner
                    });
                }
                else if (message.query === "step") {
                    this.setState({
                        squares: message.footPrint,
                        turn: message.turn
                    });
                }
            }
        }
        else {
            this.webSocket.send(JSON.stringify({
                jwt: token,
                query: "disconnect"
            }))
            this.webSocket.send(JSON.stringify({
                jwt: token,
                query: "start"
            }));
        } 
    }
    handleClick(i) {
        if (this.state.gameState === "playing" && this.state.sign === this.state.turn) {
            let record = JSON.stringify({
                query: "step",
                jwt: localStorage.getItem('jwt'),
                gameId: this.state.gameId,
                "i": i,
                sign: this.sign
            });
            this.webSocket.send(record);
        }
    }
    componentDidMount() {
        let token = localStorage.getItem('jwt');
        if (token) {
            fetch(`/game?query=getName&jwt=${token}`)
                .then(res => res.json())
                .then(message => this.setState({name: message.name}))
                .catch(err => console.log(err));
        }
        else {
            this.setState({name: null});
        }
    }

    componentWillUnmount() {
        console.log("Will unmount");
        if (this.webSocket) {
            this.webSocket.send(JSON.stringify({
                query: "disconnect"
            }));
            this.webSocket.close()
        }
    }
    createTitle() {
        if (this.state.gameState === "loaded") {
            return <span className="stateTitle">Press start</span>
        }
        else if (this.state.gameState === "searching") {
            return <span className="stateTitle">Searching for opponent</span>    
        }
        else if (this.state.gameState === "playing") {
            return (<span className="stateTitle">
                    {(() => {
                    if (this.state.sign === this.state.turn) {
                        return `Your turn - ${this.state.turn}`;
                    }
                    else {
                        return `Opponents turn - ${this.state.turn}`;
                    }})()}
                </span>)
        }
        else if (this.state.gameState === "gameover") {
            return <span className="stateTitle">{(() => {
                if (this.state.turn === "X") {
                    return ((this.state.sign === "X" ? "You win - " : "You lose - ") + this.state.sign);    
                }
                else if (this.state.turn === "O") {
                    return ((this.state.sign === "O" ? "You win - " : "You lose - ") + this.state.sign);
                }
                else if (this.state.turn === "draw") {
                    return "Draw - " + this.state.sign
                }
            })()}</span>
        }
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
                <div className="game-info">
                    <div className="nameBox">{this.showName()}</div>
                    <div className="titleBox">{this.createTitle()}</div>
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
    
    createLoginLogoutLink() {
        if (localStorage.getItem('jwt')) {
            return <li><Link to="/" onClick={() => {
                localStorage.removeItem('jwt');
                this.setState({});
            }}>Вийти</Link></li>
        }
        else {
            return <li><Link to="/login">Увійти</Link></li>
        }
    }
    render() {
        return (<div id='game_main'>
            <header>
                <h3>Хрестики-нулики</h3>
                    <nav>
                        <ul>
                            {this.createLoginLogoutLink()}
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