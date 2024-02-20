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
                <div class="room">
                    <h2>
                        <a target="_blank" href={`${process.env.MANAGE_URL}/room/${room._id}`}>
                            Stanza "{room.number}"
                        </a>
                    </h2>
                    <h3>
                        {SIDEBAR_LABELS.buildings[room.building] ?? 'Ignoto'},{' '}
                        {SIDEBAR_LABELS.floors[room.floor] ?? 'Ignoto'}
                    </h3>
                    <p>
                        <strong>Codice:</strong> <code>{room.code}</code>
                    </p>
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
                                        <a
                                            target="_blank"
                                            href={`https://www.dm.unipi.it/scheda-personale/?person_id=${assignment.person._id}`}
                                        >
                                            {assignment.person.firstName} {assignment.person.lastName}
                                        </a>
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
