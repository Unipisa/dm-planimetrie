import * as THREE from 'three'

import { MapControls } from 'three/addons/controls/MapControls.js'
import { onMouseDownWhileStill } from '../lib/utils.js'

export class Canvas3D extends THREE.EventDispatcher {
    #renderRequested = false

    #scene = null

    constructor(el) {
        super()

        this.el = el

        const { offsetWidth: width, offsetHeight: height } = el

        this.camera = new THREE.PerspectiveCamera(90, width / height, 0.01, 1000)
        this.cameraControls = this.#createCameraControls(this.el, this.camera)
        this.camera.layers.enableAll()

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })
    }

    #renderCanvas() {
        this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)
        this.renderer.setPixelRatio(2) // for more crisp rendering
        this.renderer.render(this.#scene, this.camera)
        this.cameraControls.update()
    }

    #createCameraControls(el, camera) {
        const cameraControls = new MapControls(camera, el)
        cameraControls.addEventListener('change', () => this.requestRender())

        // register a click listener that works nicely with the camera controls
        onMouseDownWhileStill(el, e => {
            this.dispatchEvent({
                type: 'click',
                event: e,
            })
        })

        return cameraControls
    }

    requestRender() {
        if (!this.#scene) {
            throw new Error(`first you must set a scene`)
        }

        if (!this.#renderRequested) {
            this.#renderRequested = true

            requestAnimationFrame(() => {
                this.#renderCanvas()
                this.#renderRequested = false
            })
        }
    }

    // TODO: Is there a better way to organize this? For now this class owns the
    // camera but the scene can also depend on it like in our situation where
    // the scene depends on the camera because the Cursor3D needs it to raycast
    // it's position from the camera viewpoint.
    setScene(scene) {
        this.#scene = scene
    }
}
