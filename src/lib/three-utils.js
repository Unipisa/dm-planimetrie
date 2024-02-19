import * as THREE from 'three'

/**
 * Recursively get all geometries in the given object, applying the local matrix
 * to each geometry and returning a list of updated float buffers
 *
 * @param {THREE.Object3D} object3d
 */
export const recursivelyFlattenGeometry = object3d => {
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

/**
 * Recursively remove all line segments from the given object.
 *
 * @param {THREE.Object3D} object3d
 */
export const recursivelyRemoveLineSegments = object3d => {
    if (object3d.isLineSegments) {
        object3d.parent.remove(object3d)
    } else {
        object3d.children.forEach(child => {
            recursivelyRemoveLineSegments(child)
        })
    }
}

/**
 * Recursively traverse objects which are in a given bounding box
 *
 * @param {THREE.Object3D} object3d
 * @param {THREE.Box3} box
 * @param {(object3d: THREE.Object3D) => void} cb
 */
export const recursivelyTraverseInside = (object3d, box, cb) => {
    if (box.containsBox(new THREE.Box3().setFromObject(object3d))) {
        cb(object3d)
    }
    object3d.children.forEach(child => recursivelyTraverseInside(child, box, cb))
}

/**
 * Recursively traverse objects which are in a given bounding box
 *
 * @param {THREE.Object3D} object3d
 * @param {THREE.Box3} box
 * @param {(object3d: THREE.Object3D) => void} cb
 */
export const recursivelyTraverseIntersecting = (object3d, box, cb) => {
    if (box.intersectsBox(new THREE.Box3().setFromObject(object3d))) {
        cb(object3d)
    }
    object3d.children.forEach(child => recursivelyTraverseIntersecting(child, box, cb))
}

/**
 * Recursively traverse all objects
 *
 * @param {THREE.Object3D} object3d
 * @param {(object3d: THREE.Object3D) => void} cb
 */
export const recursivelyTraverse = (object3d, cb) => {
    cb(object3d)
    object3d.children.forEach(child => recursivelyTraverse(child, cb))
}

//
//
//

window.recursivelyFlattenGeometry = recursivelyFlattenGeometry

/**
 * Computes the nearest vertex in the given geometry to the given point.
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.Vector3} cursorPoint
 * @returns {{ point: THREE.Vector3, distance: number }}
 */
export const nearestVertexInGeometry = (geometry, cursorPoint) => {
    const vertices = geometry.attributes.position.array

    let minPoint = null
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < vertices.length; i += 3) {
        const point = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2])
        const distance = point.distanceTo(cursorPoint)

        if (distance < minDistance) {
            minDistance = distance
            minPoint = point
        }
    }

    return { point: minPoint, distance: minDistance }
}

/**
 * Computes the nearest vertex in the given geometries to the given point.
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.Vector3} cursorPoint
 * @returns {{ point: THREE.Vector3, distance: number }}
 */
export const nearestVertexInGeometries = (geometries, cursorPoint) => {
    let minPoint = null
    let minDistance = Number.POSITIVE_INFINITY

    geometries.forEach(geometry => {
        const { point, distance } = nearestVertexInGeometry(geometry, cursorPoint)

        if (distance < minDistance) {
            minDistance = distance
            minPoint = point
        }
    })

    return { point: minPoint, distance: minDistance }
}

/**
 * Sets `depthTest` to `false` and `renderOrder` to `1`
 *
 * @param {THREE.Object3D} object
 */
export const setRenderOnTop = object => {
    object.material.depthTest = false
    object.renderOrder = 1
}

/**
 * @param {THREE.Raycaster} raycaster
 * @param {MouseEvent} mouseEvent
 * @param {THREE.Camera} camera
 */
export const updateRaycasterFromMouseEvent = (raycaster, mouseEvent, camera) => {
    const pointer = new THREE.Vector2()

    pointer.x = (mouseEvent.offsetX / mouseEvent.target.offsetWidth) * 2 - 1
    pointer.y = -(mouseEvent.offsetY / mouseEvent.target.offsetHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
}

/**
 *
 * @param {THREE.Object3D} object3d
 * @param {() => THREE.Object3D[]} buildChildren
 */
export const construct = (object3d, buildChildren) => {
    object3d.add(...buildChildren(object3d).flat())
    return object3d
}

export const layerFromIndices = (...layers) => {
    const layer = new THREE.Layers()
    layer.disableAll()

    layers.forEach(i => layer.enable(i))

    return layer
}

const allLayersMask = new THREE.Layers()
allLayersMask.enableAll()

export const ALL_LAYERS = allLayersMask
