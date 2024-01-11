import * as THREE from 'three'

import { Cursor3D } from './Cursor3D.js'

import {
    Canvas3D,
    nearestVertexInGeometries,
    updateRaycasterFromMouseEvent,
} from '../lib/three-utils.js'
import { onMouseDownWhileStill, throttle } from '../lib/utils.js'
import { PlanimetrieModel } from './PlanimetrieModel.js'
import { PolylineWidget } from './PolylineWidget.js'

export class PlanimetriaViewer extends THREE.EventDispatcher {
    // UI State

    /** @type {'none' | 'open' | 'closed'} */
    drawState = 'none'
    /** @type {THREE.Vector3[]} */
    polygon = []

    constructor(el) {
        super()

        // Saved controls

        /** @type {PolylineWidget} */
        this.polylineWidget = null
        /** @type {Cursor3D} */
        this.cursorWidget = null

        // Create object graph

        this.raycaster = this.#createRaycaster()
        this.camera = this.#createCamera(el)
        this.scene = this.#createScene(el, this.camera)

        // Create renderer
        this.canvas3d = new Canvas3D(el, this.scene, this.camera)
    }

    onCanvasClick(e) {
        if (e.button !== 0) return // discard non-left-click events

        updateRaycasterFromMouseEvent(this.raycaster, e, this.camera)

        const { drawState, polygon } = mouseClickReducer(
            { drawState: this.drawState, polygon: this.polygon },
            {
                cursorPosition: this.cursorWidget.position,
                snap: this.snap,
                castIntersection: () => {
                    const intersections = this.raycaster.intersectObjects(this.scene.children, true)
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

    #createCamera({ offsetWidth: width, offsetHeight: height }) {
        const camera = new THREE.PerspectiveCamera(90, width / height, 0.01, 1000)
        camera.position.set(0, 0, 10)
        camera.layers.enableAll()

        return camera
    }

    #createRaycaster() {
        const raycaster = new THREE.Raycaster()
        raycaster.layers.enable(0)
        raycaster.layers.enable(1)

        return raycaster
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

    //
    // Public API
    //

    #render() {
        this.polylineWidget.setPolyline(this.polygon, this.drawState === 'closed')
    }

    /**
     * @param {PlanimetriaState} state
     */
    #updateState({ drawState, polygon }) {
        if (drawState) this.drawState = drawState
        if (polygon) this.polygon = polygon.map(v => v.clone())

        this.#render()
    }

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
