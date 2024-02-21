import * as THREE from 'three'

import { PlanimetrieModel } from './PlanimetrieModel.js'
import { Canvas3D } from './Canvas3D.js'
import { throttle } from '../lib/utils.js'
import { PlanimetrieRoom } from './PlanimetrieRoom.js'
import { recursivelyTraverseInside, recursivelyTraverseIntersecting } from '../lib/three-utils.js'

const computeBarycenter = roomObj => {
    const box = new THREE.Box3().setFromPoints(roomObj.room.polygon)
    const barycenter = new THREE.Vector3()
    return box.getCenter(barycenter)
}

const FLOOR_REGIONS = {
    'dm-floor-0': new THREE.Box3(new THREE.Vector3(-5.8, 0.1, -6.1), new THREE.Vector3(4.9, 0.7, 0.5)),
    'dm-floor-1': new THREE.Box3(new THREE.Vector3(-5.8, 1.8, -6.1), new THREE.Vector3(4.9, 2.5, 0.5)),
    'dm-floor-2': new THREE.Box3(new THREE.Vector3(-5.8, 2.8, -6.1), new THREE.Vector3(4.9, 3.5, 0.5)),
    'exdma-floor-0': new THREE.Box3(new THREE.Vector3(-4, 0.1, 3.2), new THREE.Vector3(-0.3, 0.7, 5.1)),
    'exdma-floor-1': new THREE.Box3(new THREE.Vector3(-4, 1.7, 3.2), new THREE.Vector3(-0.3, 2.4, 5.1)),
    'exdma-floor-2': new THREE.Box3(new THREE.Vector3(-4, 2.7, 3.2), new THREE.Vector3(-0.3, 3.5, 5.1)),
}

const TOP_VIEWS = {
    'dm-floor-0': new THREE.Vector3(2.0721172777525476, 5.332940558444413, -2.302808612956343),
    'dm-floor-1': new THREE.Vector3(-0.29483119907844724, 6.220079380019713, -2.67719523291053),
    'dm-floor-2': new THREE.Vector3(1.9609028135448132, 4.343713415731448, -0.3524974840393172),
    'exdma-floor-0': new THREE.Vector3(-2.2677862598842, 2.1177192458441767, 4.042522927889324),
    'exdma-floor-1': new THREE.Vector3(-2.267296934281399, 3.3612018859940442, 4.096040314849455),
    'exdma-floor-2': new THREE.Vector3(-2.402581472378879, 4.343867525159883, 4.174345258037002),
}

/**
 * @fires room-click
 * @fires room-unselect
 */
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

        // debug view regions
        // scene.add(
        //     ...Object.values(FLOOR_REGIONS)
        //         .filter(region => region !== null)
        //         .map(region => new THREE.Box3Helper(region, 'orangered'))
        // )
    }

    animateCameraToViewpoint(_viewpointName) {
        this.canvas3d.animateCamera(new THREE.Vector3(-0.3, 5.5, -7), new THREE.Vector3(0, 0, 0), 500)
    }

    animateCameraToViewpoint2(viewpointName) {
        const floorPos = TOP_VIEWS[viewpointName].clone()
        floorPos.y = 0
        floorPos.z += 0.0001

        this.canvas3d.animateCamera(TOP_VIEWS[viewpointName], floorPos, 500)
    }

    showOnlyRegion(name) {
        Object.keys(FLOOR_REGIONS).forEach(r => this.toggleRegion(r, false))
        this.toggleRegion(name, true)
    }

    toggleRegion(name, visible) {
        const region = FLOOR_REGIONS[name]

        if (name.endsWith('0')) {
            recursivelyTraverseInside(this.#model, region, object3d => {
                object3d.visible = visible
            })
        } else {
            recursivelyTraverseIntersecting(this.#model, region, object3d => {
                if (object3d.isMesh || object3d.isLineSegments) {
                    object3d.visible = visible
                }
            })
        }

        this.#roomsGroup.children.forEach(roomObj => {
            if (region.containsBox(new THREE.Box3().setFromObject(roomObj))) {
                if (visible) {
                    roomObj.layers.set(0)
                } else {
                    roomObj.layers.disableAll()

                    this.dispatchEvent({
                        type: 'room-unselect',
                        id: roomObj.room._id,
                    })
                }
            }
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
