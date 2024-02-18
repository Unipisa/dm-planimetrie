const hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
    depthTest: false,
})

const activeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe332,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    depthTest: false,
})

export class PlanimetrieRoom extends THREE.Object3D {
    /**@type {THREE.Mesh} */
    #mesh = null

    static ROOM_HEIGHT = 0.1 // guessed

    constructor(room) {
        super()

        this.room = room

        // polygon origin, first point
        const { x: x0, y: y0, z: z0 } = room.polygon[0]

        // ExtrudeGeometry takes a 2d-shape and a set of extrusion parameters, by
        // default the extrusion is along the Z-axis, later we rotate the model
        // to fix this as we want the extrusion along the Y-axis
        const geometry = new THREE.ExtrudeGeometry(
            new THREE.Shape(room.polygon.map(({ x, z }) => new THREE.Vector2(x - x0, z - z0))),
            {
                steps: 2,
                depth: ROOM_HEIGHT,
                bevelEnabled: false, // by default this is on and is not very good looking
            }
        )

        this.#mesh = new THREE.Mesh(geometry, hoverMaterial)
        this.add(this.#mesh)

        this.rotateX(Math.PI / 2)
        this.scale.setZ(-1)
        this.position.set(x0, y0, z0)
    }

    setHiddenStyle() {
        this.visible = false
    }

    setHoverStyle() {
        this.visible = true
        this.#mesh.material = hoverMaterial
    }

    setActiveStyle() {
        this.visible = true
        this.#mesh.material = activeMaterial
    }

    // By default raycaster is a noop, but we need it so this is an
    // implementation that falls back to raycast on `#mesh`
    raycast(raycaster, intersects) {
        this.#mesh.raycast(raycaster, intersects)

        if (intersects.length > 0) {
            //  patch intersection result to make this the intersection target
            //  and not a nested geometry
            intersects.forEach(intersection => {
                if (intersection.object === this.#mesh) intersection.object = this
            })
        }
    }
}
