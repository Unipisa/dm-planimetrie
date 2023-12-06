import * as THREE from 'three'
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import { MapControls } from 'three/addons/controls/MapControls.js'
import { Cursor3D } from './cursor.js'

function recursivelyRemoveLineSegments(object) {
    if (object.isLineSegments) {
        object.parent.remove(object)
    } else {
        object.children.forEach(child => {
            recursivelyRemoveLineSegments(child)
        })
    }
}

export class PlanimetriaViewer extends THREE.EventDispatcher {
    constructor(el) {
        super()

        this.el = el
        this.renderRequested = false

        this.editing = false
        this.polygonClosed = false

        this.mountThreeCanvas()

        this.cursor = new Cursor3D(this.el, this.camera, this.scene.children)
        this.cursor.layers.set(2)
        this.cursor.addEventListener('move', () => {
            this.requestRender()
        })

        this.scene.add(this.cursor)

        this.mountPolylineWidget()
    }

    enableEditing() {
        this.editing = true

        this.resetState()
    }

    resetState() {
        // remove previous objects from scene
        this.vertices.forEach(v => this.scene.remove(v))
        this.scene.remove(this.polyline)

        this.closed = false
        this.vertices = []

        this.requestRender()
    }

    disableEditing() {
        this.editing = false
        this.resetState()
    }

    mountThreeCanvas() {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x282828)

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })
        this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)

        this.camera = new THREE.PerspectiveCamera(
            75,
            this.el.offsetWidth / this.el.offsetHeight,
            0.1,
            1000
        )
        this.camera.position.x = 0
        this.camera.position.y = 0
        this.camera.position.z = 10

        this.camera.layers.enable(0)
        this.camera.layers.enable(1)
        this.camera.layers.enable(2)

        this.cameraControls = new MapControls(this.camera, this.el)
        this.cameraControls.addEventListener('change', () => this.requestRender())

        this.raycaster = new THREE.Raycaster()

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

            this.scene.add(dm)

            this.requestRender()

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

    setPolyline(vertices) {
        const polygon = []

        for (let i = 0; i < vertices.length; i++) {
            polygon.push(vertices[i].x, vertices[i].y, vertices[i].z)
        }

        if (this.closed) {
            polygon.push(vertices[0].x, vertices[0].y, vertices[0].z)
        }

        this.polyline.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(polygon, 3)
        )
    }

    mountPolylineWidget() {
        this.vertices = []
        this.polyline = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 10 })
        )
        this.polyline.layers.set(2)

        let isMouseStill
        this.el.addEventListener('pointerdown', () => {
            isMouseStill = true
        })
        this.el.addEventListener('pointermove', () => {
            isMouseStill = false
        })

        this.el.addEventListener('pointerup', e => {
            // discard drag events
            if (!isMouseStill) return
            // discard if not editing
            if (!this.editing) return
            // discard non-left-click events
            if (e.button !== 0) return

            const pointer = new THREE.Vector2()
            pointer.x = (e.clientX / this.el.offsetWidth) * 2 - 1
            pointer.y = -(e.clientY / this.el.offsetHeight) * 2 + 1

            if (this.closed) {
                this.resetState()
            }

            this.raycaster.setFromCamera(pointer, this.camera)

            this.raycaster.layers.set(1)
            let intersections = this.raycaster.intersectObjects(this.scene.children, true)

            if (intersections.length === 0) {
                this.raycaster.layers.set(0)
                intersections = this.raycaster.intersectObjects(this.scene.children, true)
            }
            if (intersections.length > 0) {
                const intersection = intersections[0]
                if (intersection.object === this.vertices[0]) {
                    const polygon = this.vertices.map(m => m.position)
                    this.closed = true
                    this.setPolyline(polygon)
                    this.dispatchEvent({ type: 'polygon-closed', polygon })
                } else {
                    const vertex = new THREE.Mesh(
                        new THREE.SphereGeometry(0.01),
                        new THREE.MeshBasicMaterial({ color: 0xffff00 })
                    )
                    vertex.layers.set(1)
                    vertex.position.copy(intersection.point)

                    this.vertices.push(vertex)
                    this.setPolyline(this.vertices.map(m => m.position))
                    if (!this.scene.children.includes(this.polyline) && this.vertices.length > 1) {
                        this.scene.add(this.polyline)
                    }
                    this.scene.add(vertex)
                }
            }

            this.requestRender()
        })
    }

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
