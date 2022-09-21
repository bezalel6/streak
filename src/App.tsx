import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { Chessboard, Pieces, Square } from 'react-chessboard'
import { Chess, PartialMove, PieceSymbol } from 'chess.ts'
import RightDashboard, { DashboardActions } from './RightDashboard'
import { Challenge, convertMoveToStr, GenerateChallenge } from './Fetcher'


type PuzzleState = "solving" | "failed" | "solved" | "generating";

function App() {
  const [state, setState] = useState(new State());

  function rerender() {
    console.log('rerendering')
    return new Promise<State>((resolve, reject) => {
      setState(s => {
        const ret = s.clone();
        resolve(ret);
        return ret;
      });

    })
  }
  function onDrop(sourceSquare: Square, targetSquare: Square, piece: Pieces) {

    const simple: PartialMove = {
      from: sourceSquare,
      to: targetSquare,
    };
    if (piece.charAt(1) === 'P' && (targetSquare.charAt(1) === '8' || targetSquare.charAt(1) === '1')) {
      const options = ['n', 'b', 'r', 'q'];
      const promote = prompt("Enter piece type to promote to: " + options.join(" / "));
      if (!promote || !options.includes(promote)) {
        return false;
      }
      simple.promotion = promote as PieceSymbol;
    }
    const gameClone = state.chess.clone();
    const move = gameClone.move(simple);

    // illegal move
    if (move === null) {
      console.log('decliened', { sourceSquare, targetSquare, piece })
      console.log(state.chess.ascii())
      return false;
    }
    state.chess = gameClone;
    madeMove(simple)
    // setTimeout(rerender, 100);
    rerender()
    return true;
  }
  function madeMove(move: PartialMove) {
    const moveStr = convertMoveToStr(move);
    let lines = state.currentChallenge.correctMoves;
    if (!lines.length)
      throw "no lines"
    if (lines.find(l => !l.length)) {
      throw "found empty line " + lines.join(",")
    }
    lines = lines.filter(line => line[0] === moveStr);
    if (!lines.length) {
      state.puzzleState = "failed";
    } else {
      lines.forEach(l => l.shift());
      // alert("played the right move");
      if (lines.find(l => !l.length)) {
        // alert("finished this challenge!");
        state.puzzleState = "solved";
        state.streak++;

      }
    }
    rerender();
  }

  function nextChallenge() {
    console.log('gening')
    state.puzzleState = "generating";
    rerender().then(nState => {
      GenerateChallenge().then(c => {
        nState.puzzleState = "solving"
        console.log('generated', c)
        nState.setPosition(c);
        rerender();
      })
    })
  }

  function onAction(action: DashboardActions) {
    switch (action) {
      case "next": {
        nextChallenge()
        break;
      }
      case "reset": {
        state.streak = 0;
        nextChallenge();
        break;
      }
      case "skip": {
        state.canSkip = false;
        nextChallenge();
        break;
      }

    }
  }
  useEffect(nextChallenge, []);
  return (
    <div className="App">
      <h1>Streak</h1>
      <div className='main'>
        <div className="board">
          <Chessboard onPieceDrop={onDrop} position={state.chess.fen()}></Chessboard></div>
        <RightDashboard state={state} onAction={onAction}></RightDashboard>
      </div>

    </div>
  )
}



export class State {
  streak: number;
  puzzleState: PuzzleState;
  currentChallenge!: Challenge;
  chess!: Chess;
  canSkip: boolean;

  constructor() {
    this.puzzleState = "generating";
    this.streak = 0;
    this.setPosition({ correctMoves: [], description: "desc", name: "name", position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" })
    this.canSkip = true;
  }
  setPosition(challenge: Challenge) {
    this.currentChallenge = challenge;
    this.chess = new Chess(challenge.position);

  }
  clone() {
    const n = new State();
    n.canSkip = this.canSkip;
    n.currentChallenge = this.currentChallenge;
    n.chess = this.chess.clone()
    n.streak = this.streak;
    n.puzzleState = this.puzzleState;
    return n;
  }
}

export default App
