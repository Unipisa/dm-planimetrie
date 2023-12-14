import * as THREE from 'three'
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import { MapControls } from 'three/addons/controls/MapControls.js'
import { Cursor3D } from './cursor.js'

/**
 * @param {THREE.Object3D} object3d
 */
function recursivelyRemoveLineSegments(object3d) {
    if (object3d.isLineSegments) {
        object3d.parent.remove(object3d)
    } else {
        object3d.children.forEach(child => {
            recursivelyRemoveLineSegments(child)
        })
    }
}

/**
 * Recursively get all geometries in the given object, applying the local matrix
 * to each geometry and returning a list of updated float buffers
 */
function recursivelyFlattenGeometry(object3d) {
    if (object3d.isMesh) {
        const geometry = object3d.geometry.clone()
        geometry.applyMatrix4(object3d.matrixWorld)

        return [geometry]
    } else {
        return object3d.children.flatMap(child => {
            return recursivelyFlattenGeometry(child)
        })
    }
}

window.recursivelyFlattenGeometry = recursivelyFlattenGeometry

function nearestVertexInGeometry(geometry, point) {
    const vertices = geometry.attributes.position.array

    let minVertex = null
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2])
        const distance = vertex.distanceTo(point)

        if (distance < minDistance) {
            minDistance = distance
            minVertex = vertex
        }
    }

    return { vertex: minVertex, distance: minDistance }
}

function nearestVertexInGeometries(geometries, point) {
    let minVertex = null
    let minDistance = Number.POSITIVE_INFINITY

    geometries.forEach(geometry => {
        const { vertex, distance } = nearestVertexInGeometry(geometry, point)

        if (distance < minDistance) {
            minDistance = distance
            minVertex = vertex
        }
    })

    return { vertex: minVertex, distance: minDistance }
}

function throttle(fn, delay) {
    let lastCall = 0
    return function (...args) {
        const now = new Date().getTime()
        if (now - lastCall < delay) {
            return
        }
        lastCall = now
        return fn(...args)
    }
}

export class PlanimetriaViewer extends THREE.EventDispatcher {
    constructor(el) {
        super()

        this.el = el
        this.renderRequested = false

        // Internal State

        /** @type {'none' | 'polyline' | 'polygon'} */
        this.state = 'none'
        this.currentPolygon = []

        // Load model and setup scene

        this.#mountThreeCanvas()

        // Add raycasted mouse cursor
        this.cursor = new Cursor3D(this.el, this.camera, this.scene.children)
        this.cursor.layers.set(2)
        this.cursor.addEventListener('move', this.onCursorMove.bind(this))
        this.scene.add(this.cursor)

        // Nearest vertex, debug
        this.debugVertex = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        )
        this.scene.add(this.debugVertex)

        // Add polyline widget
        this.polyline = new PolylineWidget(this.el, this.camera)
        this.scene.add(this.polyline)

        onMouseDownWhileStill(this.el, this.onCanvasClick.bind(this))

