import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

export class TransformableBoundingBox extends THREE.Object3D {
    constructor(camera, renderer, cameraControls) {
        super();

        this.camera = camera
        this.renderer = renderer
        this.cameraControls = cameraControls

        this.sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
        this.sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))

        this.sphere1.position.set(0,0,0)
        this.sphere2.position.set(1,1,1)

        const control1 = new TransformControls(camera, renderer.domElement)
        const control2 = new TransformControls(camera, renderer.domElement)

        control1.attach(this.sphere1)
        control2.attach(this.sphere2)

        this.add(control1)
        this.add(control2)

        control1.addEventListener('change', () => {
            this.dispatchEvent( { type: 'change' } );
        })
        control1.addEventListener('dragging-changed', e => (this.cameraControls.enabled = !e.value))
        control2.addEventListener('change', () => {
            this.dispatchEvent( { type: 'change' } );
        })
        control2.addEventListener('dragging-changed', e => (this.cameraControls.enabled = !e.value))

        // Cube
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

        this.add(new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff })))
        this.add(this.sphere1)
        this.add(this.sphere2)

        this.update()
    }

    update() {
        // const sphere1Position = this.sphere1.position.clone()
        // const sphere2Position = this.sphere2.position.clone()

        // // Adjust box size
        // this.position.copy(new THREE.Vector3().lerpVectors(sphere1Position, sphere2Position, 0.5))
        // this.scale.set(
        //     // compute sizes
        //     Math.abs(sphere1Pos.x - sphere2Pos.x),
        //     Math.abs(sphere1Pos.y - sphere2Pos.y),
        //     Math.abs(sphere1Pos.z - sphere2Pos.z)
        // )
    }
}
