import { useId } from 'preact/hooks'
import { LuEye, LuHome, LuLayers, LuVideo } from 'react-icons/lu'
import { useToggle } from '../lib/hooks.js'
import { clsx } from '../lib/utils.js'
import { GridAnimation } from './Animations.jsx'
import { toChildArray } from 'preact'

const FLOOR_LABELS = ['Piano Terra', '1° Piano', '2° Piano']
const GROUP_LABELS = ['Edifici A e B', 'Edificio ex-Albergo']

const LayerFloor = ({ label, cameraToViewpoint, data: { viewpoint, visible, toggle } }) => {
    return (
        <div class="row">
            <div class="icon" role="button" onClick={() => cameraToViewpoint(viewpoint)}>
                <LuEye size={16} />
            </div>
            <div class="fix-text">{label}</div>
        </div>
    )
}

const LayerGroup = ({ label, data: { floors }, cameraToViewpoint }) => {
    return (
        <div class="layer">
            <div class="row">{label}</div>
            <div class="children">
                {floors.map((floor, i) => (
                    <LayerFloor cameraToViewpoint={cameraToViewpoint} label={FLOOR_LABELS[i]} data={floor} />
                ))}
            </div>
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

export const Buttons = ({ planimetriaRef, reset, layerToggles: { dip, exdma }, showOnlyRegion }) => {
    const onResetView = () => {
        if (planimetriaRef.current) {
            planimetriaRef.current.animateCameraToViewpoint('home')
            reset()
        }
    }

    const cameraToViewpoint = viewpoint => {
        planimetriaRef.current.animateCameraToViewpoint2(viewpoint)
        showOnlyRegion(viewpoint)
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
                    <LayerGroup label={GROUP_LABELS[0]} data={dip} cameraToViewpoint={cameraToViewpoint} />
                    <LayerGroup label={GROUP_LABELS[1]} data={exdma} cameraToViewpoint={cameraToViewpoint} />
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
