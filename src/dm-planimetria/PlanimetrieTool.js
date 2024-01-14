import * as THREE from 'three'

export class PlanimetrieTool extends THREE.EventDispatcher {
    /** @type {'none' | 'open' | 'closed'} */
    drawState = 'none'
    /** @type {THREE.Vector3[]} */
    polygon = []

    constructor() {
        super()

        // Create renderer
        this.canvas3d = new Canvas3D(el)

        // Create object graph
        this.raycaster = this.#createRaycaster()
        this.scene = this.#createScene(el, this.canvas3d.camera)

        this.canvas3d.setScene(this.scene)
        this.canvas3d.requestRender()
    }
}
