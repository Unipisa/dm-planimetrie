import * as THREE from 'three'

import { ALL_LAYERS, layerFromIndices, setRenderOnTop } from '../lib/three-utils.js'
import { Canvas3D } from './Canvas3D.js'

/**
 * A polyline widget that can be used to draw polylines on a 3D scene. Each
 * vertex of the polyline is represented by a sphere. The spheres can be clicked
 * to select the corresponding vertex. The widget emits a `click` event when a
 * vertex is clicked. The event contains the index of the vertex in the polyline
 * and the intersection object.
 *
 * @extends THREE.Object3D
 *
 * @param {Canvas3D} canvas3d - the canvas
 * @param {any} options - some optional parameters
 */
export class PolylineWidget extends THREE.Object3D {
    constructor(canvas3d, { vertexLayer, lineLayer } = {}) {
        super()

        /** @type {Canvas3D} */
        this.canvas3d = canvas3d

        this.vertexLayer = vertexLayer ?? layerFromIndices(1)
        this.lineLayer = lineLayer ?? layerFromIndices(2)
    }

    /**
     * @returns {{ index: number, intersection: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>> } | false}
     */
    onMouseClick() {
        const intersections = this.canvas3d.raycastObjectsAtMouse(this.children, {
            layers: this.vertexLayer,
            recursive: true,
        })

        if (intersections.length > 0) {
            const intersection = intersections[0]

            const { index } = intersection.object.userData
            return {
                index,
                intersection,
            }
        }

        return false
    }

    /**
     * Sets the vertices of the polyline. The vertices are represented by
     * spheres. An empty array can be passed to remove all vertices. The
     * polyline is closed if the `closed` parameter is set to `true`, by default
     * the polyline is not closed.
     */
    setPolyline(vertices, closed = false) {
        this.clear() // remove all existing children

        if (vertices.length >= 2) {
            this.add(this.#createPolyline(vertices, closed))
        }
        if (vertices.length > 0) {
            this.add(...vertices.map((v, i) => this.#createIndexedSphere(v, i)))
        }

        this.canvas3d.requestRender()
    }

    /**
     * Creates a sphere to represent a vertex of the polyline.
     *
     * We stores the vertex index directly on the object to avoid storing the
     * sphere instances in an array globally and having to search for the sphere
     * in the array when the sphere is clicked.
     */
    #createIndexedSphere(vector, index) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.01),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        )

        setRenderOnTop(sphere)
        sphere.layers.mask = this.vertexLayer.mask
        sphere.position.copy(vector)
        sphere.userData.index = index

        return sphere
    }

    #createPolyline(vertices, closed) {
        const polyline = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 5 })
        )

        setRenderOnTop(polyline)
        polyline.layers.mask = this.lineLayer.mask

        const coordsBuf = vertices.map(({ x, y, z }) => [x, y, z]).flat()
        if (closed) {
            const { x, y, z } = vertices[0] // append first vertex to close the polyline
            coordsBuf.push(x, y, z)
        }

        polyline.geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordsBuf, 3))

        return polyline
    }
}
