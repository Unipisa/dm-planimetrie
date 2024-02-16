import { clsx } from '../lib/utils.js'

const SIDEBAR_LABELS = {
    buildings: {
        ['A']: 'Edificio A',
        ['B']: 'Edificio B',
        ['X']: 'Ex-Albergo',
    },
    floors: {
        ['0']: 'Piano terra',
        ['1']: 'Primo piano',
        ['2']: 'Secondo Piano',
    },
}

export const Sidebar = ({ rooms, ...rest }) => {
    return (
        <div class={clsx('sidebar', rest?.class)}>
            {rooms.map(room => (
                <div key={room._id}>
                    <h2>Stanza "{room.number}"</h2>
                    <h3>
                        {SIDEBAR_LABELS.buildings[room.building] ?? 'Ignoto'},{' '}
                        {SIDEBAR_LABELS.floors[room.floor] ?? 'Ignoto'}
                    </h3>
                    {room.notes && (
                        <p>
                            <strong>Note:</strong> {room.notes}
                        </p>
                    )}
                    {room.roomAssignments.length > 0 && (
                        <>
                            <h3>Assegnazioni</h3>
                            <ul>
                                {room.roomAssignments.map(assignment => (
                                    <li>
                                        {assignment.person.firstName} {assignment.person.lastName}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            ))}
        </div>
    )
}
