import { useRef, useState, forwardRef, useImperativeHandle } from "react"
import useButtonAnimation from "../utils/useButtonAnimation"
import gsap from "gsap"
import { Outlines } from "@react-three/drei"

const Box = forwardRef(({group, geometry, material, markMaterial, placement = [0, 0, 5, 1], starGeometry, placeStar}, ref) => {

    const [state, setState] = useState('blank')

    useImperativeHandle(ref, () => ({
        acceptStar() {
            setState('star')
            gsap.to(box.current.rotation, {
                x: Math.PI,
                duration: 0.5,
            })
        },
        declineStar() {
            console.log('decline')
        },
        groupCascade() {
            // Blank -> X
            if(state === 'blank') {
                setState('x')
                gsap.to(box.current.rotation, {
                    x: Math.PI/2,
                    duration: 0.25,
                })
            } 
        },
        rowCascade(column) {
            if(state === 'blank') {
                if(column > placement[1]) {
                    setState('x')
                    gsap.to(box.current.rotation, {
                        x: Math.PI/2,
                        duration: 0.25,
                    })
                }else if(column < placement[1]) {
                    setState('x')
                    gsap.to(box.current.rotation, {
                        x: Math.PI/2,
                        duration: 0.25,
                    })
                }
            }
        },
        columnCascade(row) {
            if(state === 'blank') {
                if(row > placement[0]) {
                    setState('x')
                    gsap.to(box.current.rotation, {
                        x: Math.PI/2,
                        duration: 0.25,
                    })
                }else if(row < placement[0]) {
                    setState('x')
                    gsap.to(box.current.rotation, {
                        x: Math.PI/2,
                        duration: 0.25,
                    })
                }
            }
        },
        cornerCascade() {
            if(state === 'blank') {
                setState('x')
                gsap.to(box.current.rotation, {
                    x: Math.PI/2,
                    duration: 0.25,
                })
            }
        }
    }));

    const position = [
        (((placement[1]) - placement[2] / 2) + 0.5) * placement[3],
        0,
        (((placement[0]) - placement[2] / 2) + 0.5) * placement[3]
    ]

    let outlined = true 

    const box = useRef()
    const { ref: boxRef, enter: pointerEnter, leave: pointerLeave } = useButtonAnimation(
        box,
        (e) => {
            e.stopPropagation();
            gsap.to(box.current.scale, {
                x: 0.9,
                y: 0.9,
                z: 0.9,
                duration: 0.5
            });
        }
    );

    const mark = useRef()
    const star = useRef()

    const singleClick = (e) => {

        e.stopPropagation()

        if(e && e.shiftKey) {
            triggerTwo(e)
            return
        }

        // Blank -> X
        if(state === 'blank') {
            setState('x')
            gsap.to(box.current.rotation, {
                x: Math.PI/2,
                duration: 0.25,
            })
        } 
        // X -> Blank
        else if (state === 'x', 'star') {
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

        if(state === 'star') {
            setState('blank')
            gsap.to(box.current.rotation, {
                x: 0,
                duration: 0.5,
            })
            gsap.to(mark.current.scale, {
                x: 0.3,
                z: 0.3,
                duration: 0.5,
            })
            gsap.to(mark.current.geometry, {
                radius: 0.1,
                duration: 0.5,
            })
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
    </group>    
})

export default Box