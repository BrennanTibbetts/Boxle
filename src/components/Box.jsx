import gsap from "gsap"
import { Outlines } from "@react-three/drei"
import { useRef, forwardRef, useMemo, useImperativeHandle } from "react"

import { useResource } from "../stores/useResource"
import useButtonAnimation from "../utils/useButtonAnimation"
import useGame, { BoxState } from "../stores/useGame"

const Box = forwardRef(({ group, placement, placeStar }, ref) => {

    const getBoxState = useGame((state) => state.getBoxState)
    const updateBoxState = useGame((state) => state.updateBoxState)
    const boxIndex = placement[0] * placement[2] + placement[1]

    const boxState = getBoxState(boxIndex)(useGame.getState())

    const geometry = useMemo(() => useResource.getState().geometries.get('box'), [])
    const starGeometry = useMemo(() => useResource.getState().geometries.get(BoxState.STAR), [])
    const markMaterial = useMemo(() => useResource.getState().materials.get('mark'), [])
    const material = useMemo(() => useResource.getState().getGroupMaterial(group), [group])

    const decrementLives = useGame((state) => state.decrementLives)

    useImperativeHandle(ref, () => ({
        acceptStar() {
            updateBoxState(boxIndex, BoxState.STAR)
            gsap.to(box.current.rotation, {
                x: Math.PI,
                duration: 0.5,
            })
        },
        declineStar() {
            decrementLives()
        },
        groupCascade() {
            updateBoxState(boxIndex, BoxState.LOCK)
            gsap.to(box.current.rotation, {
                x: -Math.PI / 2,
                duration: 0.25,
            })
        },
        rowCascade(column) {
            const newState = column > placement[1] ? BoxState.LOCK : BoxState.LOCK
            updateBoxState(boxIndex, newState)
            gsap.to(box.current.rotation, {
                x: -Math.PI / 2,
                duration: 0.25,
            })
        },
        columnCascade(row) {
            const newState = row > placement[0] ? BoxState.LOCK : BoxState.LOCK
            updateBoxState(boxIndex, newState)
            gsap.to(box.current.rotation, {
                x: -Math.PI / 2,
                duration: 0.25,
            })
        },
        cornerCascade() {
            updateBoxState(boxIndex, BoxState.LOCK)
            gsap.to(box.current.rotation, {
                x: -Math.PI / 2,
                duration: 0.25,
            })
        },
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

        const index = boxIndex
        switch (boxState) {
        case BoxState.BLANK:
            updateBoxState(index, BoxState.MARK)
            gsap.to(box.current.rotation, { x: Math.PI / 2, duration: 0.25 })
            break
        case BoxState.MARK:
            updateBoxState(index, BoxState.BLANK)
            gsap.to(box.current.rotation, { x: 0, duration: 0.5 })
            break
        default:
            break
        }
    }

    const doubleCLick = (e) => {
        e.stopPropagation()
        e.nativeEvent.preventDefault()

        if (
            boxState === BoxState.BLANK ||
            boxState === BoxState.MARK
        ) {
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
                outlined && <Outlines color={'yellow'} />
            }
        </mesh>
        <mesh
            ref={star}
            material={markMaterial}
            position-y={-0.5}
            rotation-y={Math.PI}
            scale={0.6}
        >
            <primitive object={starGeometry} />
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