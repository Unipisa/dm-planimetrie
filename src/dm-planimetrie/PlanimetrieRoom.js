import * as THREE from 'three'

import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
    depthTest: false,
})

const activeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe332,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    depthTest: false,
})

const ROOM_HEIGHT = 0.1 // guessed

export class PlanimetrieRoom extends THREE.Object3D {
    /**@type {THREE.Mesh} */
    #mesh = null

    constructor(room) {
        super()

        this.room = room

        // polygon origin, first point
        const { x: x0, y: y0, z: z0 } = room.polygon[0]

        // ExtrudeGeometry takes a 2d-shape and a set of extrusion parameters, by
        // default the extrusion is along the Z-axis, later we rotate the model
        // to fix this as we want the extrusion along the Y-axis
        const geometry = new THREE.ExtrudeGeometry(
            new THREE.Shape(room.polygon.map(({ x, z }) => new THREE.Vector2(x - x0, z - z0))),
            {
                steps: 2,
                depth: ROOM_HEIGHT,
                bevelEnabled: false, // by default this is on and is not very good looking
            }
        )

        this.#mesh = new THREE.Mesh(geometry, hoverMaterial)
        this.add(this.#mesh)

        this.rotateX(Math.PI / 2)
        this.scale.setZ(-1)
        this.position.set(x0, y0, z0)

        const text = document.createElement('div')
        text.classList.add('room-tooltip')
        text.textContent = room.code
        this.label = new CSS2DObject(text)
        const barycenter = this.computeRoomBarycenter()
        this.label.position.copy(this.worldToLocal(barycenter.add(new THREE.Vector3(0, ROOM_HEIGHT * 1.25, 0))))
        this.add(this.label)
    }

    setHiddenStyle() {
        this.visible = false
        this.label.visible = false
    }

    setHoverStyle() {
        this.visible = true
        // ?
        this.label.visible = true
        this.#mesh.material = hoverMaterial
    }

    setActiveStyle() {
        this.label.visible = true
        this.visible = true
        this.#mesh.material = activeMaterial
    }


    computeRoomBarycenter() {
        const box = new THREE.Box3().setFromPoints(this.room.polygon)
        const barycenter = new THREE.Vector3()
        return box.getCenter(barycenter)
    }

    // By default raycaster is a noop, but we need it so this is an
    // implementation that falls back to raycast on `#mesh`
    raycast(raycaster, intersects) {
        this.#mesh.raycast(raycaster, intersects)

        if (intersects.length > 0) {
            //  patch intersection result to make this the intersection target
            //  and not a nested geometry
            intersects.forEach(intersection => {
                if (intersection.object === this.#mesh) intersection.object = this
            })
        }
    }
}
