import { LuEye, LuHome, LuLayers, LuHelpCircle } from 'react-icons/lu'
import { useState } from 'preact/hooks'
import { clsx } from '../lib/utils.js'
import { GridAnimation } from './Animations.jsx'
import { toChildArray } from 'preact'
import { LocalizedString } from './LocalizedString.jsx'

const LayerFloor = ({ label, viewportName, cameraToViewpoint, data: { viewpoint } }) => {
    return (
        <div class="row">
            <div
                class={clsx('icon', viewportName == viewpoint && 'active')}
                role="button"
                onClick={() => cameraToViewpoint(viewpoint)}
            >
                <LuEye size={16} />
            </div>
            <div class="fix-text">
                <LocalizedString name={label} />
            </div>
        </div>
    )
}

const LayerGroup = ({ label, data: { floors }, viewportName, cameraToViewpoint }) => {
    const FLOOR_LABELS = ['ground-floor', 'first-floor', 'second-floor']
    return (
        <div class="layer">
            <div class="row">
                <LocalizedString name={label} />
            </div>
            <div class="children">
                {floors.map((floor, i) => (
                    <LayerFloor
                        viewportName={viewportName}
                        cameraToViewpoint={cameraToViewpoint}
                        label={FLOOR_LABELS[i]}
                        data={floor}
                    />
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
    const [layersPopup, setLayersPopup] = useState(null)
    const [viewportName, setViewportName] = useState(null)

    const onResetView = () => {
        if (planimetriaRef.current) {
            planimetriaRef.current.animateCameraToViewpoint('home')
            reset()
        }
    }

    const cameraToViewpoint = viewpoint => {
        planimetriaRef.current.animateCameraToViewpoint2(viewpoint)
        showOnlyRegion(viewpoint)
        setViewportName(oldValue => {
            if (oldValue === viewpoint) {
                onResetView()
                return null
            }
            return viewpoint
        })
    }

    const GROUP_LABELS = ['building-a-b', 'building-exdma']

    return (
        <div class="buttons">
            <CollapsibleIconPanel
                layersPopup={layersPopup === 'layers'}
                toggleLayersPopup={() => setLayersPopup(layersPopup === 'layers' ? null : 'layers')}
            >
                <LuLayers />
                <div class="label">
                    <div class="fix-text">
                        <LocalizedString name="floors" />
                    </div>
                </div>
                <div class="content">
                    <div class="title">
                        <LocalizedString name="dip" />
                    </div>
                    <LayerGroup
                        label={GROUP_LABELS[0]}
                        data={dip}
                        viewportName={viewportName}
                        cameraToViewpoint={cameraToViewpoint}
                    />
                    <LayerGroup
                        label={GROUP_LABELS[1]}
                        data={exdma}
                        viewportName={viewportName}
                        cameraToViewpoint={cameraToViewpoint}
                    />
                </div>
            </CollapsibleIconPanel>
            <CollapsibleIconButton onClick={onResetView}>
                <LuHome />
                <div class="label">
                    <div class="fix-text">
                        <LocalizedString name="reset-view" />
                    </div>
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
                    <div class="title">
                        <LocalizedString name="help-title" />
                    </div>
                    <LocalizedString name="help-content" />
                </div>
            </CollapsibleIconPanel>
        </div>
    )
}