        this.updateSnapping = throttle(this.updateSnapping.bind(this), 100)
    }

    updateSnapping() {
        if (!this.geometries) return

        // console.time('nearestVertexInGeometries')
        const { vertex, distance } = nearestVertexInGeometries(
            this.geometries,
            this.cursor.position
        )
        // console.timeEnd('nearestVertexInGeometries')

        // console.log(vertex, distance)

        this.snapVertex = vertex
        this.snapDistance = distance

        this.debugVertex.visible = distance < 0.1

        this.debugVertex.position.copy(vertex)
    }

    onCursorMove() {
        this.updateSnapping()
        this.requestRender()
    }

    // onPolylineVertexClicked({ index, mouseEvent: e }) {
    //     if (e.button !== 0) return // discard non-left-click events

    //     // if the first vertex is clicked, close the polygon
    //     if (this.state === 'polyline' && index === 0) {
    //         this.state = 'polygon'
    //         this.polyline.setPolyline(this.currentPolygon, true)
    //         this.requestRender()

    //         this.dispatchEvent({
    //             type: 'polygon-closed',
    //             polygon: this.currentPolygon,
    //         })
    //     }
    // }

    onCanvasClick(e) {
        if (e.button !== 0) return // discard non-left-click events

        const pointer = new THREE.Vector2()
        pointer.x = (e.clientX / this.el.offsetWidth) * 2 - 1
        pointer.y = -(e.clientY / this.el.offsetHeight) * 2 + 1

        this.raycaster.setFromCamera(pointer, this.camera)

        if (this.state === 'polyline') {
            const intersections = this.raycaster.intersectObjects(this.scene.children, true)
            if (intersections.length > 0) {
                const intersection = intersections[0]

                const index = this.polyline.vertexSpheres.indexOf(intersection.object)
                if (index !== -1) {
                    // a vertex was clicked
                    if (index === 0) {
                        // the first vertex was clicked
                        this.state = 'polygon'
                        this.polyline.setPolyline(this.currentPolygon, true)

                        this.dispatchEvent({
                            type: 'polygon-closed',
                            polygon: this.currentPolygon,
                        })
                    }
                } else {
                    // the model was clicked
                    if (this.snapDistance < 0.1) {
                        if (this.snapVertex.equals(this.currentPolygon[0])) {
                            // the first vertex was snapped to
                            this.state = 'polygon'
                            this.polyline.setPolyline(this.currentPolygon, true)

                            this.dispatchEvent({
                                type: 'polygon-closed',
                                polygon: this.currentPolygon,
                            })
                        } else {
                            this.currentPolygon.push(this.snapVertex)
                            this.polyline.setPolyline(this.currentPolygon)
                        }
                    } else {
                        this.currentPolygon.push(intersection.point)
                        this.polyline.setPolyline(this.currentPolygon)
                    }
                }

                this.requestRender()
            }
        } else if (this.state === 'polygon') {
            this.state = 'polyline'
            this.currentPolygon = []

            // check if the model was clicked and add the intersection point to the new polygon
            const intersections = this.raycaster.intersectObjects(this.scene.children, true)
            if (intersections.length > 0) {
                const intersection = intersections[0]

                if (this.snapDistance < 0.1) {
                    this.currentPolygon.push(this.snapVertex)
                } else {
                    this.currentPolygon.push(intersection.point)
                }

                this.polyline.setPolyline(this.currentPolygon)
            } else {
                this.polyline.setPolyline([])
            }

            this.requestRender()
        }
    }

    #mountThreeCanvas() {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0xffffff)

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })
        this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)

        this.camera = new THREE.PerspectiveCamera(
            90,
            this.el.offsetWidth / this.el.offsetHeight,
            0.01,
            1000
        )

        this.camera.position.set(0, 0, 10)
        this.camera.layers.enableAll()

        this.cameraControls = new MapControls(this.camera, this.el)
        this.cameraControls.addEventListener('change', () => this.requestRender())

        this.raycaster = new THREE.Raycaster()
        this.raycaster.layers.enable(0)
        this.raycaster.layers.enable(1)

        const loader = new ColladaLoader()

        loader.load(`${process.env.BASE_URL}/dm.dae`, collada => {
            const dm = collada.scene.children[0]

            recursivelyRemoveLineSegments(dm)

            dm.rotation.x = -Math.PI / 2
            const s = 0.0254 // one inch in meters
            dm.scale.set(s, s, s)
            dm.zoomToCursor = true
            dm.position.x = -90
            dm.position.y = 2
            dm.position.z = -20

            dm.updateMatrixWorld()

            this.scene.add(dm)

            this.requestRender()

            this.geometries = recursivelyFlattenGeometry(dm)

            // Expose for debugging
            window.collada = collada
            window.dm = dm
        })

        const light = new THREE.AmbientLight(0xdddddd) // soft white light
        this.scene.add(light)

        // White directional light at half intensity shining from the top.
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        this.scene.add(directionalLight)
    }

    //
    // Public API
    //

    startEditing() {
        this.state = 'polyline'
        this.currentPolygon = []
        this.polyline.setPolyline([])

        this.requestRender()
    }

    stopEditing() {
        this.state = 'none'
        this.currentPolygon = []
        this.polyline.setPolyline([])

        this.requestRender()
    }

    startEditingWith(polygon) {
        this.state = 'polygon'
        this.currentPolygon = polygon ?? []
        this.polyline.setPolyline(polygon ?? [], true)

        this.requestRender()
    }

    //
    // Internal rendering logic
    //

    requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true

            requestAnimationFrame(() => {
                this.render()
                this.renderRequested = false
            })
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera)
        this.cameraControls.update()
    }
}

/**
 * A polyline widget that can be used to draw polylines on a 3D scene. Each
 * vertex of the polyline is represented by a sphere. The spheres can be clicked
 * to select the corresponding vertex. The widget emits a `click` event when a
 * vertex is clicked. The event contains the index of the vertex in the polyline
 * and the intersection object.
 *
 * @fires vertex-clicked - when a vertex is clicked
 *
 * @extends THREE.Object3D
 *
 * @param {HTMLElement} el - the element to bind mouse events to, e.g the canvas
 * @param {THREE.Camera} camera - the camera used to project the mouse pointer
 */
class PolylineWidget extends THREE.Object3D {
    constructor(el, camera) {
        super()

        this.el = el
        this.camera = camera

        this.polyline = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 5 })
        )

        // render this object as overlay
        this.polyline.material.depthTest = false
        this.polyline.renderOrder = 1

        this.polyline.layers.set(2)

        this.vertexSpheres = []
    }

    /**
     * Sets the vertices of the polyline. The vertices are represented by
     * spheres. An empty array can be passed to remove all vertices. The
     * polyline is closed if the `closed` parameter is set to `true`, by default
     * the polyline is not closed.
     */
    setPolyline(vertices, closed = false) {
        this.vertexSpheres.forEach(s => this.remove(s))
        this.vertexSpheres = []
        this.remove(this.polyline)

        // recreate the polyline geometry

        if (vertices.length >= 2) {
            const polygon = vertices.map(v => [v.x, v.y, v.z]).flat()
            if (closed) {
                polygon.push(vertices[0].x, vertices[0].y, vertices[0].z)
            }

            this.polyline.geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(polygon, 3)
            )

            this.add(this.polyline)
        }

        // create spheres for each vertex

        if (vertices.length > 0) {
            this.vertexSpheres = vertices.map(v => {
                const vertexSphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.01),
                    new THREE.MeshBasicMaterial({ color: 0xffff00 })
                )
                vertexSphere.layers.set(1)
                vertexSphere.position.copy(v)

                // render this object as overlay
                vertexSphere.material.depthTest = false
                vertexSphere.renderOrder = 1

                return vertexSphere
            })

            this.add(...this.vertexSpheres)
        }
    }
}

const onMouseDownWhileStill = (el, callback) => {
    let isMouseStill
    el.addEventListener('pointerdown', () => {
        isMouseStill = true
    })
    el.addEventListener('pointermove', () => {
        isMouseStill = false
    })
    el.addEventListener('pointerup', e => {
        if (isMouseStill) {
            callback(e)
        }
    })
}
