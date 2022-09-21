import { Chess, PartialMove } from "chess.ts";
import {
  fetchGames,
  fetchUserInfo,
  lookup,
  lookupPlayer,
} from "simple-lichess-api";

export async function FetchPosition() {
  return Promise.resolve(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
}
type ChallengeGenerator = (pos: Position) => Promise<Challenge>;
const challengeGenerators = new Array<ChallengeGenerator>();

challengeGenerators.push(
  (pos) => {
    return edgeMove(pos, "best");
  },
  (pos) => {
    return edgeMove(pos, "worst");
  },
  (pos) => {
    return edgeMove(pos, "equal");
  }
);
export type Position = string;
export type Challenge = {
  position: string;
  name: string;
  description: string;
  correctMoves: string[][];
};
export async function GenerateChallenge() {
  fetchPersonalityChallenge();
  const generator = challengeGenerators[rndIndex(challengeGenerators.length)];
  return FetchPosition().then(generator);
}
function rndIndex(length: number) {
  return Math.floor(Math.random() * length);
}
/**
 * username | name
 */
const personalities = new Map<string, string>();
alts(
  "Magnus Carlsen",
  "damnsaltythatsport",
  "manwithavan",
  "dannythedonkey",
  "DrGrekenstein",
  "DrDrunkenstein",
  "DrNykterstein"
);
personalities.set("EricRosen", "Eric Rosen");
personalities.set("CCSCATL", "Ben Finegold");
function alts(name: string, ...usernames: string[]) {
  usernames.forEach((un) => {
    personalities.set(un, name);
  });
}

async function fetchPersonalityChallenge() {
  //   const personality = Array.from(personalities)[rndIndex(personalities.size)];
  //   const info = await fetchUserInfo(personality[0]);
  //   fetchGames(info.id, { rated: "rated", maxGames: 10 }).listen((game) => {});
  //   lookup({ database: "lichess" }).listen(console.log);
  lookupPlayer({
    player: "DrDrunkenstein",
    // play: "d2d4",
    color: "white",
  }).listen(console.log);
}
const TOLERANCE = 100;
async function edgeMove(
  pos: Position,
  edge: "best" | "worst" | "equal"
): Promise<Challenge> {
  const moves = await challengeeee(pos);
  let target: number;
  switch (edge) {
    case "best": {
      target = moves.sorted[0].cp;
      break;
    }
    case "equal": {
      target = 0;
      break;
    }
    case "worst": {
      target = moves.sorted[moves.sorted.length - 1].cp;
      break;
    }
  }
  const arr = moves.sorted
    .filter((m) => {
      const diff = Math.abs(m.cp - target);
      return diff <= TOLERANCE;
    })
    .map((s) => s.move)
    .map((a) => [a]);
  console.log(arr);
  const str = edge.charAt(0).toUpperCase() + edge.substring(1);
  return {
    position: pos,
    name: str + " Move",
    description: `Make the ${edge} move in this position`,
    correctMoves: arr,
  };
}
export interface MoveScore {
  move: string;
  cp: number;
}
export interface Moves {
  moves: Map<string, MoveScore>;
  sorted: MoveScore[];
}

function challengeeee(position: string) {
  console.log("i am being summened");
  const chess = new Chess(position);
  return new Promise<Moves>((resolve, reject) => {
    let movesLeft: number;

    const res: Moves = { moves: new Map(), sorted: [] };
    function got(event: any, worker: Worker) {
      const str = event.data as string;
      if (str.includes("bestmove")) {
        worker.postMessage("quit");
        worker.terminate();
        movesLeft--;
        if (!movesLeft) {
          res.moves.forEach((move) => {
            res.sorted.push(move);
          });
          res.sorted = res.sorted.sort((a, b) => b.cp - a.cp);
          resolve(res);
        }
      } else if (str.includes("info depth")) {
        const move = str.split(" pv ")[1].split(" ")[0];
        const cp = Number(str.split("score cp ")[1].split(" ")[0]);
        res.moves.set(move, { move, cp });
      }
    }
    const fen = chess.fen();
    // stockfish.postMessage("position fen " + fen);
    const moves = chess.moves({ verbose: true });
    movesLeft = moves.length;
    moves.forEach((move) => {
      const notation = convertMoveToStr(move);
      analyzeMove(notation);
    });
    function analyzeMove(move: string) {
      post("go movetime 100 searchmoves " + move);
    }

    function post(msg: any) {
      let stockfish = new Worker("stockfish.js");
      stockfish.onmessage = (e) => {
        got(e, stockfish);
      };
      stockfish.postMessage("position fen " + fen);
      stockfish.postMessage(msg);
    }
  });
}

export function convertMoveToStr(move: PartialMove) {
  return move.from + move.to + (move.promotion ? "=" + move.promotion : "");
}
