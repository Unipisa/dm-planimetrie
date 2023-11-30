import { render } from 'preact'

import './styles.scss'
import { usePlanimetria } from './dm-planimetria'
import { useState } from 'preact/hooks'

const RoomEditor = ({ name: externalName, polygon: externalPolygon, close, startPolygon }) => {
    const [name, setName] = useState(externalName)
    const [polygon, setPolygon] = useState(externalPolygon)

    const handleOk = () => {
        // POST request to dm-manager
        close()
    }

    return (
        <div class="room editing">
            <div class="label">
                <input type="text" value={name} onInput={e => setName(e.target.value)} />
            </div>
            <div class="buttons">
                <button onClick={startPolygon}>Retake Polygon</button>
                <div class="separator"></div>
                <button onClick={close}>Annulla</button>
                <button onClick={handleOk} class="primary">
                    Ok
                </button>
            </div>
            <div class="coordinates">
                <code>{JSON.stringify({ polygon })}</code>
            </div>
        </div>
    )
}

const Room = ({ name, code, polygon, edit }) => {
    return (
        <div class="room">
            <div class="label">
                {name} - {code}
            </div>
            <div class="buttons">
                <button onClick={edit}>Modifica</button>
            </div>
            <div class="coordinates">
                <code>{JSON.stringify(polygon)}</code>
            </div>
        </div>
    )
}

const App = () => {
    const [editingRoom, setEditingRoom] = useState(null)
    const [rooms, setRooms] = useState([
        {
            name: 'PHC',
            code: '106',
            polygon: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ],
        },
        {
            name: 'Aula 4',
            code: '104',
            polygon: [
                [1, 2, 3],
                [4, 5, 7],
                [7, 8, 9],
                [7, 8, 10],
            ],
        },
    ])

    const [planimetria, onCanvasRef] = usePlanimetria({
        onPolygonClosed(positions) {
            console.log(positions)

            if (editingRoom !== null) {
                setRooms([
                    ...rooms.slice(0, editingRoom),
                    { ...rooms[editingRoom], polygon: positions },
                    ...rooms.slice(editingRoom + 1),
                ])
            }
        },
    })

    console.log(editingRoom)

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
                        {rooms.map((room, i) =>
                            editingRoom === i ? (
                                <RoomEditor
                                    {...room}
                                    close={() => setEditingRoom(null)}
                                    startPolygon={() => {
                                        planimetria.startPolygon()
                                    }}
                                />
                            ) : (
                                <Room {...room} edit={() => setEditingRoom(i)} />
                            )
                        )}
                    </div>
                </section>
            </aside>
        </main>
    )
}

render(<App />, document.body)
