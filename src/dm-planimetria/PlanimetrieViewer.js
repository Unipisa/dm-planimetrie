import * as THREE from 'three'

import { updateRaycasterFromMouseEvent } from '../lib/three-utils.js'

import { PlanimetrieModel } from './PlanimetrieModel.js'
import { Canvas3D } from './Canvas3D.js'

export class PlanimetrieViewer extends THREE.EventDispatcher {
    constructor(el) {
        super()

        this.raycaster = new THREE.Raycaster()
        this.scene = this.#createScene()

        // Create renderer
        this.canvas3d = new Canvas3D(el, this.scene)
        this.canvas3d.camera.position.set(5, 5, 3.5)
        this.canvas3d.requestRender()
    }

    #createScene() {
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xffffff)

        const model = new PlanimetrieModel()
        model.addEventListener('load', () => {
            this.canvas3d.requestRender()
        })
        scene.add(model)

        this.canvas3d.addEventListener('click', ({ event }) => this.onCanvasClick(event))

        return scene
    }

    onCanvasClick(e) {
        updateRaycasterFromMouseEvent(this.raycaster, e, this.canvas3d.camera)
    }
}
