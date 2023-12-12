import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

import './styles.scss'

import { PlanimetriaViewer } from './dm-planimetria/planimetria.js'
import { createObjectMapper } from './lib/mapper.js'

const endpointPlanimetrie = createObjectMapper(process.env.PLANIMETRIE_API_URL + '/', {
    async fetch(_url, _options) {
        return {
            json: async () => {
                return {
                    data: [
                        {
                            code: 'A1',
                            name: 'Aula 1',
                            polygon: [
                                { x: 0, y: 0, z: 0 },
                                { x: 200, y: 0, z: 0 },
                                { x: 100, y: 100, z: 0 },
                                { x: 0, y: 100, z: 0 },
                            ],
                        },
                        {
                            code: 'A2',
                            name: 'Aula 2',
                            polygon: [
                                { x: 0, y: 0, z: 0 },
                                { x: 200, y: 0, z: 0 },
                                { x: 100, y: 100, z: 0 },
                                { x: 0, y: 100, z: 0 },
                            ],
                        },
                    ],
                }
            },
        }
    },
})

const RoomEditor = ({ planimetriaRef, room, setRoom, close }) => {
    const [editingRoom, setEditingRoom] = useState(room)

    useEffect(() => {
        const handler = ({ polygon }) => {
            setEditingRoom(editingRoom => ({
                ...editingRoom,
                polygon,
            }))
        }

        planimetriaRef.current.addEventListener('polygon-closed', handler)

        // cleanup
        return () => {
            planimetriaRef.current.removeEventListener('polygon-closed', handler)
        }
    }, [])

    const handleOk = async () => {
        // call the API to save the room
        await endpointPlanimetrie[editingRoom.code].post(editingRoom)
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
    const [rooms, setRooms] = useState([])

    useEffect(async () => {
        // call the API to get the rooms
        const { data: rooms } = await endpointPlanimetrie.get()
        setRooms(rooms)
    }, [])

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
                                    planimetriaRef.current.stopEditing()
                                }}
                            />
                        ) : (
                            <Room
                                room={room}
                                edit={() => {
                                    setEditingRoomIndex(i)
                                    planimetriaRef.current.startEditingWith(room.polygon)
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
