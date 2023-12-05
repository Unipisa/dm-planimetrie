import { render } from 'preact'

import { effect, signal } from '@preact/signals'

import './styles.scss'
import { PlanimetriaViewer } from './dm-planimetria/planimetrie.js'

const RoomEditor = ({ close }) => {
    const { name, polygon } = editingRoom.value

    const handleOk = () => {
        // POST request to dm-manager
        console.log('updating room polygon', { name, polygon })

        rooms.value = [
            ...rooms.value.slice(0, editingRoomIndex.value),
            {
                ...rooms.value[editingRoomIndex.value],
                name,
                polygon,
            },
            ...rooms.value.slice(editingRoomIndex.value + 1),
        ]

        close()
    }

    return (
        <div class="room editing">
            <div class="label">
                <input
                    type="text"
                    value={name}
                    onInput={e => {
                        editingRoom.value = {
                            ...editingRoom.value,
                            name: e.target.value,
                        }
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

const planimetria = signal(null)

effect(() => {
    if (planimetria.value !== null) {
        planimetria.value.addEventListener('polygon-closed', ({ positions }) => {
            console.log('polygon-closed', positions)

            if (editingRoomIndex.value !== null) {
                editingRoom.value = {
                    ...editingRoom.value,
                    polygon: positions.map(v => [v.x, v.y, v.z]),
                }
            }
        })
    }
})

const rooms = signal([
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

const editingRoomIndex = signal(null)
const editingRoom = signal(null)

const CanvasPlanimetria = ({}) => {
    return (
        <canvas
            ref={$canvas => {
                planimetria.value = new PlanimetriaViewer($canvas)
            }}
        />
    )
}

const Sidebar = ({}) => {
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
                    {rooms.value.map((room, i) =>
                        editingRoomIndex.value === i ? (
                            <RoomEditor
                                {...room}
                                close={() => {
                                    editingRoomIndex.value = null
                                    editingRoom.value = null
                                    planimetria.value.disableEditing()
                                }}
                            />
                        ) : (
                            <Room
                                {...room}
                                edit={() => {
                                    editingRoomIndex.value = i
                                    editingRoom.value = { ...room }
                                    planimetria.value.enableEditing()
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
    return (
        <main class="demo">
            <CanvasPlanimetria />
            <Sidebar />
        </main>
    )
}

render(<App />, document.body)
