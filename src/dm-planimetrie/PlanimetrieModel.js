import * as THREE from 'three'

import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import {
    recursivelyFlattenGeometry,
    recursivelyRemoveLineSegments,
    recursivelyTraverse,
} from '../lib/three-utils.js'

const loadModelDM = cb => {
    const loader = new ColladaLoader()
    loader.load(`${process.env.BASE_URL}/dm.dae`, collada => {
        const dm = collada.scene.children[0]

        // Makes all line segments in the model black
        recursivelyTraverse(dm, object3d => {
            if (object3d.isLineSegments) {
                object3d.material = new THREE.LineBasicMaterial({ color: 0x000000 })
            }
        })

        //
        // Model Alignment
        //

        const INCH_TO_METER = 0.0254

        dm.rotation.x = -Math.PI / 2
        dm.scale.set(INCH_TO_METER, INCH_TO_METER, INCH_TO_METER)

        dm.zoomToCursor = true

        // SketchUp model alignment (plz don't change this)
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

    constructor({ removeLines, onLoad } = {}) {
        super()

        removeLines ??= false

        loadModelDM(dm => {
            if (removeLines) {
                recursivelyRemoveLineSegments(dm)
            }

            this.geometries = recursivelyFlattenGeometry(dm)
            this.add(dm)
            onLoad?.(dm)
        })

        const light = new THREE.AmbientLight(0xdddddd) // soft white light
        this.add(light)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        this.add(directionalLight)

        // Extra lights

        // const light1 = new THREE.DirectionalLight(0xffffff, 1)
        // light1.position.set(0, 200, 0)
        // this.add(light1)

        // const light2 = new THREE.DirectionalLight(0xffffff, 1)
        // light2.position.set(100, 200, 100)
        // this.add(light2)

        // const light3 = new THREE.DirectionalLight(0xffffff, 1)
        // light3.position.set(-100, -200, -100)
        // this.add(light3)
    }
}