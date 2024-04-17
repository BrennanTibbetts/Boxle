import { useRef, useState, forwardRef, useImperativeHandle } from "react"
import gsap from "gsap"

const Box = forwardRef(({group, geometry, material, markMaterial, placement = [0, 0, 5, 1]}, ref) => {

    useImperativeHandle(ref, () => ({
        groupCascade(row, column) {
            triggerOne()
        },
        rowCascade(row) {
            console.log(`Cascade triggered for group: ${group} at row: ${placement[0]}`);
        },
        columnCascade(column) {
            console.log(`Cascade triggered for group: ${group} at column: ${placement[1]}`);
        }
    }));


    const [state, setState] = useState('blank')

    const position = [
        (((placement[1]) - placement[2] / 2) + 0.5) * placement[3],
        0,
        (((placement[0]) - placement[2] / 2) + 0.5) * placement[3]
    ]

    const box = useRef()
    const mark = useRef()

    const triggerOne = (e) => {

        if(e)
            e.stopPropagation()

        if(e && e.shiftKey) {
            triggerTwo(e)
            return
        }

        // Blank -> X
        if(state === 'blank') {
            setState('x')
            gsap.to(box.current.rotation, {
                x: Math.PI,
                duration: 0.5,
            })
        } 
        // X -> Blank
        else if (state === 'x', 'star') {
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
        }

        console.log(state)
    }

    const triggerTwo = (e) => {

        e.stopPropagation()
        e.nativeEvent.preventDefault()

        // -> Star
        if(state === 'blank' || state === 'x') {
            setState('star')
            gsap.to(box.current.rotation, {
                x: Math.PI,
                duration: 0.5,
            })
            gsap.to(mark.current.scale, {
                x: 0.8,
                z: 0.8,
                duration: 0.5,
            })
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

    const hover = (e) => {
        e.stopPropagation()
        console.log('hover')
        gsap.to(box.current.scale, {
            x: 0.9,
            y: 0.9,
            z: 0.9,
            duration: 0.5
        })
    }

    const unhover = (e) => {
        e.stopPropagation()
        gsap.to(box.current.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.5
        })
    }

    return <group
        position={position}
        ref={box}
    >
        <mesh
            onClick={triggerOne}
            onDoubleClick={triggerTwo}
            onContextMenu={triggerTwo}
            onPointerEnter={hover}
            onPointerLeave={unhover}
            castShadow
            receiveShadow
            geometry={geometry}
            material={material}
        />
        <mesh
            ref={mark}
            scale={0.3}
            position-y={-0.5}
            castShadow
            receiveShadow
            geometry={geometry}
            material={markMaterial}
        />
    </group>    
})

export default Box