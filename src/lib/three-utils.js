import * as THREE from 'three'

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

export const makeRenderOnTop = object => {
    object.material.depthTest = false
    object.renderOrder = 1
}

export const updateRaycasterFromMouseEvent = (raycaster, mouseEvent, camera) => {
    const pointer = new THREE.Vector2()
    pointer.x = (mouseEvent.clientX / mouseEvent.target.offsetWidth) * 2 - 1
    pointer.y = -(mouseEvent.clientY / mouseEvent.target.offsetHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
}
