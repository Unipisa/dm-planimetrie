import * as THREE from 'three'

class TransformableBoundingBox extends THREE.Group {
    constructor(camera, renderer) {
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

        this.sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
        this.sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))

        this.sphere1.position.set(-0.5, -0.5, -0.5)
        this.sphere2.position.set(0.5, 0.5, 0.5)

        const control1 = new THREE.TransformControls(camera, renderer.domElement)
        const control2 = new THREE.TransformControls(camera, renderer.domElement)

        control1.attach(this.sphere1)
        control2.attach(this.sphere2)

        this.add(control1)
        this.add(control2)

        this.add(new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff })))
        this.add(this.sphere1)
        this.add(this.sphere2)

        function animate() {
            update()
            renderer.render(scene, camera)
            requestAnimationFrame(animate)
        }

        animate()
    }

    update() {
        const sphere1Position = this.sphere1.position.clone()
        const sphere2Position = this.sphere2.position.clone()

        // Adjust box size
        this.position.copy(new THREE.Vector3().lerpVectors(sphere1Position, sphere2Position, 0.5))
        this.scale.set(
            // compute sizes
            Math.abs(sphere1Pos.x - sphere2Pos.x),
            Math.abs(sphere1Pos.y - sphere2Pos.y),
            Math.abs(sphere1Pos.z - sphere2Pos.z)
        )
    }
}
