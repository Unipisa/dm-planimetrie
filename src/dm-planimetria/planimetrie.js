import * as THREE from 'three'
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

export class PlanimetriaViewer {
    constructor(el) {
        this.el = el
        this.renderRequested = false

        this.mountThreeCanvas()
        this.mountBox()
    }

    mountThreeCanvas() {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0xeeeeee)

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera.position.x = 0
        this.camera.position.y = 0
        this.camera.position.z = 10

        this.cameraControls = new OrbitControls(this.camera, this.el)
        this.cameraControls.addEventListener('change', () => this.requestRender())

        const loader = new ColladaLoader()

        loader.load('/dm.dae', collada => {
            window.collada = collada

            const dm = collada.scene.children[0]
            dm.rotation.x = -Math.PI / 2
            const s = 0.0254 // one inch in meters
            dm.scale.set(s, s, s)
            dm.position.x = -90
            dm.position.y = 2
            dm.position.z = -20
            this.scene.add(dm)

            this.requestRender()
        })

        const light = new THREE.AmbientLight(0x888888) // soft white light
        this.scene.add(light)

        // White directional light at half intensity shining from the top.
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        this.scene.add(directionalLight)
    }

    mountBox() {
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.25 })

        // const pointMin = new THREE.SphereGeometry(0.1)
        // const pointMax = new THREE.SphereGeometry(0.1)

        const highlightGeometry = new THREE.BoxGeometry(1, 1, 1)

        const highlightBox = new THREE.Mesh(highlightGeometry, highlightMaterial)

        const controls = new TransformControls(this.camera, this.renderer.domElement)

        controls.setMode('scale')
        controls.attach(highlightBox)
        controls.addEventListener('change', () => {
            this.requestRender()
        })
        controls.addEventListener('dragging-changed', e => (this.cameraControls.enabled = !e.value))

        // const controlsMax = new TransformControls(this.camera, this.renderer.domElement)
        // // controlsMax.attach(highlightBox.geometry.max)
        // controlsMax.addEventListener('change', () => {
        //     controlsMax.this.requestRender()
        // })
        // controlsMax.addEventListener('dragging-changed', e => (this.cameraControls.enabled = !e.value))

        this.scene.add(controls)
        // this.scene.add(controlsMax)
        this.scene.add(highlightBox)
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
