import { memo } from 'preact/compat'

import { PlanimetrieViewer } from './dm-planimetrie/PlanimetrieViewer.js'

import styles from './element.scss?inline'

import { useEffect, useRef, useState } from 'preact/hooks'
import { Sets, clsx } from './lib/utils.js'
import { useEventCallback, useToggle, useToggleRegion } from './lib/hooks.js'
import { createApiProxy } from './lib/mapper.js'
import { render } from 'preact'
import { Search } from './components/Search.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { Buttons } from './components/Buttons.jsx'

const Canvas3D = memo(({ planimetrieRef }) => {
    const canvasRef = useRef(null)
    const tooltipRef = useRef(null)

    const onMountBoth = () => {
        if (canvasRef.current && tooltipRef.current) {
            planimetrieRef.current = new PlanimetrieViewer(canvasRef.current, tooltipRef.current)
            // make this global for debugging purposes
            window.planimetrie = planimetrieRef.current
        }
    }

    return (
        <>
            <canvas
                ref={$canvas => {
                    canvasRef.current = $canvas
                    onMountBoth()
                }}
            />
            <div
                class="tooltip"
                ref={$tooltip => {
                    tooltipRef.current = $tooltip
                    onMountBoth()
                }}
            ></div>
        </>
    )
})

const manageApiPublic = createApiProxy(process.env.MANAGE_API_URL + '/public/')

const loadRooms = async () => {
    const { data: rooms } = await manageApiPublic.rooms.get()

    // Per ora il formato di "room.polygon" è una stringa json che
    // potenzialmente può essere "null" quindi prima filtriamo rispetto alle
    // stanze con un campo polygon e lo convertiamo in oggetto vero e poi
    // controlliamo che non fosse "null".
    return rooms
        .flatMap(room => (room.polygon ? [{ ...room, polygon: JSON.parse(room.polygon) }] : []))
        .filter(room => room.polygon)
}

