import * as THREE from 'three'

import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import {
    recursivelyFlattenGeometry,
    recursivelyRemoveLineSegments,
    recursivelyTraverse,
} from '../lib/three-utils.js'

async function streamToText(stream) {
    let result = ''
    const reader = stream.pipeThrough(new TextDecoderStream()).getReader()
    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }

        result += value
    }
    return result
}

const loadModelDM = async () => {
    const loader = new ColladaLoader()

    const res = await fetch(`${process.env.BASE_URL}/dm.dae.gz`, {
        'Accept-Encoding': 'gzip;q=0,deflate;q=0',
    })

    const blob = await res.blob()

    const ds = new DecompressionStream('gzip')
    const decompressedStream = blob.stream().pipeThrough(ds)
    const rawText = await streamToText(decompressedStream)

    // const rawText = await res.text()

    // console.log(rawText)

    const colladaModel = loader.parse(rawText, `${process.env.BASE_URL}/`)

    const dm = colladaModel.scene.children[0]

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

    // Expose for debugging
    window.colladaModel = colladaModel
    window.dm = dm

    return dm
}

export class PlanimetrieModel extends THREE.Object3D {
    geometries = null

    constructor(canvas3d, { removeLines } = {}) {
        super()

        removeLines ??= false

        loadModelDM().then(dm => {
            if (removeLines) {
                recursivelyRemoveLineSegments(dm)
            }

            this.geometries = recursivelyFlattenGeometry(dm)
            this.add(dm)

            canvas3d.requestRender()
        })
    }
}
