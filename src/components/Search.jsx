import { LuSearch } from 'react-icons/lu'
import { clsx, useFuse } from '../lib/utils.js'

const HighlightedText = ({ indices, value }) => {
    if (!indices) {
        return value
    }

    const parts = []
    let lastIndex = 0

    for (const [start, end] of indices) {
        parts.push({ text: value.slice(lastIndex, start), highlight: false })
        parts.push({ text: value.slice(start, end + 1), highlight: true })
        lastIndex = end + 1
    }

    parts.push({ text: value.slice(lastIndex), highlight: false })

    return parts.map(({ text, highlight }) => (
        <span class={highlight ? 'highlight' : ''}>{text}</span>
    ))
}

export const Search = ({ rooms, selectId, ...rest }) => {
    const [results, query, setQuery] = useFuse(rooms, {
        includeScore: true,
        includeMatches: true,
        keys: [
            'code',
            'notes',
            'roomAssignments.person.firstName',
            'roomAssignments.person.lastName',
        ],
    })

    return (
        <div class={clsx('search', rest?.class)}>
            <div class="search-field">
                <input type="text" value={query} onInput={e => setQuery(e.target.value)} />
                <div class="icon">
                    <LuSearch />
                </div>
            </div>
            {query.trim().length > 0 && (
                <div class="search-results">
                    {results
                        .slice(0, 5)
                        .map(({ item: { _id: id, code, notes, roomAssignments }, matches }) => {
                            const codeIndices = matches.find(({ key }) => key === 'code')?.indices
                            const notesIndices = matches.find(({ key }) => key === 'notes')?.indices

                            return (
                                <div class="result" onClick={() => selectId(id)}>
                                    <div class="code">
                                        <HighlightedText indices={codeIndices} value={code} />
                                    </div>
                                    <div class="notes">
                                        <HighlightedText indices={notesIndices} value={notes} />
                                    </div>
                                    {roomAssignments.length > 0 && (
                                        <div class="assignments">
                                            {roomAssignments
                                                .map(
                                                    assignment =>
                                                        `${assignment.person.firstName} ${assignment.person.lastName}`
                                                )
                                                .join(', ')}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                </div>
            )}
        </div>
    )
}
