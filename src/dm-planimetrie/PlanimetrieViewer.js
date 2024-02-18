import * as THREE from 'three'

import { construct, updateRaycasterFromMouseEvent } from '../lib/three-utils.js'

import { PlanimetrieModel } from './PlanimetrieModel.js'
import { Canvas3D } from './Canvas3D.js'
import { throttle } from '../lib/utils.js'
import { PlanimetrieRoom } from './PlanimetrieRoom.js'

const computeBarycenter = roomObj => {
    const box = new THREE.Box3().setFromPoints(roomObj.room.polygon)
    const barycenter = new THREE.Vector3()
    return box.getCenter(barycenter)
}

export class PlanimetrieViewer extends THREE.EventDispatcher {
    // Handles
    #roomsGroup = new THREE.Group()

    #hoverRoom = null

    #selection = new Set()

    constructor(el) {
        super()

        // Create renderer
        this.canvas3d = new Canvas3D(el)
        this.canvas3d.addEventListener('click', ({ event }) => this.#onCanvasClick(event))

        // The hover effect is throttled to avoid too many raycast, for now it runs at ~25fps
        const updateRaycast = throttle(() => {
            const intersections = this.canvas3d.raycastObjectsAtMouse(this.#roomsGroup.children, {
                recursive: false,
            })

            this.#hoverRoom = intersections.length > 0 ? intersections[0].object : null
            this.render()
        }, 1000 / 25)

        el.addEventListener('mousemove', e => {
            updateRaycast(e)
        })

        this.canvas3d.camera.position.set(-0.3, 5.5, -7)

        const scene = this.canvas3d.scene
        scene.background = new THREE.Color(0xffffff)

        scene.add(new PlanimetrieModel(this.canvas3d))
        scene.add(this.#roomsGroup)
    }

    setRooms(rooms) {
        this.#roomsGroup.clear()
        this.#roomsGroup.add(...rooms.map(room => new PlanimetrieRoom(room)))
        this.canvas3d.requestRender()
    }

    setSelection(selection) {
        this.#selection = new Set(selection)
        this.render()

        this.#onSelectionChanged()
    }

    #onCanvasClick() {
        const intersections = this.canvas3d.raycastObjectsAtMouse(this.#roomsGroup.children, {
            recursive: false,
        })

        if (intersections.length > 0) {
            const roomObj = intersections[0].object

            this.dispatchEvent({
                type: 'room-click',
                id: roomObj.room._id,
            })
        }
    }

    render() {
        this.#roomsGroup.children.forEach(roomObj => {
            if (this.#selection.has(roomObj.room._id)) {
                roomObj.setActiveStyle()
            } else if (roomObj === this.#hoverRoom) {
                roomObj.setHoverStyle()
            } else {
                roomObj.setHiddenStyle()
            }
        })

        this.canvas3d.requestRender()
    }

    #onSelectionChanged() {
        if (this.#selection.size > 0) {
            const selectedRooms = this.#roomsGroup.children.filter(roomObj =>
                this.#selection.has(roomObj.room._id)
            )

            const barycenter = new THREE.Vector3()
            selectedRooms.forEach(roomObj => barycenter.add(computeBarycenter(roomObj)))
            barycenter.divideScalar(this.#selection.size)

            const maxDistance = selectedRooms.reduce(
                (max, roomObj) => Math.max(max, computeBarycenter(roomObj).distanceTo(barycenter)),
                1.0 // magic value, nearest distance to a room when zooming
            )

            const dir = this.canvas3d.camera.position
                .clone()
                .sub(barycenter)
                .setComponent(1, 0)
                .normalize()
                .setComponent(1, Math.tan(Math.PI / 4))
                .normalize()

            const newPosition = barycenter.clone().add(dir.multiplyScalar(maxDistance))
            const newTarget = barycenter.clone()

            this.canvas3d.animateCamera(newPosition, newTarget, 750)
        }
    }
}
