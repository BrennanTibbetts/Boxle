import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

const props = {
    boxSegments: {
        value: 3,
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
    spacing: {
        value: 1.1,
        min: 1,
        max: 2,
        step: 0.01
    },
    boxWireframe: false
}


const boxGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
const markMaterial = new THREE.MeshStandardMaterial({color: '#272729'})

const materialCache = {}
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

    if (!materialCache[color]) {
        materialCache[color] = new THREE.MeshStandardMaterial({color, wireframe: props.boxWireframe})
    }

    return materialCache[color]
}

const fillMaterialCache = () => {
    for (let i = 0; i < 9; i++) {
        getMaterial(i)
    }

    return materialCache
}

export { boxGeometry, markMaterial, fillMaterialCache }
