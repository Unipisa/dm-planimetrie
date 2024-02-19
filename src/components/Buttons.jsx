import { useId } from 'preact/hooks'
import { LuHome, LuLayers } from 'react-icons/lu'
import { useToggle } from '../lib/hooks.js'
import { clsx } from '../lib/utils.js'

const FLOOR_LABELS = ['Piano Terra', '1° Piano', '2° Piano']
const GROUP_LABELS = [
    'Dipartimento di Matematica, Edifici A e B',
    'Dipartimento di Matematica, Edificio ex-Albergo',
]

const LayerGroup = ({ label, data: { group, toggleGroup, floors } }) => {
    return (
        <div class="layer">
            <div class="row">
                <input type="checkbox" checked={group} onInput={toggleGroup} />
                <label>{label}</label>
            </div>
            <div class="children">
                {floors.map((floor, i) => (
                    <LayerFloor label={FLOOR_LABELS[i]} data={floor} enabled={group} />
                ))}
            </div>
        </div>
    )
}

const LayerFloor = ({ label, enabled, data: { visible, toggle } }) => {
    const floorId = useId()

    return (
        <div class="row">
            <input type="checkbox" id={floorId} checked={visible} onInput={toggle} disabled={!enabled} />
            <label for={floorId}>{label}</label>
        </div>
    )
}

// <div class="layer-switcher">
//     <div class="title">
//         <LuLayers />
//         Livelli
//     </div>
// </div>

export const Buttons = ({ layerToggles: { dip, exdma } }) => {
    const [layersPopup, toggleLayersPopup] = useToggle(false)

    return (
        <div class="buttons">
            <div class={clsx('button', layersPopup && 'expanded')}>
                <div class="icon" onClick={toggleLayersPopup}>
                    <LuLayers />
                </div>
                <div class="label">
                    <div>Livelli</div>
                </div>
                <div class="content">
                    <LayerGroup label={GROUP_LABELS[0]} data={dip} />
                    <LayerGroup label={GROUP_LABELS[1]} data={exdma} />
                </div>
            </div>
            <div class="button expanded">
                <div class="icon">
                    <LuHome />
                </div>
                <div class="label">
                    <div>Reimposta Vista</div>
                </div>
                <div class="content">
                    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odit, ex.</p>
                </div>
            </div>
        </div>
    )
}
