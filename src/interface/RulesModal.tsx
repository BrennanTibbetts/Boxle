import { useEffect } from 'react'
import useUI from '../stores/useUI'
import useGame, { GameMode } from '../stores/useGame'
import { useIsMobile } from '../hooks/useIsMobile'
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
    const activeMode = useGame((state) => state.activeMode)
    const isMobile = useIsMobile()
    const onMenu = activeMode === GameMode.MENU
    // Use the centered modal variant when there's no live board to slide
    // alongside (main menu) OR when the viewport is too narrow for a side
    // panel to make sense (mobile).
    const useCentered = onMenu || isMobile

    // Only toggle the body class for the in-game side-panel layout. The
    // centered variant doesn't shift the board.
    useEffect(() => {
        if (!open || useCentered) return
        document.body.classList.add('rules-open')
        return () => document.body.classList.remove('rules-open')
    }, [open, useCentered])

    const onClose = () => {
        localStorage.setItem(SEEN_KEY, '1')
        setRulesOpen(false)
    }

    const className = `rules-panel${useCentered ? ' rules-panel-centered' : ''}${open ? ' open' : ''}`

    return (
        <aside
            className={className}
            aria-hidden={!open}
            onClick={useCentered ? onClose : undefined}
        >
            <div className="rules-card" onClick={(e) => e.stopPropagation()}>
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
