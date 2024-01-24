import * as THREE from 'three'

import { Canvas3D } from './Canvas3D.js'
import { Cursor3D } from './Cursor3D.js'
import { PlanimetrieModel } from './PlanimetrieModel.js'
import { PolylineWidget } from './PolylineWidget.js'

import { nearestVertexInGeometries } from '../lib/three-utils.js'
import { onMouseDownWhileStill, throttle } from '../lib/utils.js'

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
        this.scene = this.#createScene(el, this.canvas3d.camera)

        this.canvas3d.camera.position.set(5, 5, 3.5)

        this.canvas3d.setScene(this.scene)
        this.canvas3d.requestRender()
    }

    onCanvasClick(e) {
        if (e.button !== 0) return // discard non-left-click events

        const { drawState, polygon } = mouseClickReducer(
            { drawState: this.drawState, polygon: this.polygon },
            {
                cursorPosition: this.cursorWidget.position,
                snap: this.snap,
                castIntersection: () => {
                    const intersections = this.canvas3d.raycastObjectsAtMouse(this.scene.children, {
                        recursive: true,
                    })
                    return intersections.length > 0 ? intersections[0] : false
                },
                isPolylineVertexClicked: () => {
                    return this.polylineWidget.onMouseClick(e)
                },
            }
        )

        if (this.drawState === 'open' && drawState === 'closed') {
            this.dispatchEvent({
                type: 'polygon-closed',
                polygon: this.polygon,
            })
        }

        this.#updateState({ drawState, polygon })
    }

    #createScene(el, camera) {
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xffffff)

        const model = new PlanimetrieModel()
        model.addEventListener('load', () => this.canvas3d.requestRender())

        scene.add(model)

        const snappingVertexSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )
        scene.add(snappingVertexSphere)

        this.cursorWidget = new Cursor3D(el, camera, scene.children)

        const updateSnapping = throttle(() => {
            if (!model.geometries) return
            this.snap = nearestVertexInGeometries(model.geometries, this.cursorWidget.position)

            snappingVertexSphere.visible = this.snap.distance < 0.1
            snappingVertexSphere.position.copy(this.snap.point)
        }, 100)

        this.cursorWidget.layers.set(2)
        this.cursorWidget.addEventListener('move', () => {
            updateSnapping()
            this.canvas3d.requestRender()
        })

        scene.add(this.cursorWidget)

        // Polyline
        this.polylineWidget = new PolylineWidget(camera)
        this.polylineWidget.addEventListener('updated', () => {
            this.canvas3d.requestRender()
        })

        scene.add(this.polylineWidget)

        onMouseDownWhileStill(el, this.onCanvasClick.bind(this))

        return scene
    }

    #render() {
        console.log(this.drawState, this.polygon)
        this.polylineWidget.setPolyline(this.polygon, this.drawState === 'closed')
    }

    /**
     * @param {PlanimetriaState} state
     */
    #updateState({ drawState, polygon }) {
        if (drawState !== undefined) this.drawState = drawState
        if (polygon !== undefined) this.polygon = polygon.map(v => v.clone())

        this.#render()
    }

    //
    // Public API
    //

    startEditing() {
        this.#updateState({
            drawState: 'open',
            polygon: [],
        })
    }

    cancelEditing() {
        this.#updateState({
            drawState: 'none',
            polygon: [],
        })
    }

    startEditingWith(vertices) {
        this.#updateState({
            drawState: 'closed',
            polygon: (vertices ?? []).map(({ x, y, z }) => new THREE.Vector3(x, y, z)),
        })
    }
}

/**
 * @typedef {{ drawState: 'none' | 'open' | 'closed', polygon: THREE.Vector3[] }} PlanimetriaState
 */

/**
 * @param {PlanimetriaState} state
 * @returns {PlanimetriaState}
 */
const mouseClickReducer = (
    { drawState, polygon },
    { snap, isPolylineVertexClicked, castIntersection, cursorPosition }
) => {
    if (drawState === 'open') {
        const result = isPolylineVertexClicked()
        return result
            ? result.index === 0 // check if the first vertex was clicked
                ? { drawState: 'closed', polygon }
                : { drawState, polygon } // if any other vertex is clicked do nothing
            : snap.distance < 0.1 // the mouse clicked near a vertex, apply snapping
            ? snap.point.equals(polygon[0]) // the first vertex was snapped to
                ? { drawState: 'closed', polygon }
                : { drawState, polygon: [...polygon, snap.point] } // snap to vertex on mesh and add it
            : { drawState, polygon: [...polygon, cursorPosition] } // a point on the surface of the mesh was clicked, add it
    }
    if (drawState === 'closed') {
        // check if the model was clicked and add the intersection point to the new polygon
        const intersection = castIntersection()
        return intersection // check if the model was clicked
            ? snap.distance < 0.1 // if the mouse clicked near a vertex, apply snapping
                ? { drawState: 'open', polygon: [snap.point] } // start with a new polygon with only the snapped vertex
                : { drawState: 'open', polygon: [intersection.point] } // otherwise use the vertex on the mesh surface
            : { drawState: 'open', polygon: [] } // otherwise reset the polygon completely
    }
    if (drawState === 'none') {
        return { drawState, polygon }
    }
}
