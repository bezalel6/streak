import React from 'react'
import { State } from './App'
import './Dashboard.css'
interface DashboardProps {
    state: State;
    onAction: (action: DashboardActions) => void;
}
export type DashboardActions = "next" | "reset" | "skip";
export default function RightDashboard({ state, onAction }: DashboardProps) {
    const { puzzleState, streak, canSkip, currentChallenge } = state;
    function Wrapper({ header, children }: { header: string; children?: JSX.Element[] | JSX.Element }) {
        return <div className='dashboard'>
            <h2>Streak: {streak}</h2>
            <h3 className='header'>{header}</h3>
            <br></br>
            {children}
        </div>
    }
    switch (puzzleState) {
        case "failed": {
            return <Wrapper header={'You failed'}><button onClick={() => onAction("reset")}>Restart</button></Wrapper>
        }
        case "generating": {
            return <Wrapper header='Generating...'></Wrapper>
        }
        case "solving": {
            return <Wrapper header={currentChallenge.name}>
                <p>{currentChallenge.description}</p>
                <button disabled={!canSkip} onClick={() => onAction("skip")}>Skip</button>
            </Wrapper>
        }
        case "solved": {
            return <Wrapper header='Correct!'>
                <button onClick={() => onAction("next")}>Next</button>
            </Wrapper>
        }
    }
}

