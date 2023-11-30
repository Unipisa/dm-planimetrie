import { useRef } from 'preact/hooks'

import { PlanimetriaViewer } from './planimetrie.js'

export const usePlanimetria = ({ onPolygonClosed }) => {
    const planimetriaRef = useRef(null)

    return [
        { startPolygon: planimetriaRef.current?.startPolygon },
        $canvas => {
            planimetriaRef.current = new PlanimetriaViewer($canvas)
            if (onPolygonClosed) planimetriaRef.current.addEventListener('polygon-closed', onPolygonClosed)
        },
    ]
}
