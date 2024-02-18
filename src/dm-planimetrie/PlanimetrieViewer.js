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

    constructor(el, getSelection, setSelection) {
        super()

        this.getSelection = getSelection
        this.setSelection = setSelection

        // Create renderer
        this.canvas3d = new Canvas3D(el)
        this.canvas3d.addEventListener('click', ({ event }) => this.#onCanvasClick(event))

        const updateRaycast = throttle(() => {
            const intersections = this.canvas3d.raycastObjectsAtMouse(this.#roomsGroup.children, {
                recursive: false,
            })

            if (intersections.length > 0) {
                const [{ object: roomObj }] = intersections
                this.#hoverRoom = roomObj
            } else {
                this.#roomsGroup.children.forEach(child => (child.visible = child.selected))
            }
        }, 1000 / 10)

        el.addEventListener('mousemove', e => {
            updateRaycast(e)
            this.canvas3d.requestRender()
        })

        this.canvas3d.camera.position.set(-0.3, 5.5, -7)

        this.canvas3d.setScene(
            construct(new THREE.Scene(), scene => {
                scene.background = new THREE.Color(0xffffff)

                return [
                    new PlanimetrieModel({
                        onLoad: () => {
                            this.canvas3d.requestRender()
                        },
                    }),
                    this.#roomsGroup,
                ]
            })
        )
        this.canvas3d.requestRender()
    }

    #onCanvasClick() {
        const intersections = this.canvas3d.raycastObjectsAtMouse(this.#roomsGroup.children, {
            recursive: false,
        })

        if (intersections.length > 0) {
            const [{ object: roomObj }] = intersections
            this.setSelection(selection => [...selection, roomObj.room._id])
        }

        this.canvas3d.requestRender()
    }

    setRooms(rooms) {
        this.#roomsGroup.clear()
        this.#roomsGroup.add(...rooms.map(room => new PlanimetrieRoom(room)))

        this.canvas3d.requestRender()
    }

    render() {
        const selection = new Set(getSelection())

        this.#roomsGroup.children.forEach(roomObj => {
            if (selection.has(roomObj.room._id)) {
                roomObj.setActiveStyle()
            } else if (roomObj === this.#hoverRoom) {
                roomObj.setHoverStyle()
            } else {
                roomObj.setHiddenStyle()
            }
        })

        this.canvas3d.requestRender()
    }

    onSelectionChanged() {
        const selection = new Set(this.getSelection())

        if (selection.size > 0) {
            const selectedRooms = this.#roomsGroup.children.filter(roomObj =>
                selection.has(roomObj.room._id)
            )

            let barycenter = new THREE.Vector3()
            selectedRooms.forEach(roomObj => barycenter.add(computeBarycenter(roomObj)))
            barycenter.divideScalar(selection.size)

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
