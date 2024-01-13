import { memo } from 'preact/compat'

import { BsLayers, BsSearch } from 'react-icons/bs'

import { PlanimetrieViewer } from './dm-planimetria/PlanimetrieViewer.js'
import './element.scss'

import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useToggle } from './lib/utils.js'
import { createObjectMapper } from './lib/mapper.js'

// export const usePlanimetrie = () => {
//     const planimetriaRef = useRef(null)

//     return {
//         mount: $canvas => {
//             planimetriaRef.current = new PlanimetriaViewer($canvas, {
//                 onRoomClick(code) {
//                     console.log('onRoomClick', code)
//                 },
//             })
//         },
//         setHighlightedRooms: (ids) => {
//             planimetriaRef.current.highlightRoom(code)
//         },
//     }
// }

// export const Planimetrie = ({ planimetria, onRoomClick }) => {

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
            console.log('setRooms', rooms)
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

    return (
        <div class="dm-planimetrie">
            <Canvas3D planimetrieRef={planimetrieRef} />
            <div class="overlay">
                <div class="search">
                    <input type="text" />
                    <div class="icon">
                        <BsSearch />
                    </div>
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
                        <BsLayers />
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
                                { value: dipFloor1Visible, toggle: toggleDipFloor1Visible },
                                { value: dipFloor2Visible, toggle: toggleDipFloor2Visible },
                                { value: dipFloor3Visible, toggle: toggleDipFloor3Visible },
                            ].map(({ value, toggle }, i) => (
                                <div class="row">
                                    <input
                                        type="checkbox"
                                        id={`dm-floor-${i + 1}`}
                                        checked={value}
                                        onInput={() => toggle()}
                                        disabled={!dipVisible}
                                    />
                                    <label for={`dm-floor-${i + 1}`}>Piano {i + 1}</label>
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
                                { value: exdmaFloor1Visible, toggle: toggleExdmaFloor1Visible },
                                { value: exdmaFloor2Visible, toggle: toggleExdmaFloor2Visible },
                                { value: exdmaFloor3Visible, toggle: toggleExdmaFloor3Visible },
                            ].map(({ value, toggle }, i) => (
                                <div class="row">
                                    <input
                                        type="checkbox"
                                        id={`exdma-floor-${i + 1}`}
                                        checked={value}
                                        onInput={() => toggle()}
                                        disabled={!exdmaVisible}
                                    />
                                    <label for={`exdma-floor-${i + 1}`}>Piano {i + 1}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
