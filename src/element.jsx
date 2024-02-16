import { memo } from 'preact/compat'

import { LuHelpCircle, LuInfo, LuLayers, LuSearch } from 'react-icons/lu'

import { PlanimetrieViewer } from './dm-planimetria/PlanimetrieViewer.js'

import styles from './element.scss?inline'

import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { clsx, useFuse, useToggle } from './lib/utils.js'
import { createObjectMapper } from './lib/mapper.js'
import { render } from 'preact'
import { Search } from './components/Search.jsx'

// const HighlightedText = ({ indices, value }) => {
//     const parts = []
//     let lastIndex = 0

//     for (const [start, end] of indices) {
//         parts.push({ text: value.slice(lastIndex, start), highlight: false })
//         parts.push({ text: value.slice(start, end + 1), highlight: true })
//         lastIndex = end + 1
//     }

//     parts.push({ text: value.slice(lastIndex), highlight: false })

//     return parts.map(({ text, highlight }) => (
//         <span class={highlight ? 'highlight' : ''}>{text}</span>
//     ))
// }

const Canvas3D = memo(({ planimetrieRef }) => {
    return (
        <canvas
            ref={$canvas => {
                // FIX: A bit too much time-to-interactive
                // setTimeout(() => {
                planimetrieRef.current = new PlanimetrieViewer($canvas)
                window.planimetrie = planimetrieRef.current
                // }, 0)
            }}
        />
    )
})

export const Planimetrie = ({}) => {
    const manageApiPublic = createObjectMapper(process.env.MANAGE_API_URL + '/public/')
    const [rooms, setRooms] = useState([])
    const [selection, setSelection] = useState(new Set())

    /** @type {import('preact/hooks').MutableRef<PlanimetrieViewer>} */
    const planimetrieRef = useRef(null)

    useEffect(async () => {
        const { data: rooms } = await manageApiPublic.rooms.get()

        setRooms(
            rooms
                .flatMap(room =>
                    room.polygon ? [{ ...room, polygon: JSON.parse(room.polygon) }] : []
                )
                .filter(room => room.polygon)
        )
    }, [])

    useEffect(() => {
        if (planimetrieRef.current && rooms && rooms.length > 0) {
            planimetrieRef.current.setRooms(rooms)
        }
    }, [rooms, planimetrieRef.current])

    const onSelectionChanged = useCallback(({ ids }) => {
        setSelection(new Set(ids))
    }, [])

    useEffect(() => {
        if (planimetrieRef.current) {
            planimetrieRef.current.addEventListener('selection-changed', onSelectionChanged)
            return () => {
                planimetrieRef.current.removeEventListener('selection-changed', onSelectionChanged)
            }
        }
    }, [planimetrieRef.current, onSelectionChanged])

    useEffect(() => {
        if (planimetrieRef.current) {
            const listener = e => {
                if (e.key === 'Escape') {
                    planimetrieRef.current.clearSelection()
                }
            }
            document.addEventListener('keydown', listener)
            return () => {
                document.removeEventListener('keydown', listener)
            }
        }
    }, [planimetrieRef.current])

    const [dipVisible, toggleDipVisible] = useToggle(true)
    const [dipFloor1Visible, toggleDipFloor1Visible] = useToggle(true)
    const [dipFloor2Visible, toggleDipFloor2Visible] = useToggle(true)
    const [dipFloor3Visible, toggleDipFloor3Visible] = useToggle(true)

    const [exdmaVisible, toggleExdmaVisible] = useToggle(true)
    const [exdmaFloor1Visible, toggleExdmaFloor1Visible] = useToggle(true)
    const [exdmaFloor2Visible, toggleExdmaFloor2Visible] = useToggle(true)
    const [exdmaFloor3Visible, toggleExdmaFloor3Visible] = useToggle(true)

    const selectId = id => {
        planimetrieRef.current.toggleRoomSelection(id, true)
    }

    return (
        <>
            <style>{styles}</style>
            <div class="dm-planimetrie">
                <Canvas3D planimetrieRef={planimetrieRef} />
                <div class="overlay">
                    <Search
                        class={clsx(selection.size > 0 ? 'contracted' : 'expanded')}
                        rooms={rooms}
                        selectId={selectId}
                    />
                    <div className="sidebar-container">
                        <div class={clsx('sidebar', selection.size > 0 ? 'shown' : 'hidden','m-2')}>
                            {rooms.filter(({_id})=>selection.has(_id)).map(room => <div key={room._id}>
                                <h2>Stanza n. {room.number} {room.notes && `(${room.notes.split('\n')[0]})`}</h2>
                                Edificio: <b>{{A: 'A', B: 'B', X: 'ex-Albergo'}[room.building] || room.building || '---'}</b>
                                <br />
                                Piano: <b>{room.floor || '---'}</b>
                                <br />
                                {room.assignments?.map(assignment => <pre key={assignment._id}>{JSON.stringify(assignment)}</pre>)}
                            </div>)}
                        </div>
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
    }

    connectedCallback() {
        // initial selection is passed as query string as ?s=<id1>&s=<id2>&...
        const url = new URL(location.href)
        const initialSelection = url.searchParams.getAll('s')

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
