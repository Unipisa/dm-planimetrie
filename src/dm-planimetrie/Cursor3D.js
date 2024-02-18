import * as THREE from 'three'
import { layerFromIndices, updateRaycasterFromMouseEvent } from '../lib/three-utils.js'
import { Canvas3D } from './Canvas3D.js'

/**
 * A 3D cursor that follows the mouse pointer and uses a raycaster to detect
 * intersections with objects. The cursor is represented by a small sphere. The
 * sphere is not visible when it intersects with an object. The cursor is always
 * positioned on the nearest intersection point with the objects.
 *
 * @fires move - when the cursor is moved
 *
 * @extends THREE.Object3D
 */
export class Cursor3D extends THREE.Object3D {
    /**
     * @param {Canvas3D} canvas3d - the camera used to project the mouse pointer
     * @param {THREE.Object3D[]} objects - the objects to select from when the cursor is moved over them
     */
    constructor(canvas3d, objects) {
        super()

        this.canvas3d = canvas3d
        this.objects = objects

        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        )
        this.sphere.layers.set(2)
        this.add(this.sphere)

        this.canvas3d.el.addEventListener('pointermove', () => {
            const intersections = this.canvas3d.raycastObjectsAtMouse(this.objects, {
                layers: layerFromIndices(0),
                recursive: true,
            })

            if (intersections.length > 0) {
                // move the cursor to the nearest intersection point with the objects
                this.position.copy(intersections[0].point)
            }

            this.canvas3d.requestRender()

            this.dispatchEvent({ type: 'move' })
        })
    }
}