export const Planimetrie = ({ selectedRoom }) => {
    const [rooms, setRooms] = useState([])
    const [selection, setSelection] = useState(selectedRoom ?? null)

    /** @type {import('preact/hooks').MutableRef<PlanimetrieViewer>} */
    const planimetrieRef = useRef(null)

    useEffect(() => {
        loadRooms().then(rooms => setRooms(rooms))
    }, [])

    useEffect(() => {
        // waits for "PlanimetrieViewer" and "rooms" to be loaded
        if (planimetrieRef.current && rooms && rooms.length > 0) {
            planimetrieRef.current.setRooms(rooms)
        }
    }, [rooms, planimetrieRef.current])

    useEventCallback(planimetrieRef.current, 'room-click', ({ id }) => {
        setSelection(selId => (selId === id ? null : id))
    })

    useEventCallback(planimetrieRef.current, 'room-unselect', () => {
        setSelection(null)
    })

    useEventCallback(document, 'keydown', e => {
        if (planimetrieRef.current) {
            if (e.key === 'Escape') setSelection(null)
        }
    })

    // binds hooks state to PlanimetrieViewer state when selection is updated
    useEffect(() => {
        if (planimetrieRef.current) {
            planimetrieRef.current.setSelection(selection === null ? [] : [selection])
        }
    }, [planimetrieRef.current, selection])

    // const [dipVisible, toggleDipVisible, setDipVisible] = useToggle(true)
    const [dipFloor0Visible, toggleDipFloor0Visible, setDipFloor0Visible] = useToggle(true)
    const [dipFloor1Visible, toggleDipFloor1Visible, setDipFloor1Visible] = useToggle(true)
    const [dipFloor2Visible, toggleDipFloor2Visible, setDipFloor2Visible] = useToggle(true)

    // const [exdmaVisible, toggleExdmaVisible, setExdmaVisible] = useToggle(true)
    const [exdmaFloor0Visible, toggleExdmaFloor0Visible, setExdmaFloor0Visible] = useToggle(true)
    const [exdmaFloor1Visible, toggleExdmaFloor1Visible, setExdmaFloor1Visible] = useToggle(true)
    const [exdmaFloor2Visible, toggleExdmaFloor2Visible, setExdmaFloor2Visible] = useToggle(true)

    const layerSetters = {
        'dm-floor-0': setDipFloor0Visible,
        'dm-floor-1': setDipFloor1Visible,
        'dm-floor-2': setDipFloor2Visible,
        'exdma-floor-0': setExdmaFloor0Visible,
        'exdma-floor-1': setExdmaFloor1Visible,
        'exdma-floor-2': setExdmaFloor2Visible,
    }

    useToggleRegion(planimetrieRef, 'dm-floor-0', dipFloor0Visible)
    useToggleRegion(planimetrieRef, 'dm-floor-1', dipFloor1Visible)
    useToggleRegion(planimetrieRef, 'dm-floor-2', dipFloor2Visible)

    useToggleRegion(planimetrieRef, 'exdma-floor-0', exdmaFloor0Visible)
    useToggleRegion(planimetrieRef, 'exdma-floor-1', exdmaFloor1Visible)
    useToggleRegion(planimetrieRef, 'exdma-floor-2', exdmaFloor2Visible)

    const selectId = id => {
        const room = rooms.find(({ _id }) => _id === id)

        if (room.building === 'A' || room.building === 'B') {
            // setDipVisible(true)
            layerSetters[`dm-floor-${room.floor}`](true)
        }
        if (room.building === 'X') {
            // setExdmaVisible(true)
            layerSetters[`exdma-floor-${room.floor}`](true)
        }

        setSelection(id)
    }

    return (
        <>
            <div class="dm-planimetrie">
                <Canvas3D planimetrieRef={planimetrieRef} />
                <div class="overlay">
                    <Search
                        class={clsx(selection !== null ? 'contracted' : 'expanded')}
                        rooms={rooms}
                        selectId={selectId}
                    />
                    <div className="sidebar-container">
                        <Sidebar
                            class={clsx(selection !== null ? 'shown' : 'hidden')}
                            rooms={rooms.filter(({ _id }) => selection === _id)}
                        />
                    </div>
                    <Buttons
                        showOnlyRegion={region => {
                            Object.values(layerSetters).forEach(setter => setter(false))
                            layerSetters[region](true)
                        }}
                        reset={() => {
                            setSelection(null)
                            Object.values(layerSetters).forEach(s => s(true))
                        }}
                        planimetriaRef={planimetrieRef}
                        layerToggles={{
                            dip: {
                                floors: [
                                    {
                                        viewpoint: 'dm-floor-0',
                                        visible: dipFloor0Visible,
                                        toggle: toggleDipFloor0Visible,
                                    },
                                    {
                                        viewpoint: 'dm-floor-1',
                                        visible: dipFloor1Visible,
                                        toggle: toggleDipFloor1Visible,
                                    },
                                    {
                                        viewpoint: 'dm-floor-2',
                                        visible: dipFloor2Visible,
                                        toggle: toggleDipFloor2Visible,
                                    },
                                ],
                            },

                            exdma: {
                                floors: [
                                    {
                                        viewpoint: 'exdma-floor-0',
                                        visible: exdmaFloor0Visible,
                                        toggle: toggleExdmaFloor0Visible,
                                    },
                                    {
                                        viewpoint: 'exdma-floor-1',
                                        visible: exdmaFloor1Visible,
                                        toggle: toggleExdmaFloor1Visible,
                                    },
                                    {
                                        viewpoint: 'exdma-floor-2',
                                        visible: exdmaFloor2Visible,
                                        toggle: toggleExdmaFloor2Visible,
                                    },
                                ],
                            },
                        }}
                    />
                </div>
            </div>
        </>
    )
}

//
// Web Component
//

export class PlanimetrieElement extends HTMLElement {
    constructor() {
        super()
        this.style.display = 'block'
        this.style.height = '720px'
        this.style.maxHeight = '100%'

        this.attachShadow({ mode: 'open' })

        const $styles = document.createElement('style')
        $styles.innerHTML = styles
        this.shadowRoot.appendChild($styles)
    }

    connectedCallback() {
        // WARNING: Pare che "?s=<...>" è già usato da WordPress e fa
        // automaticamente dei redirect quindi ho optato per "?sel=..." per
        // aggiungere automaticamente selezioni all'avvio

        // initial selection is passed as query string as ?sel=<id1>&sel=<id2>&...
        const url = new URL(location.href)
        const initialSelection = url.searchParams.get('sel')

        console.log('Initial Room Selection:', initialSelection)

        this.#render({ selectedId: initialSelection })
    }

    #render({ selectedId }) {
        render(<Planimetrie selectedRoom={selectedId} />, this.shadowRoot)
    }

    /**
     * @param {string[]} selectedId
     * @returns {void}
     */
    setSelection(selectedId) {
        this.#render({ selectedId })
    }
}

window.customElements.define('dm-planimetrie', PlanimetrieElement, { shadow: true })
