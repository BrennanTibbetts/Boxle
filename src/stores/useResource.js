import { create } from 'zustand'
import * as THREE from 'three'

export const COLORS = [
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

export const useResource = create((set, get) => ({
    geometries: new Map(),
    textures: new Map(),
    materials: new Map(),
    materialOffset: 0,

    addGeometry: (key, geometry) => {
        const { geometries } = get()
        if (!geometries.has(key)) {
            geometries.set(key, geometry)
            set({ geometries: new Map(geometries) })
        }
        return geometries.get(key)
    },

    addTexture: (key, texture) => {
        const { textures } = get()
        if (!textures.has(key)) {
            textures.set(key, texture)
            set({ textures: new Map(textures) })
        }
        return textures.get(key)
    },

    addMaterial: (key, material) => {
        const { materials } = get()
        if (!materials.has(key)) {
            materials.set(key, material)
            set({ materials: new Map(materials) })
        }
        return materials.get(key)
    },

    // Get or create a group material
    getGroupMaterial: (groupNumber, wireframe = false) => {
        const { materials, materialOffset } = get()
        const index = (groupNumber + materialOffset) % COLORS.length
        const key = `group-${index}-${wireframe}`

        if (!materials.has(key)) {
            const material = new THREE.MeshStandardMaterial({
                color: COLORS[index],
                wireframe
            })
            materials.set(key, material)
            set({ materials: new Map(materials) })
        }
        return materials.get(key)
    },

    setMaterialOffset: (offset) => set({ materialOffset: offset }),

    updateGroupMaterials: (wireframe) => {
        const { materials } = get()
        materials.forEach((material, key) => {
            if (key.startsWith('group-')) {
                material.wireframe = wireframe
            }
        })
    },

    dispose: () => {
        const { geometries, textures, materials } = get()
        geometries.forEach(geometry => geometry.dispose())
        textures.forEach(texture => texture.dispose())
        materials.forEach(material => material.dispose())
        set({
            geometries: new Map(),
            textures: new Map(),
            materials: new Map()
        })
    }
}))