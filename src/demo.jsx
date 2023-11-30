import { render } from 'preact'

import './styles.scss'
import { usePlanimetria } from './dm-planimetria'
import { useState } from 'preact/hooks'

const examplePolygon = [
    { x: 0, y: 0 },
    { x: 0, y: Math.random() * 100 },
    { x: Math.random() * 100, y: Math.random() * 100 },
    { x: Math.random() * 100, y: 0 },
]

const App = () => {
    const [rooms, setRooms] = useState([])

    const [planimetria, onCanvasRef] = usePlanimetria({
        onPolygonClosed(positions) {
            console.log(positions)
        },
    })

    return (
        <main class="demo">
            <canvas ref={onCanvasRef} />
            <aside>
                <section>
                    <h1>DM Planimetrie</h1>
                    <h2>Data Insertion Tool</h2>
                    <p>This is a tool to insert data into the DM Planimetrie database.</p>
                    <p>Here is a short explanation of how it works:</p>
                    <ol>
                        <li>TODO: Spiegare meglio, per ora è generato con copilot questo help</li>
                        <li>Draw a polygon around the room</li>
                        <li>Click on "Save"</li>
                        <li>Copy the JSON code and paste it into the database</li>
                    </ol>
                </section>
                <section>
                    <h2>Rooms</h2>
                    <div class="rooms">
                        <div class="buttons">
                            <button onClick={planimetria.startPolygon}>Nuovo Poligono</button>
                            <button onClick={planimetria.startPolygon}>Salva JSON</button>
                        </div>
                        {/* Extract into a component */}
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        {/* Another state of the editing component */}
                        <div class="room editing">
                            <div class="label">
                                <input type="text" value="Aula 4" />
                            </div>
                            <div class="buttons">
                                <button>Retake Polygon</button>
                                <div class="separator"></div>
                                <button>Annulla</button>
                                <button class="primary">Ok</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                        <div class="room">
                            <div class="label">Aula 4</div>
                            <div class="buttons">
                                <button>Modifica</button>
                            </div>
                            <div class="code">
                                <code>{JSON.stringify(examplePolygon)}</code>
                            </div>
                        </div>
                    </div>
                </section>
            </aside>
        </main>
    )
}

render(<App />, document.body)
