import * as THREE from 'three'

import { Canvas3D } from './Canvas3D.js'
import { Cursor3D } from './Cursor3D.js'
import { PlanimetrieModel } from './PlanimetrieModel.js'
import { PolylineWidget } from './PolylineWidget.js'

import { layerFromIndices, nearestVertexInGeometries } from '../lib/three-utils.js'
import { throttle } from '../lib/utils.js'

export class PlanimetrieTool extends THREE.EventDispatcher {
    /** @type {'none' | 'open' | 'closed'} */
    drawState = 'none'
    /** @type {THREE.Vector3[]} */
    polygon = []

    /** @type {PlanimetrieModel} */
    #model = null

    constructor(el) {
        super()

        // Create renderer
        this.canvas3d = new Canvas3D(el)
        this.canvas3d.scene.background = new THREE.Color(0xffffff)

        this.#model = new PlanimetrieModel(this.canvas3d, {
            removeLines: true,
        })

        const snappingVertexSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )

        // the 3d cursor is raycasted only on the model
        this.cursorWidget = new Cursor3D(this.canvas3d, this.#model.children)

        const updateSnapping = throttle(() => {
            if (!this.#model.geometries) return
            this.snap = nearestVertexInGeometries(
                this.#model.geometries,
                this.cursorWidget.position
            )

            snappingVertexSphere.visible = this.snap.distance < 0.1
            snappingVertexSphere.position.copy(this.snap.point)

            this.canvas3d.requestRender()
        }, 100)

        this.cursorWidget.layers.set(2)
        this.cursorWidget.addEventListener('move', () => {
            updateSnapping()
        })

        // Polyline
        const polylineLayerMask = new THREE.Layers()
        polylineLayerMask.set(1)

        this.polylineWidget = new PolylineWidget(this.canvas3d)

        this.canvas3d.addEventListener('click', ({ event }) => this.onCanvasClick(event))

        this.canvas3d.scene.add(this.#model)
        this.canvas3d.scene.add(snappingVertexSphere)
        this.canvas3d.scene.add(this.cursorWidget)
        this.canvas3d.scene.add(this.polylineWidget)

        const light = new THREE.AmbientLight(0xdddddd) // soft white light
        this.canvas3d.scene.add(light)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        this.canvas3d.scene.add(directionalLight)

        this.canvas3d.camera.position.set(5, 5, 3.5)
    }

    onCanvasClick(e) {
        if (e.button !== 0) return // discard non-left-click events

        const { drawState, polygon } = mouseClickReducer(
            { drawState: this.drawState, polygon: this.polygon },
            {
                cursorPosition: this.cursorWidget.position,
                snap: this.snap,
                castIntersection: () => {
                    const intersections = this.canvas3d.raycastObjectsAtMouse(
                        this.#model.children,
                        {
                            layers: layerFromIndices(0),
                            recursive: true,
                        }
                    )

                    return intersections.length > 0 ? intersections[0] : false
                },
                isPolylineVertexClicked: () => {
                    return this.polylineWidget.onMouseClick(e)
                },
            }
        )

        console.log(drawState, polygon)

        if (this.drawState === 'open' && drawState === 'closed') {
            this.dispatchEvent({
                type: 'polygon-closed',
                polygon: this.polygon,
            })
        }

        this.#updateState({ drawState, polygon })
    }

    #render() {
        console.log(this.drawState, this.polygon)
        this.polylineWidget.setPolyline(this.polygon, this.drawState === 'closed')
    }

    /**
     * @param {PlanimetrieState} state
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
 * @typedef {{ drawState: 'none' | 'open' | 'closed', polygon: THREE.Vector3[] }} PlanimetrieState
 */

/**
 * Questa funzione è un po' densa ma gestisce tutti i casi in cui qualcosa viene
 * cliccato e bisogna aggiornare il poligono che viene disegnato. Alla fine
 * ritorna un nuovo stato che contiene tutte le informazioni necessarie a
 * disegnare questo componente.
 *
 * @param {PlanimetrieState} state
 * @param {any} extra
 *
 * @returns {PlanimetrieState}
 */
const mouseClickReducer = (
    { drawState, polygon },
    { snap, isPolylineVertexClicked, castIntersection, cursorPosition }
) => {
    if (drawState === 'open') {
        const result = isPolylineVertexClicked()
        console.log(result, snap, cursorPosition)

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
