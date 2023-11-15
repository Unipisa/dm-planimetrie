import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'

const requestAnimationFrameLoop = callback => {
    const loop = () => {
        callback()
        requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
}

export class PlanimetriaViewer {
    constructor(el) {
        this.el = el

        this.mountThreeCanvas()
        requestAnimationFrameLoop(() => this.animate())
    }

    mountThreeCanvas() {
        this.scene = new THREE.Scene()

        this.renderer = new THREE.WebGLRenderer({ canvas: this.el })
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        const cube = new THREE.Mesh(geometry, material)
        cube.position.x = 90
        cube.position.y = -20
        cube.position.z = -4
        // scene.add( cube );

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.controls = new OrbitControls(this.camera, this.el)
        // const controls = new FirstPersonControls(camera, renderer.domElement)
        // const controls = new MapControls(camera, renderer.domElement)

        // controls.enableDamping = true

        this.camera.position.x = 0
        this.camera.position.y = 0
        this.camera.position.z = 10
        this.scene.add(new THREE.AxesHelper(5))

        var loader = new ColladaLoader()

        loader.load('/dm.dae', collada => {
            var dm = collada.scene.children[0]
            dm.rotation.x = -Math.PI / 2
            let s = 0.0254 // one inch in meters
            dm.scale.set(s, s, s)
            dm.position.x = -90
            dm.position.y = 2
            dm.position.z = -20
            this.scene.add(dm)
        })

        const light = new THREE.AmbientLight(0x888888) // soft white light
        this.scene.add(light)

        // White directional light at half intensity shining from the top.
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        this.scene.add(directionalLight)
    }

    animate() {
        this.renderer.render(this.scene, this.camera)
        this.controls.update()
    }
}
