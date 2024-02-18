import * as THREE from 'three'

import { PlanimetrieModel } from './PlanimetrieModel.js'
import { Canvas3D } from './Canvas3D.js'
import { throttle } from '../lib/utils.js'
import { PlanimetrieRoom } from './PlanimetrieRoom.js'
import { recursivelyTraverseInBoundingBox } from '../lib/three-utils.js'

const computeBarycenter = roomObj => {
    const box = new THREE.Box3().setFromPoints(roomObj.room.polygon)
    const barycenter = new THREE.Vector3()
    return box.getCenter(barycenter)
}

const FLOOR_REGIONS = {
    'dm-floor-0': new THREE.Box3(new THREE.Vector3(-5.8, 0.1, -6), new THREE.Vector3(4.9, 0.7, 0.5)),
    'dm-floor-1': new THREE.Box3(new THREE.Vector3(-5.8, 1.8, -6), new THREE.Vector3(4.9, 2.5, 0.5)),
    'dm-floor-2': new THREE.Box3(new THREE.Vector3(-5.8, 2.8, -6), new THREE.Vector3(4.9, 3.5, 0.5)),
    'exdma-floor-0': null,
    'exdma-floor-1': null,
    'exdma-floor-2': null,
}

export class PlanimetrieViewer extends THREE.EventDispatcher {
    // Handles
    #roomsGroup = new THREE.Group()

    #hoverRoom = null

    #selection = new Set()

    #model = null

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

        this.#model = new PlanimetrieModel(this.canvas3d)
        scene.add(this.#model)

        const light = new THREE.AmbientLight(0xdddddd) // soft white light
        scene.add(light)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 2, 3).normalize()
        scene.add(directionalLight)

        scene.add(this.#roomsGroup)
    }

    toggleRegion(name, visible) {
        const region = FLOOR_REGIONS[name]

        recursivelyTraverseInBoundingBox(this.#model, region, object3d => {
            object3d.visible = visible
        })

        this.canvas3d.requestRender()
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
