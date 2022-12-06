import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function Square(props) {
  return (
    <button className={`${props.className}square`} onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    let key = `square${i}`;
    let className = "";

    let stepNumber = this.props.stepNumber;
    if (stepNumber === i) {
      className += "last-played ";
    }

    let line = this.props.line;
    if (line && line.includes(i)) {
      className += "winning ";
    }

    return (
      <Square 
        className={className}
        key={key}
        value={this.props.squares[i]} 
        onClick={() => this.props.onClick(i)} 
      />
    );
  }
  
  render() {
    const numCols = this.props.numCols;
    const numRows = this.props.numRows;
    
    let rows = [];

    for (let i = 0; i < numRows; i++) {
      let squares = [];
      for (let j = 0; j < numCols; j++) {
        let index = (j * numCols) + i;
        squares.push(this.renderSquare(index));
      }

      let key = `row${i}`;
      rows.push(<div key={key} className="board-row">{squares}</div>);
    }
    
    return rows;
  }
}

class ControlPanel extends React.Component {
  
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
        squares: Array(9).fill(null),
      }],
      cols: 3,
      rows: 3,
      lastMove: null,
      stepNumber: 0,
      xIsNext: true,
      historyAscending: true, // history sorting
    };
  }

  calculateLastMove(thisSquares, lastSquares) {
    // naive implementation, assuming:
    // - assuming squares are valid boards
    // - assuming it is a valid move, e.g. only one square differs
    let col, row;
    if (thisSquares && lastSquares && thisSquares.length === lastSquares.length) {
      for (let i = 0; i < thisSquares.length; i++) {
        if (thisSquares[i] === lastSquares[i]) {
          continue;
        } else {
          return i;
        }
      }
    }

    return null;  
  }
  
  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const gamestate = calculateGameState(squares);
    if (gamestate.winner || squares[i]) {
      return;
    }

    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      lastMove: i,
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  resetGame() {
    console.log("Setting up new game.");
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    this.setState({
      history: [{
        squares: Array(9).fill(null),
      }],
      cols: 3,
      rows: 3,
      lastMove: null,
      stepNumber: 0,
      xIsNext: true,
    });
  }

  reverseHistory() {
    const sorting = !this.state.historyAscending;
    this.setState({
      historyAscending: sorting,
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const gamestate = calculateGameState(current.squares);

    const cols = this.state.cols;
    const rows = this.state.rows;
    
    const stepNumber = this.state.stepNumber;

    let states = [];
    history.forEach((state) => {
      states.push(state);
    });

    console.log(history[stepNumber]);
    console.log(stepNumber);
    let thisStep = history[stepNumber];
    let lastStep = stepNumber > 0 ? history[stepNumber - 1] : history[stepNumber];
    let lmi = this.calculateLastMove(thisStep.squares, lastStep.squares);
    console.log(lmi);
    console.log(lastStep);
    let moves = states.map((step, move) => {
      const lastMoveIndex = this.calculateLastMove(step.squares, lastStep ? lastStep.squares : null);
      const lastMove = toColRow(lastMoveIndex, cols, rows);
      
      const className = move === stepNumber ? "current-move" : "";
      const desc = move ?
        `Move ${move}: (${lastMove.col}, ${lastMove.row})` :
        `Start of game`;

      const key = `move${move}`;
      lastStep = step;
      
      return (
        // TODO: highlight / bold the current move
        <li key={key}>
          <button className={className} onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });

    if (this.state.historyAscending) {
      moves = moves.reverse();
    }

    let status;
    let line = gamestate.line;
    if (gamestate.winner) {
      status = `Winner: ${gamestate.winner}!`;
    } else if (gamestate.squaresOccupied === this.state.history[0].squares.length) {
      status = `Draw Game. Replay.`;
    } else {
      status = `Next: ${this.state.xIsNext ? 'X' : 'O'}`;
    }

    return (
      <div className="game">
        <div className="game-board">
          <div className="game-status">
            <p className="status">{status}</p>
          </div>
          <Board
            numCols={cols}
            numRows={rows}
            squares={current.squares}
            stepNumber={lmi}
            line={line}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <button className="new-game-button" onClick={() => this.resetGame()}>New Game</button>
          <div className="divider"></div>
          <div className="history-box">
            <button className="history-sort-button" onClick={() => this.reverseHistory()}>Sort &uarr; / &darr;</button>
            <ol>{moves}</ol>
          </div>
        </div>
      </div>
    );
  }
}

function calculateGameState(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  let sqOcc = 0;
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] !== null) sqOcc++;
  }

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {
        winner: squares[a],
        line: [a, b, c],
        squaresOccupied: sqOcc,
      };
    }
  }

  return {
    winner: null,
    line: null,
    squaresOccupied: sqOcc, 
  };
}

function toColRow(i, numCols, numRows) {
  const col = Math.floor(i / numCols);
  const row = i % numRows;

  return {col: col, row: row};
}

function toIndex(col, row) {
  
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
