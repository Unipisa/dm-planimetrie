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
            </div>
        </div>
    )
}
