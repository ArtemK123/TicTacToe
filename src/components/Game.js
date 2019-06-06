import React from 'react'
import "../css/Game.css"
import {Link} from "react-router-dom"

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
        this.winningCombinations = [];
        let diagonalCombination1 = [];
        let diagonalCombination2 = [];

        for (let i = 0; i < 5; i++) {
            let horizontalCombination = [];
            let verticalCombination = [];
            for (let j = 0; j < 5; j++) {
                horizontalCombination.push(i * 5 + j);
                verticalCombination.push(j * 5 + i);
            }
            this.winningCombinations.push(horizontalCombination);
            this.winningCombinations.push(verticalCombination);
            diagonalCombination1.push(5 * i + i);
            diagonalCombination2.push(5 * i + (4 - i));
        }
        this.winningCombinations.push(diagonalCombination1);
        this.winningCombinations.push(diagonalCombination2);  
        this.state = {
            squares: Array(14).fill(null),
            xIsNext: true
        };        
    }
  
    handleClick(i) {
        const squares = this.state.squares;
        if (this.calculateWinner() || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? "X" : "O";
        fetch("/game", {"i": i});
        this.setState({
            history: squares,
            xIsNext: !this.state.xIsNext
        });
    }
    calculateWinner() {
        for (let i = 0; i < this.winningCombinations.length; i++) {
            let positions = this.winningCombinations[i];
            let winner = this.state.squares[positions[0]];
            let isWinner = true;
            for (let i = 1; i < positions.length; i++) {
                if (!winner || winner !== this.state.squares[positions[i]]) {
                    isWinner = false;          
                }
            } 
            if (isWinner) {
                return winner;
            }
        }
        return null
    }
  
    render() {
      const winner = this.calculateWinner();
   
      let status;
      if (winner) {
        status = "Winner: " + winner;
      } else {
        status = "Next player: " + (this.state.xIsNext ? "X" : "O");
      }
  
      return (
        <div className="gamearea">
            <div className="gameboard">
                <Board
                squares={this.state.squares}
                onClick={i => this.handleClick(i)}
                />
            </div>
            <div className="game-info">
                <div>{status}</div>
            </div>
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