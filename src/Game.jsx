import { useRef } from "react";
import { useControls } from "leva";
import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from 'three'
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry";
import Title from "./components/Title";
import TutorialButton from "./components/TutorialButton.jsx";
import Level from "./Level.jsx"
import puzzles5 from '../data/valid_puzzles_5.json'
import puzzles6 from '../data/valid_puzzles_6.json'
import puzzles7 from '../data/valid_puzzles_7.json'
import puzzles8 from '../data/valid_puzzles_8.json'
import puzzles9 from '../data/valid_puzzles_9.json'
import useGame from "./stores/useGame.js";

export default function Game() {

    const puzzleData = [puzzles5, puzzles6, puzzles7, puzzles8, puzzles9];
    const boards = puzzleData.map(puzzles => puzzles[Math.floor(Math.random() * puzzles.length)]);

    const groupRef = useRef()
    const incrementLevel = useGame((state) => state.incrementLevel )
    const openNextLevel = () => {
        incrementLevel()
        gsap.to(
            groupRef.current.position,
            {z: groupRef.current.position.z + 12}
        )
    }

    const props = useControls('Game', {
        boardSpacing: {
            value: 12,
            min: 10,
            max: 20,
            step: 0.1 
        },
        boxSegments: {
            value: 1,
            min: 1,
            max: 10,
            step: 1
        },
        boxRadius: {
            value: 0.1,
            min: 0.0,
            max: 0.5,
            step: 0.01
        },
        boxWireframe: false
    })

    let materialCache = []
    const currentDate = new Date()
    const day = currentDate.getDate()
    const materialOffset = (day) % 10

    const getMaterial = (groupNumber) => {

        const colors = [
            'mediumpurple',
            'lightcoral',
            'lightblue',
            'lightgreen',
            'lightseagreen',
            'lightyellow',
            'lime',
            'gold',
            'palevioletred'
        ]

        const index = (groupNumber + materialOffset) % colors.length
        const color = colors[index]

        if (!materialCache[index]) {
            materialCache[index] = new THREE.MeshStandardMaterial({color, wireframe: props.boxWireframe})
        }

        return materialCache[color]
    }

    const getCacheRef = useRef()
    getCacheRef.current = () => {
        for (let i = 0; i < 9; i++) {
            getMaterial(i)
        }

        return materialCache
    }

    const starGeometry = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/star/model.gltf').nodes.star.geometry
    const boxGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
    const markMaterial = new THREE.MeshStandardMaterial({color: '#272729'})

    return (
        <group
            ref={groupRef}
        >
            <Title />
            {/* <TutorialButton /> */}
            {boards.map((board, index) => (
                <Level 
                    key={index}
                    levelMatrix={board['Board']}
                    answerMatrix={board['Solution']}
                    position={[0, 0, props.boardSpacing * -index]}
                    openNextLevel={openNextLevel}
                    boxGeometry={boxGeometry}
                    starGeometry={starGeometry}
                    markMaterial={markMaterial}
                    materialCache={getCacheRef.current()}
                />
            ))}
        </group>
    )
}