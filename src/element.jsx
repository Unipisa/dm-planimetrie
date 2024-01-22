import register from 'preact-custom-element'
import { memo } from 'preact/compat'

import { LuLayers, LuSearch } from 'react-icons/lu'

import { PlanimetrieViewer } from './dm-planimetria/PlanimetrieViewer.js'
import './element.scss'

import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useFuse, useToggle } from './lib/utils.js'
import { createObjectMapper } from './lib/mapper.js'
import { render } from 'preact'

const HighlightedText = ({ indices, value }) => {
    const parts = []
    let lastIndex = 0

    for (const [start, end] of indices) {
        parts.push({ text: value.slice(lastIndex, start), highlight: false })
        parts.push({ text: value.slice(start, end + 1), highlight: true })
        lastIndex = end + 1
    }

    parts.push({ text: value.slice(lastIndex), highlight: false })

    return parts.map(({ text, highlight }) => (
        <span class={highlight ? 'highlight' : ''}>{text}</span>
    ))
}

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

    const [dipVisible, toggleDipVisible] = useToggle(true)
    const [dipFloor1Visible, toggleDipFloor1Visible] = useToggle(true)
    const [dipFloor2Visible, toggleDipFloor2Visible] = useToggle(true)
    const [dipFloor3Visible, toggleDipFloor3Visible] = useToggle(true)

    const [exdmaVisible, toggleExdmaVisible] = useToggle(true)
    const [exdmaFloor1Visible, toggleExdmaFloor1Visible] = useToggle(true)
    const [exdmaFloor2Visible, toggleExdmaFloor2Visible] = useToggle(true)
    const [exdmaFloor3Visible, toggleExdmaFloor3Visible] = useToggle(true)

    const [results, query, setQuery] = useFuse(rooms, {
        includeScore: true,
        includeMatches: true,
        keys: ['code', 'notes'],
    })

    const selectId = id => {
        planimetrieRef.current.toggleRoomSelection(id, true)
    }

    return (
        <div class="dm-planimetrie">
            <Canvas3D planimetrieRef={planimetrieRef} />
            <div class="overlay">
                <div class="search">
                    <div class="search-field">
                        <input type="text" value={query} onInput={e => setQuery(e.target.value)} />
                        <div class="icon">
                            <LuSearch />
                        </div>
                    </div>
                    {query.trim().length > 0 && (
                        <div class="search-results">
                            {results.slice(0, 5).map(({ item: { _id, code, notes }, matches }) => {
                                const codeIndices = matches.find(
                                    ({ key }) => key === 'code'
                                )?.indices
                                const notesIndices = matches.find(
                                    ({ key }) => key === 'notes'
                                )?.indices
                                return (
                                    <div class="result" onClick={() => selectId(_id)}>
                                        <div class="code">
                                            {codeIndices ? (
                                                <HighlightedText
                                                    indices={codeIndices}
                                                    value={code}
                                                />
                                            ) : (
                                                code
                                            )}
                                        </div>
                                        <div class="notes">
                                            {notesIndices ? (
                                                <HighlightedText
                                                    indices={notesIndices}
                                                    value={notes}
                                                />
                                            ) : (
                                                notes
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                <div class="sidebar">
                    <pre>
                        <code>
                            {JSON.stringify(
                                rooms.filter(({ _id }) => selection.has(_id)),
                                null,
                                2
                            )}
                        </code>
                    </pre>
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
                            <label for="building-dm">Dip</label>
                        </div>
                        <div class="children">
                            {[
                                { text: 'Piano Terra', value: dipFloor1Visible, toggle: toggleDipFloor1Visible },
                                { text: '1° Piano', value: dipFloor2Visible, toggle: toggleDipFloor2Visible },
                                { text: '2° Piano', value: dipFloor3Visible, toggle: toggleDipFloor3Visible },
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
                            <label for="building-exdma">Ex-DMA</label>
                        </div>
                        <div class="children">
                            {[
                                { text: 'Piano Terra', value: exdmaFloor1Visible, toggle: toggleExdmaFloor1Visible },
                                { text: '1° Piano', value: exdmaFloor2Visible, toggle: toggleExdmaFloor2Visible },
                                { text: '2° Piano', value: exdmaFloor3Visible, toggle: toggleExdmaFloor3Visible },
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
            </div>
        </div>
    )
}

window.customElements.define('dm-planimetrie', PlanimetrieElement, { shadow: true })

class PlanimetrieElement extends HTMLElement {
    constructor() {
        this.attachShadow({ mode: 'open' })
    }

    connectedCallback() {
        render(<Planimetrie selectedRooms={[]} />, this.shadowRoot)
    }

    selectRooms(ids) {
        render(<Planimetrie selectedRooms={ids} />, this.shadowRoot)
    }
}

