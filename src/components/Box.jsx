import { useRef, useState, forwardRef, useImperativeHandle, useMemo } from "react"
import useButtonAnimation from "../utils/useButtonAnimation"
import gsap from "gsap"
import { Outlines } from "@react-three/drei"
import { useResource } from "../stores/useResource"
import useGame from "../stores/useGame"

const Box = forwardRef(({group, placement = [0, 0, 5, 1], placeStar}, ref) => {

    const [state, setState] = useState('blank')

    const geometry = useMemo(() => useResource.getState().geometries.get('box'), [])
    const starGeometry = useMemo(() => useResource.getState().geometries.get('star'), [])
    const markMaterial = useMemo(() => useResource.getState().materials.get('mark'), [])
    const material = useMemo(() => useResource.getState().getGroupMaterial(group), [group])

    const decrementLives = useGame((state) => state.decrementLives)

    useImperativeHandle(ref, () => ({
        acceptStar() {
            setState('star')
            gsap.to(box.current.rotation, {
                x: Math.PI,
                duration: 0.5,
            })

        },
        declineStar() {
            decrementLives()
        },
        groupCascade() {
            // Blank -> LOCK
            console.log("rotate")
            if(state === 'blank' || state == 'x') {
                setState('lock')
                gsap.to(box.current.rotation, {
                    x: -Math.PI/2,
                    duration: 0.25,
                })
            } 
        },
        rowCascade(column) {
            // Blank -> Lock
            if(state === 'blank' || state == 'x') {
                if(column > placement[1]) {
                    setState('lock')
                    gsap.to(box.current.rotation, {
                        x: -Math.PI/2,
                        duration: 0.25,
                    })
                }else if(column < placement[1]) {
                    setState('lock')
                    gsap.to(box.current.rotation, {
                        x: -Math.PI/2,
                        duration: 0.25,
                    })
                }
            }
        },
        columnCascade(row) {
            // Blank, X -> Lock
            if(state === 'blank' || state == 'x') {
                if(row > placement[0]) {
                    setState('lock')
                    gsap.to(box.current.rotation, {
                        x: -Math.PI/2,
                        duration: 0.25,
                    })
                }else if(row < placement[0]) {
                    setState('lock')
                    gsap.to(box.current.rotation, {
                        x: -Math.PI/2,
                        duration: 0.25,
                    })
                }
            }
        },
        cornerCascade() {
            if(state === 'blank' || state == 'x') {
                setState('lock')
                gsap.to(box.current.rotation, {
                    x: -Math.PI/2,
                    duration: 0.25,
                })
            }
        }
    }))

    const position = [
        (((placement[1]) - placement[2] / 2) + 0.5) * placement[3],
        0,
        (((placement[0]) - placement[2] / 2) + 0.5) * placement[3]
    ]

    const outlined = false 

    const box = useRef()
    const { enter: pointerEnter, leave: pointerLeave } = useButtonAnimation(
        box,
        (e) => {
            e.stopPropagation()
            gsap.to(box.current.scale, {
                x: 0.9,
                y: 0.9,
                z: 0.9,
                duration: 0.5
            })
        }
    )

    const mark = useRef()
    const lock = useRef()
    const star = useRef()

    const singleClick = (e) => {
        e.stopPropagation()

        console.log(state)

        // Blank -> X
        if(state === 'blank') {
            setState('x')
            gsap.to(box.current.rotation, {
                x: Math.PI/2,
                duration: 0.25,
            })
        } 
        // X -> Blank
        else if (state === 'x') {
            setState('blank')
            gsap.to(box.current.rotation, {
                x: 0,
                duration: 0.5,
            })
        }
    }

    const doubleCLick = (e) => {
        e.stopPropagation()
        e.nativeEvent.preventDefault()

        // -> Star
        if(state === 'blank' || state === 'x') {
            placeStar(group, placement[0], placement[1])
        }
    }

    return <group
        position={position}
        ref={box}
    >
        <mesh
            onClick={singleClick}
            onDoubleClick={doubleCLick}
            onContextMenu={doubleCLick}
            onPointerEnter={pointerEnter}
            onPointerLeave={pointerLeave}
            castShadow
            receiveShadow
            geometry={geometry}
            material={material}
        >
            {
                outlined && <Outlines color={'yellow'}/>
            }
        </mesh>
        <mesh
            ref={star}
            material={markMaterial}
            position-y={-0.5}
            rotation-y={Math.PI}
            scale={0.6}
        >
            <primitive object={starGeometry}/>
        </mesh>
        <mesh
            ref={mark}
            scale={[0.3, 0.3, 0.1]}
            position-z={-0.5}
            castShadow
            receiveShadow
            geometry={geometry}
            material={markMaterial}
        />
        <mesh
            ref={lock}
            scale={[0.4, 0.4, 0.2]}
            position-z={0.5}
            castShadow
            receiveShadow
            geometry={geometry}
            material={markMaterial}
        />
    </group>    
})

export default Box