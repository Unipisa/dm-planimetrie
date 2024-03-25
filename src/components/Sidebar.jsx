import { clsx } from '../lib/utils.js'
import { LocalizedString, useLang } from './LocalizedString.jsx'

export const Sidebar = ({ rooms, ...rest }) => {
    const lang = useLang()
    const SIDEBAR_LABELS = {
        buildings: {
            ['A']: 'building-a',
            ['B']: 'building-b',
            ['X']: 'building-x',
        },
        floors: {
            ['0']: 'ground-floor',
            ['1']: 'first-floor',
            ['2']: 'second-floor',
        },
    }
    return (
        <div class={clsx('sidebar', rest?.class)}>
            {rooms.map(room => (
                <div class="room">
                    <h2>
                        <LocalizedString name="room" /> "{room.number}"
                    </h2>
                    <h3>
                        <LocalizedString name={SIDEBAR_LABELS.buildings[room.building] ?? 'unknown'} />,{' '}
                        <LocalizedString name={SIDEBAR_LABELS.floors[room.floor] ?? 'unknown'} />
                    </h3>
                    {/* <p>
                        <strong>
                            <LocalizedString name="code" />:
                        </strong>{' '}
                        <code>{room.code}</code>
                    </p> */}
                    {room.notes && (
                        <p>
                            <strong>
                                <LocalizedString name="notes" />:
                            </strong>{' '}
                            {room.notes}
                        </p>
                    )}
                    {room.roomAssignments.length > 0 && (
                        <>
                            {/* <h3>
                                <LocalizedString name="assignments" />
                            </h3> */}
                            <ul>
                                {room.roomAssignments.map(assignment => (
                                    <li>
                                        <a
                                            target="_blank"
                                            href={`https://www.dm.unipi.it/${lang==='en'?'en/':''}scheda-personale/?person_id=${assignment.person._id}`}
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
