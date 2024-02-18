import { useId } from 'preact/hooks'
import { LuLayers } from 'react-icons/lu'

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

export const Buttons = ({ layerToggles: { dip, exdma } }) => {
    return (
        <div class="layer-switcher">
            <div class="title">
                <LuLayers />
                Livelli
            </div>
            <LayerGroup label={GROUP_LABELS[0]} data={dip} />
            <LayerGroup label={GROUP_LABELS[1]} data={exdma} />
        </div>
    )
}
