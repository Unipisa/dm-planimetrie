import { LuEye, LuHome, LuLayers, LuHelpCircle } from 'react-icons/lu'
import { useState } from 'preact/hooks'
import { clsx } from '../lib/utils.js'
import { GridAnimation } from './Animations.jsx'
import { toChildArray } from 'preact'

const FLOOR_LABELS = ['Piano Terra', '1° Piano', '2° Piano']
const GROUP_LABELS = ['Edifici A e B', 'Edificio ex-Albergo']

const LayerFloor = ({ label, cameraToViewpoint, data: { viewpoint } }) => {
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

const CollapsibleIconPanel = ({ layersPopup, toggleLayersPopup, children }) => {
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
    // we only want to have one uncollapsed panel at a time
    // so we need to keep track of which panel is open
    // and close it when another one is opened
    const [layersPopup, setLayersPopup] = useState(null)

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
            <CollapsibleIconPanel
                layersPopup={layersPopup === 'layers'}
                toggleLayersPopup={() => setLayersPopup(layersPopup === 'layers' ? null : 'layers')}
            >
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
            <CollapsibleIconPanel
                layersPopup={layersPopup === 'help'}
                toggleLayersPopup={() => setLayersPopup(layersPopup === 'help' ? null : 'help')}
            >
                <LuHelpCircle />
                <div class="label">
                    <div class="fix-text">Help</div>
                </div>
                <div class="content">
                    <div class="title">Come navigare la mappa</div>
                    <ul>
                        <li>Per spostare la mappa, trascina con il mouse o con un dito.</li>
                        <li>Per zoomare, usa la rotellina del mouse o i gesti di pinch-to-zoom.</li>
                        <li>Per ruotare, clicca e trascina con il tasto destro del mouse o con due dita.</li>
                        <li>
                            Per selezionare un piano, clicca sull'icona dell'occhio corrispondente dentro il
                            pannello <LuLayers />.
                        </li>
                        <li>
                            Per tornare alla vista iniziale, clicca su <LuHome />.
                        </li>
                    </ul>
                </div>
            </CollapsibleIconPanel>
        </div>
    )
}
