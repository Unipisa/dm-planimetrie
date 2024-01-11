import * as THREE from 'three'

import { MapControls } from 'three/addons/controls/MapControls.js'

export class Canvas3D {
    #renderRequested = false

    constructor(el, scene) {
        this.el = el
        this.scene = scene

        const { offsetWidth: width, offsetHeight: height } = el
        this.camera = new THREE.PerspectiveCamera(90, width / height, 0.01, 1000)
        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })

        this.#createCameraControls()
    }

    requestRender() {
        if (!this.#renderRequested) {
            this.#renderRequested = true

            requestAnimationFrame(() => {
                this.#renderCanvas()
                this.#renderRequested = false
            })
        }
    }

    #renderCanvas() {
        this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)
        this.renderer.render(this.scene, this.camera)
        this.cameraControls.update()
    }

    #createCameraControls() {
        this.cameraControls = new MapControls(this.camera, this.el)
        this.cameraControls.addEventListener('change', () => this.requestRender())
    }
}
