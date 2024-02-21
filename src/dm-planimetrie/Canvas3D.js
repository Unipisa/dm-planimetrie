import * as THREE from 'three'

import { MapControls } from 'three/addons/controls/MapControls.js'
import { clamp, onMouseDownWhileStill } from '../lib/utils.js'

const FOV = 80

window.THREE = THREE

export class Canvas3D extends THREE.EventDispatcher {
    #renderRequested = false

    #scene = new THREE.Scene()

    /** Is the mouse position inside the canvas container (from the top-left) */
    mousePosition = new THREE.Vector2()

    /** Is the rescaled mouse position in the range $[-1, +1]^2$ */
    #rescaledMousePosition = new THREE.Vector2()

    constructor(el) {
        super()

        this.el = el

        const { offsetWidth: width, offsetHeight: height } = el

        this.camera = new THREE.PerspectiveCamera(FOV, width / height, 0.01, 1000)
        this.cameraControls = this.#createCameraControls(this.el, this.camera)
        this.camera.layers.enableAll()

        window.camera = this.camera

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })
    }

    /**
     * Scene is readonly and owned by this class
     */
    get scene() {
        return this.#scene
    }

    #renderCanvas() {
        this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)
        this.renderer.setPixelRatio(2) // for crispier rendering
        this.cameraControls.update()
        this.renderer.render(this.#scene, this.camera)
    }

    #createCameraControls(el, camera) {
        const cameraControls = new MapControls(camera, el)
        cameraControls.addEventListener('change', () => this.requestRender())

        el.addEventListener('pointermove', e => {
            const { offsetX: x, offsetY: y } = e

            this.mousePosition.x = x
            this.mousePosition.y = y

            this.#rescaledMousePosition.x = (x / this.el.offsetWidth) * 2 - 1
            this.#rescaledMousePosition.y = -(y / this.el.offsetHeight) * 2 + 1
        })

        // register a click listener that works nicely with the camera controls
        onMouseDownWhileStill(el, e => {
            this.dispatchEvent({
                type: 'click',
                event: e,
            })
        })

        return cameraControls
    }

    moveCamera(position, target = null) {
        this.cameraControls.object.position.copy(position)
        if (target) this.cameraControls.target.copy(target)

        this.requestRender()
    }

    animateCamera(position, target = null, duration = 1000) {
        const oldPosition = this.camera.position.clone()
        const oldTarget = this.cameraControls.target.clone()

        if (oldPosition.distanceTo(position) < 1e-3 && oldTarget.distanceTo(target) < 1e-3) {
            this.moveCamera(position, target)
            return
        }

        const startTime = new Date().getTime()

        // custom easing function, "fast then slow"
        const easeOut1 = t => t * (2 - t)
        const easeOut2 = t => easeOut1(easeOut1(t))

        const animate = () => {
            const t = clamp(0, (new Date().getTime() - startTime) / duration, 1)
            const s = easeOut2(t)

            this.moveCamera(
                oldPosition.clone().lerp(position, s),
                target ? oldTarget.clone().lerp(target, s) : oldTarget
            )

            if (t < 1) {
                requestAnimationFrame(animate)
            } else {
                // in this case updateCamera was already called with 1 and we can exit
                this.cameraControls.enabled = true
            }
        }

        // disable orbit controls to prevent user interaction while animating
        this.cameraControls.enabled = false
        requestAnimationFrame(animate)
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

    /**
     * Utility method that avoids the need for keeping around a raycaster and
     * needing a mouse event object, this just needs an object to raycast onto,
     * a set of layers (by default all enabled) and if to search recursively
     * inside the given object
     *
     * @param {THREE.Object3D} object
     * @param {RaycastOptions} options
     *
     * @returns {THREE.Intersection[]}
     */
    raycastObjectAtMouse(object, { layers, recursive } = {}) {
        if (!recursive) {
            recursive = false
        }
        if (!layers) {
            layers = new THREE.Layers()
            layers.enableAll()
        }

        const raycaster = new THREE.Raycaster()
        raycaster.layers.mask = layers.mask
        raycaster.setFromCamera(this.#rescaledMousePosition, this.camera)

        return raycaster.intersectObject(object, recursive)
    }

    /**
     * @param {THREE.Object3D} objects
     * @param {RaycastOptions} options
     *
     * @returns {THREE.Intersection[]}
     *
     * @see raycastObjectAtMouse
     */
    raycastObjectsAtMouse(objects, { layers, recursive } = {}) {
        if (!recursive) {
            recursive = false
        }
        if (!layers) {
            layers = new THREE.Layers()
            layers.enableAll()
        }

        const raycaster = new THREE.Raycaster()
        raycaster.layers.mask = layers.mask
        raycaster.setFromCamera(this.#rescaledMousePosition, this.camera)

        return raycaster.intersectObjects(objects, recursive)
    }
}
