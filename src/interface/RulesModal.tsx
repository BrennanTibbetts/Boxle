import { useEffect } from 'react'
import useUI from '../stores/useUI'
import { BoxleIcon, MarkIcon, LockIcon } from '../components/BoxIcons'

const SEEN_KEY = 'boxle-rules-seen'

const ROW_COLOR = '#7dd3fc'
const COL_COLOR = '#86efac'
const BOXLE_COLOR = '#fde047'
const WARN_COLOR = '#f87171'

const row = <span style={{ color: ROW_COLOR, fontWeight: 600 }}>row</span>
const column = <span style={{ color: COL_COLOR, fontWeight: 600 }}>column</span>
const region = <span className="rules-emph">colored region</span>
const regions = <span className="rules-emph">colored regions</span>
const boxle = <span style={{ color: BOXLE_COLOR, fontWeight: 600 }}>boxle</span>
const boxles = <span style={{ color: BOXLE_COLOR, fontWeight: 600 }}>boxles</span>
const touch = <span style={{ color: WARN_COLOR, fontWeight: 600 }}>touch</span>
const diagonally = <span style={{ color: WARN_COLOR, fontWeight: 600 }}>diagonally</span>

function RulesContent() {
    return (
        <>
            <p className="rules-body">
                Each board is a grid divided into {regions}.
            </p>
            <p className="rules-body">
                <span className="rules-goal">Goal:</span> place exactly one {boxle} in every {row},
                every {column}, and every {region}.
            </p>
            <ul className="rules-list">
                <li>Every {row} has exactly one {boxle}.</li>
                <li>Every {column} has exactly one {boxle}.</li>
                <li>Every {region} has exactly one {boxle}.</li>
                <li>No two {boxles} may {touch} — not even {diagonally}.</li>
            </ul>
            <p className="rules-body">
                <span className="rules-goal">Play by elimination.</span>{' '}
                Rule out the boxes where a {boxle} can't go — place one only when logic leaves no other option. Guesses cost a life.
            </p>
            <div className="rules-legend">
                <div className="rules-legend-item">
                    <MarkIcon />
                    <span>Click a box to rule it out.</span>
                </div>
                <div className="rules-legend-item">
                    <BoxleIcon />
                    <span>Double-click to place a {boxle}.</span>
                </div>
                <div className="rules-legend-item">
                    <LockIcon />
                    <span>Boxes ruled out lock automatically.</span>
                </div>
            </div>
        </>
    )
}

export default function RulesModal() {
    const open = useUI((state) => state.rulesOpen)
    const setRulesOpen = useUI((state) => state.setRulesOpen)

    useEffect(() => {
        if (open) {
            document.body.classList.add('rules-open')
            return () => document.body.classList.remove('rules-open')
        }
    }, [open])

    const onClose = () => {
        localStorage.setItem(SEEN_KEY, '1')
        setRulesOpen(false)
    }

    return (
        <aside className={`rules-panel${open ? ' open' : ''}`} aria-hidden={!open}>
            <div className="rules-card">
                <h2 className="rules-title">How to play</h2>
                <RulesContent />
                <button className="hud-btn rules-close-btn" onClick={onClose}>Got it</button>
            </div>
        </aside>
    )
}

export function useFirstVisitRules() {
    const setRulesOpen = useUI((state) => state.setRulesOpen)

    useEffect(() => {
        if (!localStorage.getItem(SEEN_KEY)) {
            setRulesOpen(true)
        }
    }, [setRulesOpen])
}
