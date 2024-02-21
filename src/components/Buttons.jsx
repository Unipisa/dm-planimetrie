import { useId } from 'preact/hooks'
import { LuHome, LuLayers } from 'react-icons/lu'
import { useToggle } from '../lib/hooks.js'
import { clsx } from '../lib/utils.js'
import { GridAnimation } from './Animations.jsx'
import { toChildArray } from 'preact'

const FLOOR_LABELS = ['Piano Terra', '1° Piano', '2° Piano']
const GROUP_LABELS = ['Edifici A e B', 'Edificio ex-Albergo']

const LayerGroup = ({ label, data: { group, toggleGroup, floors } }) => {
    const floorGroupId = useId()

    return (
        <div class="layer">
            <div class="row">
                <input type="checkbox" id={floorGroupId} checked={group} onInput={toggleGroup} />
                <label for={floorGroupId}>
                    <div class="fix-text">{label}</div>
                </label>
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
            <label for={floorId}>
                <div class="fix-text">{label}</div>
            </label>
        </div>
    )
}

const CollapsibleIconPanel = ({ children }) => {
    const [layersPopup, toggleLayersPopup] = useToggle(false)

    // extracts jsx nodes from the "children" prop
    const [iconJsx, labelJsx, contentJsx] = toChildArray(children)

    return (
        <div class={clsx('button-group', 'panel', layersPopup && 'expanded')}>
            <div class="icon" role="button" onClick={toggleLayersPopup}>
                {iconJsx}
            </div>
            <GridAnimation
                class="label-container"
                direction="horizontal"
                open={layersPopup}
                onClick={toggleLayersPopup}
            >
                {labelJsx}
            </GridAnimation>
            <GridAnimation class="content-container" direction="vertical" open={layersPopup}>
                {contentJsx}
            </GridAnimation>
        </div>
    )
}

const CollapsibleIconButton = ({ onClick, children }) => {
    // extracts jsx nodes from the "children" prop
    const [iconJsx, labelJsx] = toChildArray(children)

    return (
        <div class={clsx('button-group', 'simple')}>
            <div class="icon" role="button" onClick={onClick}>
                {iconJsx}
            </div>
            <GridAnimation class="label-container" direction="horizontal" onClick={onClick}>
                {labelJsx}
            </GridAnimation>
        </div>
    )
}

export const Buttons = ({ planimetriaRef, clearSelection, layerToggles: { dip, exdma } }) => {
    const onResetView = () => {
        if (planimetriaRef.current) {
            planimetriaRef.current.animateCameraToViewpoint('home')
            clearSelection()
        }
    }

    return (
        <div class="buttons">
            <CollapsibleIconPanel>
                <LuLayers />
                <div class="label">
                    <div class="fix-text">Livelli</div>
                </div>
                <div class="content">
                    <div class="title">Dipartimento di Matematica</div>
                    <LayerGroup label={GROUP_LABELS[0]} data={dip} />
                    <LayerGroup label={GROUP_LABELS[1]} data={exdma} />
                </div>
            </CollapsibleIconPanel>
            <CollapsibleIconButton onClick={onResetView}>
                <LuHome />
                <div class="label">
                    <div class="fix-text">Reimposta Vista</div>
                </div>
            </CollapsibleIconButton>
        </div>
    )
}
