import { useEffect, useState } from "react"
import useGame from "../stores/useGame"
import filledHeart from "/boxle/img/heart-filled.svg"
import emptyHeart from "/boxle/img/heart-empty.svg"
import { Text } from "@react-three/drei"
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

    return (
    <>
        {Array.from({ length: totalLives }).map((_, index) => 
        index < lives ? (
            <Text
                key={index}
                position={[3, 0, index - 1]}
                rotation={[-Math.PI * 0.5, 0, 0]}
            >
                {"<3"}
            </Text>
        ) : null
        )}
    </>
    )
}
