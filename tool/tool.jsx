import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

import './styles.scss'

import { PlanimetriaViewer } from '../src/dm-planimetria/planimetria.js'
import { createObjectMapper } from '../src/lib/mapper.js'

const useLocalState = (key, defaultValue) => {
    const [state, setState] = useState(() => {
        const value = localStorage.getItem(key)
        if (value === null) {
            return defaultValue
        }

        return JSON.parse(value)
    })

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state))
    }, [state])

    return [state, setState]
}

const useEndpointRef = key => {
    const endpointRef = useRef(null)

    // when the key changes, update the endpoint object mapper
    useEffect(() => {
        endpointRef.current = createObjectMapper(process.env.PLANIMETRIE_API_URL + '/', {
            headers: {
                ['Authorization']: `Bearer ${key}`,
            },
        })
    }, [key])

    return endpointRef
}

const Room = ({ room: { notes, code, polygon }, edit }) => {
    return (
        <div class="room">
            <div class="label">
                <div class="code">{code}</div>
                <div class="name">{notes}</div>
            </div>
            <div class="buttons">
                <button class="icon" onClick={edit}>
                    <div class="material-symbols-outlined">edit</div>
                </button>
            </div>
            {polygon && (
                <div class="coordinates">
                    <code>{JSON.stringify(polygon)}</code>
                </div>
            )}
        </div>
    )
}

const RoomEditor = ({ planimetriaRef, room, setRoom, close, endpointRef }) => {
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
        await endpointRef.current[editingRoom._id].post({
            notes: editingRoom.notes,
            polygon: JSON.stringify(editingRoom.polygon),
        })
        setRoom(editingRoom)
        close()
    }

    const handleDelete = async () => {
        setEditingRoom(editingRoom => ({
            ...editingRoom,
            polygon: null,
        }))
    }

    return (
        <div class="room editing">
            <div class="label">
                <input
                    type="text"
                    placeholder={room.code}
                    value={editingRoom.notes}
                    onInput={e => {
                        setEditingRoom(editingRoom => ({
                            ...editingRoom,
                            notes: e.target.value,
                        }))
                    }}
                />
            </div>
            <div class="buttons">
                <button class="icon" onClick={close}>
                    <div class="material-symbols-outlined">close</div>
                </button>
                <button onClick={() => handleOk()} class="icon primary">
                    <div class="material-symbols-outlined">check</div>
                </button>
                <button
                    onClick={() => handleDelete()}
                    class="icon danger"
                    title="Resetta il poligono per questa stanza a vuoto"
                >
                    <div class="material-symbols-outlined">delete</div>
                </button>
            </div>
            {editingRoom.polygon && (
                <div class="coordinates">
                    <code>{JSON.stringify(editingRoom.polygon)}</code>
                </div>
            )}
        </div>
    )
}

export const CanvasPlanimetria = ({ planimetriaRef }) => {
    return (
        <canvas
            ref={$canvas => {
                planimetriaRef.current = new PlanimetriaViewer($canvas)
            }}
        />
    )
}

const Sidebar = ({ planimetriaRef }) => {
    const [apiKey, setApiKey] = useLocalState('dm-planimetrie.apiKey', '')
    const [rooms, setRooms] = useState([])
    const [editingRoomIndex, setEditingRoomIndex] = useState(null)

    const endpointRef = useEndpointRef(apiKey)

    const loadRooms = async () => {
        if (apiKey.trim() === '') {
            alert('Devi una chiave API per dm-manager!')
            return
        }

        // call the API to get the rooms
        const { data: rooms } = await endpointRef.current.get()
        setRooms(
            rooms.map(room => ({
                ...room,
                polygon: room.polygon ? JSON.parse(room.polygon) : null,
            }))
        )
    }

    return (
        <aside>
            <section>
                <h1>DM Planimetrie</h1>
                <h2>Strumento per inserimento dati</h2>
                <p>Breve spiegazione di come funziona</p>
                <ol>
                    <li>Inserisci una chiave API</li>
                    <li>Clicca "modifica" una stanza</li>
                    <li>Disegna un poligono</li>
                    <li>Per accettarlo premi "Ok"</li>
                    <li>
                        Per comodità si può cambiare il nome della stanza, l'unica cosa importante
                        che identifica le varie stanze è il codice
                    </li>
                </ol>
            </section>
            <section>
                <h2>Chiave API</h2>
                <p>
                    Per poter modificare le stanze è necessario inserire una chiave API di{' '}
                    <a href="https://github.com/Unipisa/dm-manager">dm-manager</a>.
                </p>
                <div class="row">
                    <input
                        type="password"
                        autoComplete="off"
                        placeholder="API Key"
                        value={apiKey}
                        onInput={e => setApiKey(e.target.value)}
                    />
                    <button onClick={loadRooms}>Carica Stanze</button>
                </div>
            </section>
            <section>
                <h2>Rooms</h2>
                <div class="rooms">
                    {rooms.length === 0 && (
                        <div class="no-rooms">
                            <p>Nessuna stanza da mostrare</p>
                        </div>
                    )}
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
                                endpointRef={endpointRef}
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
