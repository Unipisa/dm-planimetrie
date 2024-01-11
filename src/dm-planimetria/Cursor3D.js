import * as THREE from 'three'

/**
 * A 3D cursor that follows the mouse pointer and uses a raycaster to detect
 * intersections with objects. The cursor is represented by a small sphere. The
 * sphere is not visible when it intersects with an object. The cursor is always
 * positioned on the nearest intersection point with the objects.
 *
 * @fires move - when the cursor is moved
 *
 * @param {HTMLElement} el - the element to listen for mouse events, generally the canvas
 * @param {THREE.Camera} camera - the camera used to project the mouse pointer
 * @param {THREE.Object3D[]} objects - the objects to select from when the cursor is moved over them
 *
 * @extends THREE.Object3D
 */
export class Cursor3D extends THREE.Object3D {
    constructor(el, camera, objects) {
        super()

        this.camera = camera
        this.el = el
        this.objects = objects

        this.raycaster = new THREE.Raycaster()

        this.setupObjects()
        this.setupEvents()
    }

    setupObjects() {
        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        )

        this.sphere.layers.set(2)

        this.add(this.sphere)
    }

    setupEvents() {
        this.el.addEventListener('pointermove', e => {
            const pointer = new THREE.Vector2()
            pointer.x = (e.clientX / this.el.offsetWidth) * 2 - 1
            pointer.y = -(e.clientY / this.el.offsetHeight) * 2 + 1

            this.raycaster.setFromCamera(pointer, this.camera)

            const intersections = this.raycaster.intersectObjects(this.objects, true)
            if (intersections.length > 0) {
                const intersection = intersections[0]

                // move the cursor to the nearest intersection point with the objects
                this.position.copy(intersection.point)
            }

            this.dispatchEvent({ type: 'move', pointer })
        })
    }
}
