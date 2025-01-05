import { useEffect, useState } from "react"
import useGame from "../stores/useGame"
import filledHeart from "/boxle/heart-filled.svg"
import emptyHeart from "/boxle/heart-empty.svg"
import "../style.css"

export default function LivesDisplay() {
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const unsubscribeLives = useGame.subscribe(
      (state) => state.lives,
      (value) => {
        setLives(value)
      }
    )

    return () => {
      unsubscribeLives()
    }
  }, [])

  const totalLives = 3

  return <></>
    // <div className="livesDisplay">
    //   {Array.from({ length: totalLives }).map((_, index) => (
    //     <img
    //       key={index}
    //       src={index < lives ? filledHeart : emptyHeart}
    //       alt={index < lives ? "Filled heart" : "Empty heart"}
    //       className="heartIcon"
    //     />
    //   ))}
    // </div>
}
