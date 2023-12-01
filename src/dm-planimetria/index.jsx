import { useRef, useEffect } from 'preact/hooks'

import { PlanimetriaViewer } from './planimetrie.js'

export const usePlanimetria = ({ onPolygonClosed }) => {
    const planimetriaRef = useRef(null)
    const canvasRef = useRef(null)

    const onPolygonClosedRef = useRef(onPolygonClosed)

    useEffect(() => {
        console.log('usePlanimetria', canvasRef.current)

        if (canvasRef.current !== null) {
            planimetriaRef.current = new PlanimetriaViewer(canvasRef.current)
        }
    }, [canvasRef.current])

    useEffect(() => {
        if (planimetriaRef.current) {
            planimetriaRef.current.removeEventListener('polygon-closed', onPolygonClosedRef.current)
            planimetriaRef.current.addEventListener('polygon-closed', onPolygonClosed)
            onPolygonClosedRef.current = onPolygonClosed
        }
    }, [planimetriaRef.current, onPolygonClosed])

    return [
        {
            startPolygon: planimetriaRef.current?.startPolygon,
        },
        canvasRef,
    ]
}
