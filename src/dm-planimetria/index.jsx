import { useRef, useCallback } from 'preact/hooks'

import { PlanimetriaViewer } from './planimetrie.js'

export const usePlanimetria = ({ onPolygonClosed }) => {
    const planimetriaRef = useRef(null)
    const onCanvasRef = useCallback(
        $canvas => {
            if ($canvas === null) return
            console.log('usePlanimetria', $canvas)
            planimetriaRef.current = new PlanimetriaViewer($canvas)
            if (onPolygonClosed)
                planimetriaRef.current.addEventListener('polygon-closed', onPolygonClosed)
        },
        [onPolygonClosed]
    )

    return [{ startPolygon: planimetriaRef.current?.startPolygon }, onCanvasRef]
}
