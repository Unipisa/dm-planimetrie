import * as THREE from 'three'

import { construct, updateRaycasterFromMouseEvent } from '../lib/three-utils.js'

import { PlanimetrieModel } from './PlanimetrieModel.js'
import { Canvas3D } from './Canvas3D.js'
import { throttle } from '../lib/utils.js'

const computeBarycenter = roomObj => {
    const box = new THREE.Box3().setFromPoints(roomObj.room.polygon)
    const barycenter = new THREE.Vector3()
    return box.getCenter(barycenter)
}

export class PlanimetrieViewer extends THREE.EventDispatcher {
    // State
    #selectedRooms = new Set()

    // Handles
    #roomsGroup = new THREE.Group()

    constructor(el) {
        super()

        // Create renderer
        this.canvas3d = new Canvas3D(el)
        this.canvas3d.addEventListener('click', ({ event }) => this.#onCanvasClick(event))

        const updateRaycast = throttle(() => {
            const intersections = this.canvas3d.raycastObjectsAtMouse(this.#roomsGroup.children, {
                recursive: false,
            })

            if (intersections.length > 0) {
                const [{ object: roomObj }] = intersections
                this.#roomsGroup.children.forEach(
                    (child, i) => (child.visible = child.selected || i === roomObj.userData.index)
                )
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
            this.toggleRoomSelection(roomObj.room._id)
        }

        this.canvas3d.requestRender()
    }

    setRooms(rooms) {
        this.#roomsGroup.clear()
        this.#roomsGroup.add(
            ...rooms.map((room, i) => {
                const roomObj = new PlanimetriaRoom(room)

                roomObj.userData.index = i

                return roomObj
            })
        )

        this.canvas3d.requestRender()
    }

    clearSelection() {
        const prevSize = this.#selectedRooms.size

        this.#selectedRooms.clear()

        if (prevSize !== this.#selectedRooms.size) {
            this.dispatchEvent({
                type: 'selection-changed',
                ids: this.#selectedRooms,
            })
        }

        this.#updateSelection()
    }

    toggleRoomSelection(id, force = null) {
        const prevSize = this.#selectedRooms.size

        ;(force === null ? !this.#selectedRooms.has(id) : force)
            ? this.#selectedRooms.add(id)
            : this.#selectedRooms.delete(id)

        if (prevSize !== this.#selectedRooms.size) {
            this.dispatchEvent({
                type: 'selection-changed',
                ids: this.#selectedRooms,
            })
        }

        this.#updateSelection()
    }

    #updateSelection() {
        this.#roomsGroup.children.forEach(roomObj => {
            roomObj.setSelected(this.#selectedRooms.has(roomObj.room._id))
            roomObj.visible ||= roomObj.selected
        })

        if (this.#selectedRooms.size > 0) {
            let barycenter = new THREE.Vector3()
            this.#roomsGroup.children
                .filter(roomObj => roomObj.selected)
                .forEach(roomObj => barycenter.add(computeBarycenter(roomObj)))

            barycenter.divideScalar(this.#selectedRooms.size)

            const maxDistance = this.#roomsGroup.children
                .filter(roomObj => roomObj.selected)
                .reduce(
                    (max, roomObj) =>
                        Math.max(max, computeBarycenter(roomObj).distanceTo(barycenter)),
                    1.0
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

        this.canvas3d.requestRender()
    }
}

// TODO: Replace visible and selected with a single state field with three states
export class PlanimetriaRoom extends THREE.Object3D {
    /**@type {THREE.Mesh} */
    #mesh = null

    #selected = false

    static highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        depthTest: false,
    })

    static selectedMaterial = new THREE.MeshBasicMaterial({
        color: 0xffe332,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        depthTest: false,
    })

    constructor(room) {
        super()

        this.room = room

        const { x: x0, y: y0, z: z0 } = room.polygon[0]

        const geometry = new THREE.ExtrudeGeometry(
            new THREE.Shape(room.polygon.map(({ x, z }) => new THREE.Vector2(x - x0, z - z0))),
            {
                steps: 2,
                depth: 0.1,
                bevelEnabled: false,
            }
        )

        this.#mesh = new THREE.Mesh(geometry, PlanimetriaRoom.highlightMaterial)
        this.add(this.#mesh)

        this.rotateX(Math.PI / 2)
        this.scale.setZ(-1)
        this.position.set(x0, y0, z0)
    }

    // By default raycaster is a noop, but we need it so this is an
    // implementation that falls back to raycast on `#mesh`
    raycast(raycaster, intersects) {
        this.#mesh.raycast(raycaster, intersects)

        if (intersects.length > 0) {
            intersects.forEach(intersection => {
                if (intersection.object === this.#mesh) intersection.object = this
            })
        }
    }

    get selected() {
        return this.#selected
    }

    setSelected(value) {
        this.#selected = value
        this.#mesh.material = this.#selected
            ? PlanimetriaRoom.selectedMaterial
            : PlanimetriaRoom.highlightMaterial
    }
}