import { PlanimetriaViewer } from './planimetrie.js'

export const Planimetria = () => {
    return <canvas ref={$canvas => new PlanimetriaViewer($canvas)} />
}
