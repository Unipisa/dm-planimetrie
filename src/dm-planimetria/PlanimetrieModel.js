import * as THREE from 'three'

import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import { recursivelyFlattenGeometry, recursivelyRemoveLineSegments } from '../lib/three-utils.js'

const loadModelDM = cb => {
    const loader = new ColladaLoader()
    loader.load(`${process.env.BASE_URL}/dm.dae`, collada => {
        const dm = collada.scene.children[0]

        recursivelyRemoveLineSegments(dm)

        /** one inch in meters */
        const INCH_TO_METER = 0.0254

        dm.rotation.x = -Math.PI / 2
        dm.scale.set(INCH_TO_METER, INCH_TO_METER, INCH_TO_METER)

        dm.zoomToCursor = true

        dm.position.x = -90
        dm.position.y = 2
        dm.position.z = -20

        dm.updateMatrixWorld()

        cb(dm)

        // Expose for debugging
        window.collada = collada
        window.dm = dm
    })
}

export class PlanimetrieModel extends THREE.Object3D {
    geometries = null

    constructor() {
        super()

        loadModelDM(dm => {
            this.add(dm)
            this.dispatchEvent({ type: 'load' })

            this.geometries = recursivelyFlattenGeometry(dm)
        })

        const light = new THREE.AmbientLight(0xdddddd) // soft white light
        this.add(light)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        this.add(directionalLight)
    }
}
