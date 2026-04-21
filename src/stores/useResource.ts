import { create } from 'zustand'
import * as THREE from 'three'

export const COLORS: string[] = [
    'gold',
    'mediumpurple',
    'mediumaquamarine',
    'lightcoral',
    'lightyellow',
    'lightgreen',
    'lightseagreen',
    'lightslategray',
    'lightsteelblue',
    'lime',
    'cornflowerblue',
]

interface ResourceState {
    geometries: Map<string, THREE.BufferGeometry>
    textures: Map<string, THREE.Texture>
    materials: Map<string, THREE.Material>
    materialOffset: number
    addGeometry: (key: string, geometry: THREE.BufferGeometry) => THREE.BufferGeometry
    addTexture: (key: string, texture: THREE.Texture) => THREE.Texture
    addMaterial: (key: string, material: THREE.Material) => THREE.Material
    getGroupMaterial: (groupNumber: number, wireframe?: boolean) => THREE.MeshStandardMaterial
    setMaterialOffset: (offset: number) => void
    updateGroupMaterials: (wireframe: boolean) => void
    dispose: () => void
}

export const useResource = create<ResourceState>((set, get) => ({
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
        return geometries.get(key)!
    },

    addTexture: (key, texture) => {
        const { textures } = get()
        if (!textures.has(key)) {
            textures.set(key, texture)
            set({ textures: new Map(textures) })
        }
        return textures.get(key)!
    },

    addMaterial: (key, material) => {
        const { materials } = get()
        if (!materials.has(key)) {
            materials.set(key, material)
            set({ materials: new Map(materials) })
        }
        return materials.get(key)!
    },

    getGroupMaterial: (groupNumber, wireframe = false) => {
        const { materials, materialOffset } = get()
        const index = (groupNumber + materialOffset) % COLORS.length
        const key = `group-${index}-${wireframe}`

        if (!materials.has(key)) {
            const material = new THREE.MeshStandardMaterial({
                color: COLORS[index],
                wireframe,
            })
            materials.set(key, material)
            set({ materials: new Map(materials) })
        }
        return materials.get(key) as THREE.MeshStandardMaterial
    },

    setMaterialOffset: (offset) => set({ materialOffset: offset }),

    updateGroupMaterials: (wireframe) => {
        const { materials } = get()
        materials.forEach((material, key) => {
            if (key.startsWith('group-')) {
                (material as THREE.MeshStandardMaterial).wireframe = wireframe
            }
        })
    },

    dispose: () => {
        const { geometries, textures, materials } = get()
        geometries.forEach((g) => g.dispose())
        textures.forEach((t) => t.dispose())
        materials.forEach((m) => m.dispose())
        set({ geometries: new Map(), textures: new Map(), materials: new Map() })
    },
}))
