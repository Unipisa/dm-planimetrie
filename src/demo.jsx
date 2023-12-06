import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

import './styles.scss'

import { PlanimetriaViewer } from './dm-planimetria/planimetria.js'

const RoomEditor = ({ planimetriaRef, room, setRoom, close }) => {
    const [editingRoom, setEditingRoom] = useState(room)

    useEffect(() => {
        const handler = ({ polygon }) => {
            setEditingRoom(editingRoom => ({
                ...editingRoom,
                polygon: polygon.map(v => [v.x, v.y, v.z]),
            }))
        }

        planimetriaRef.current.addEventListener('polygon-closed', handler)

        // cleanup
        return () => {
            planimetriaRef.current.removeEventListener('polygon-closed', handler)
        }
    }, [])

    const handleOk = () => {
        setRoom(editingRoom)
        close()
    }

    return (
        <div class="room editing">
            <div class="label">
                <input
                    type="text"
                    placeholder={room.code}
                    value={editingRoom.name}
                    onInput={e => {
                        setEditingRoom(editingRoom => ({
                            ...editingRoom,
                            name: e.target.value,
                        }))
                    }}
                />
            </div>
            <div class="buttons">
                <button onClick={close}>Annulla</button>
                <button onClick={handleOk} class="primary">
                    Ok
                </button>
            </div>
            <div class="coordinates">
                <code>{JSON.stringify(editingRoom.polygon)}</code>
            </div>
        </div>
    )
}

const Room = ({ room: { name, code, polygon }, edit }) => {
    return (
        <div class="room">
            <div class="label">
                <div class="code">{code}</div>
                <div class="name">{name}</div>
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

const CanvasPlanimetria = ({ planimetriaRef }) => {
    return (
        <canvas
            ref={$canvas => {
                planimetriaRef.current = new PlanimetriaViewer($canvas)
            }}
        />
    )
}

const Sidebar = ({ planimetriaRef }) => {
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

    const [editingRoomIndex, setEditingRoomIndex] = useState(null)

    return (
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
                        editingRoomIndex === i ? (
                            <RoomEditor
                                planimetriaRef={planimetriaRef}
                                room={room}
                                setRoom={room => {
                                    setRooms([...rooms.slice(0, i), room, ...rooms.slice(i + 1)])
                                }}
                                close={() => {
                                    setEditingRoomIndex(null)
                                    planimetriaRef.current.disableEditing()
                                }}
                            />
                        ) : (
                            <Room
                                room={room}
                                edit={() => {
                                    setEditingRoomIndex(i)
                                    planimetriaRef.current.enableEditing()
                                }}
                            />
                        )
                    )}
                </div>
            </section>
        </aside>
    )
}

const App = () => {
    const planimetriaRef = useRef(null)

    return (
        <main class="demo">
            <CanvasPlanimetria planimetriaRef={planimetriaRef} />
            <Sidebar planimetriaRef={planimetriaRef} />
        </main>
    )
}

render(<App />, document.body)
