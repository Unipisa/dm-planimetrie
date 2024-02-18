import { memo } from 'preact/compat'

import { LuHelpCircle, LuLayers } from 'react-icons/lu'

import { PlanimetrieViewer } from './dm-planimetrie/PlanimetrieViewer.js'

import styles from './element.scss?inline'

import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { clsx, dedup } from './lib/utils.js'
import { useEventCallback, useToggle } from './lib/hooks.js'
import { createApiProxy } from './lib/mapper.js'
import { render } from 'preact'
import { Search } from './components/Search.jsx'
import { Sidebar } from './components/Sidebar.jsx'

const Canvas3D = memo(({ planimetrieRef, onMount }) => {
    return (
        <canvas
            ref={$canvas => {
                planimetrieRef.current = new PlanimetrieViewer($canvas)
                window.planimetrie = planimetrieRef.current

                onMount?.(planimetrieRef.current)
            }}
        />
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

export const Planimetrie = ({ selectedRooms }) => {
    const [rooms, setRooms] = useState([])
    const [selection, setSelection] = useState(dedup(selectedRooms ?? []))

    /** @type {import('preact/hooks').MutableRef<PlanimetrieViewer>} */
    const planimetrieRef = useRef(null)

    const selectId = id => {
        // planimetrieRef.current.toggleRoomSelection(id, true)
        setSelection(sel => dedup([...sel, id]))
    }

    useEffect(() => {
        loadRooms().then(rooms => setRooms(rooms))
    }, [])

    useEffect(() => {
        // waits for "planimetriaRef.current" and "rooms" to be loaded
        if (planimetrieRef.current && rooms && rooms.length > 0) {
            planimetrieRef.current.setRooms(rooms)

            // TODO: Optimize this without repeatedly calling selectedId (add a
            // function in PlanimetrieViewer)
            for (const id of selection) {
                selectId(id)
            }
        }
    }, [rooms, planimetrieRef.current])

    useEventCallback(planimetrieRef.current, 'selection-changed', ({ ids }) => {
        setSelection(new Set(ids))
    })

    useEventCallback(document, 'keydown', e => {
        if (planimetrieRef.current) {
            if (e.key === 'Escape') planimetrieRef.current.clearSelection()
        }
    })

    const [dipVisible, toggleDipVisible] = useToggle(true)
    const [dipFloor1Visible, toggleDipFloor1Visible] = useToggle(true)
    const [dipFloor2Visible, toggleDipFloor2Visible] = useToggle(true)
    const [dipFloor3Visible, toggleDipFloor3Visible] = useToggle(true)

    const [exdmaVisible, toggleExdmaVisible] = useToggle(true)
    const [exdmaFloor1Visible, toggleExdmaFloor1Visible] = useToggle(true)
    const [exdmaFloor2Visible, toggleExdmaFloor2Visible] = useToggle(true)
    const [exdmaFloor3Visible, toggleExdmaFloor3Visible] = useToggle(true)

    return (
        <>
            <div class="dm-planimetrie">
                <Canvas3D planimetrieRef={planimetrieRef} />
                <div class="overlay">
                    <Search
                        class={clsx(selection.size > 0 ? 'contracted' : 'expanded')}
                        rooms={rooms}
                        selectId={selectId}
                    />
                    <div className="sidebar-container">
                        <Sidebar
                            class={clsx(selection.size > 0 ? 'shown' : 'hidden')}
                            rooms={rooms.filter(({ _id }) => selection.has(_id))}
                        />
                    </div>
                    <div class="layer-switcher">
                        <div class="title">
                            <LuLayers />
                            Livelli
                        </div>
                        <div class="layer">
                            <div class="row">
                                <input
                                    type="checkbox"
                                    id="building-dm"
                                    checked={dipVisible}
                                    onInput={() => toggleDipVisible()}
                                />
                                <label for="building-dm">
                                    Dipartimento di Matematica, Edifici A e B
                                </label>
                            </div>
                            <div class="children">
                                {[
                                    {
                                        text: 'Piano Terra',
                                        value: dipFloor1Visible,
                                        toggle: toggleDipFloor1Visible,
                                    },
                                    {
                                        text: '1° Piano',
                                        value: dipFloor2Visible,
                                        toggle: toggleDipFloor2Visible,
                                    },
                                    {
                                        text: '2° Piano',
                                        value: dipFloor3Visible,
                                        toggle: toggleDipFloor3Visible,
                                    },
                                ].map(({ text, value, toggle }, i) => (
                                    <div class="row">
                                        <input
                                            type="checkbox"
                                            id={`dm-floor-${i + 1}`}
                                            checked={value}
                                            onInput={() => toggle()}
                                            disabled={!dipVisible}
                                        />
                                        <label for={`dm-floor-${i + 1}`}>{text}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div class="layer">
                            <div class="row">
                                <input
                                    type="checkbox"
                                    id="building-exdma"
                                    checked={exdmaVisible}
                                    onInput={() => toggleExdmaVisible()}
                                />
                                <label for="building-exdma">
                                    Dipartimento di Matematica, Edificio ex-Albergo
                                </label>
                            </div>
                            <div class="children">
                                {[
                                    {
                                        text: 'Piano Terra',
                                        value: exdmaFloor1Visible,
                                        toggle: toggleExdmaFloor1Visible,
                                    },
                                    {
                                        text: '1° Piano',
                                        value: exdmaFloor2Visible,
                                        toggle: toggleExdmaFloor2Visible,
                                    },
                                    {
                                        text: '2° Piano',
                                        value: exdmaFloor3Visible,
                                        toggle: toggleExdmaFloor3Visible,
                                    },
                                ].map(({ text, value, toggle }, i) => (
                                    <div class="row">
                                        <input
                                            type="checkbox"
                                            id={`exdma-floor-${i + 1}`}
                                            checked={value}
                                            onInput={() => toggle()}
                                            disabled={!exdmaVisible}
                                        />
                                        <label for={`exdma-floor-${i + 1}`}>{text}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="help-message">
                        <LuHelpCircle />
                        <span>
                            Clicca e trascina per spostarti, trascina col tasto destro per orbitare
                            e usa la rotellina del mouse per zoomare.
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}

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
        const initialSelection = url.searchParams.getAll('sel')

        console.log('Initial Room Selection:', initialSelection)

        this.#render({ selectedIds: initialSelection })
    }

    #render({ selectedIds }) {
        render(<Planimetrie selectedRooms={selectedIds} />, this.shadowRoot)
    }

    /**
     * @param {string[]} selectedIds
     * @returns {void}
     */
    setSelection(selectedIds) {
        this.#render({ selectedIds })
    }
}

window.customElements.define('dm-planimetrie', PlanimetrieElement, { shadow: true })
