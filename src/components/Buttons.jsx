import { LuLayers } from 'react-icons/lu'

export const Buttons = ({
    layerToggles: {
        dipVisible,
        toggleDipVisible,
        dipFloor1Visible,
        toggleDipFloor1Visible,
        dipFloor2Visible,
        toggleDipFloor2Visible,
        dipFloor3Visible,
        toggleDipFloor3Visible,
        exdmaVisible,
        toggleExdmaVisible,
        exdmaFloor1Visible,
        toggleExdmaFloor1Visible,
        exdmaFloor2Visible,
        toggleExdmaFloor2Visible,
        exdmaFloor3Visible,
        toggleExdmaFloor3Visible,
    },
}) => {
    return (
        <div class="layer-switcher">
            <div class="title">
                <LuLayers />
                Livelli
            </div>
            <div class="layer">
                <div class="row">
                    <input
                        type="checkbox"
                        id="building-dm"
                        checked={dipVisible}
                        onInput={() => toggleDipVisible()}
                    />
                    <label for="building-dm">Dipartimento di Matematica, Edifici A e B</label>
                </div>
                <div class="children">
                    {[
                        {
                            text: 'Piano Terra',
                            value: dipFloor1Visible,
                            toggle: toggleDipFloor1Visible,
                        },
                        {
                            text: '1° Piano',
                            value: dipFloor2Visible,
                            toggle: toggleDipFloor2Visible,
                        },
                        {
                            text: '2° Piano',
                            value: dipFloor3Visible,
                            toggle: toggleDipFloor3Visible,
                        },
                    ].map(({ text, value, toggle }, i) => (
                        <div class="row">
                            <input
                                type="checkbox"
                                id={`dm-floor-${i + 1}`}
                                checked={value}
                                onInput={() => toggle()}
                                disabled={!dipVisible}
                            />
                            <label for={`dm-floor-${i + 1}`}>{text}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div class="layer">
                <div class="row">
                    <input
                        type="checkbox"
                        id="building-exdma"
                        checked={exdmaVisible}
                        onInput={() => toggleExdmaVisible()}
                    />
                    <label for="building-exdma">
                        Dipartimento di Matematica, Edificio ex-Albergo
                    </label>
                </div>
                <div class="children">
                    {[
                        {
                            text: 'Piano Terra',
                            value: exdmaFloor1Visible,
                            toggle: toggleExdmaFloor1Visible,
                        },
                        {
                            text: '1° Piano',
                            value: exdmaFloor2Visible,
                            toggle: toggleExdmaFloor2Visible,
                        },
                        {
                            text: '2° Piano',
                            value: exdmaFloor3Visible,
                            toggle: toggleExdmaFloor3Visible,
                        },
                    ].map(({ text, value, toggle }, i) => (
                        <div class="row">
                            <input
                                type="checkbox"
                                id={`exdma-floor-${i + 1}`}
                                checked={value}
                                onInput={() => toggle()}
                                disabled={!exdmaVisible}
                            />
                            <label for={`exdma-floor-${i + 1}`}>{text}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
