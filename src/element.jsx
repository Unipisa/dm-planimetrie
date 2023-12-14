import { PlanimetriaViewer } from './dm-planimetria/planimetria.js'
import './element.scss'

import { useRef } from 'preact/hooks'

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
//         setHighlightedRoom: code => {
//             planimetriaRef.current.highlightRoom(code)
//         },
//     }
// }

// export const Planimetrie = ({ planimetria, onRoomClick }) => {

export const Planimetrie = ({}) => {
    const planimetriaRef = useRef(null)

    return (
        <div class="dm-planimetrie">
            <canvas
                ref={$canvas => {
                    planimetriaRef.current = new PlanimetriaViewer($canvas)
                }}
            />
            <div class="overlay">
                <div class="search"></div>
                <div class="sidebar"></div>
                <div class="layer-switcher">
                    <div class="layer">
                        <div class="row">
                            <input type="checkbox" id="building-dm" />
                            <label for="building-dm">Dip</label>
                        </div>
                        <div class="children">
                            <div class="row">
                                <input type="checkbox" id="dm-floor-1" checked disabled />
                                <label for="dm-floor-1">Piano 1</label>
                            </div>
                            <div class="row">
                                <input type="checkbox" id="dm-floor-2" checked disabled />
                                <label for="dm-floor-2">Piano 2</label>
                            </div>
                            <div class="row">
                                <input type="checkbox" id="dm-floor-3" checked disabled />
                                <label for="dm-floor-3">Piano 3</label>
                            </div>
                        </div>
                    </div>
                    <div class="layer">
                        <div class="row">
                            <input type="checkbox" id="building-exdma" checked={true} />
                            <label for="building-exdma">Ex-DMA</label>
                        </div>
                        <div class="children">
                            <div class="row">
                                <input type="checkbox" id="exdma-floor-1" checked={true} />
                                <label for="exdma-floor-1">Piano 1</label>
                            </div>
                            <div class="row">
                                <input type="checkbox" id="exdma-floor-2" checked={false} />
                                <label for="exdma-floor-2">Piano 2</label>
                            </div>
                            <div class="row">
                                <input type="checkbox" id="exdma-floor-3" checked={false} />
                                <label for="exdma-floor-3">Piano 3</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
