import { LuSearch } from 'react-icons/lu'
import { clsx } from '../lib/utils.js'
import { useEventCallback, useFuse } from '../lib/hooks.js'
import { useContext } from 'preact/hooks'
import { LangContext, LocalizedString, useLocalization } from './LocalizedString.jsx'
import i18n from '../i18n.jsx'

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

    return parts.map(({ text, highlight }) => <span class={highlight ? 'highlight' : ''}>{text}</span>)
}

export const Search = ({ rooms, selectId, ...rest }) => {
    const [results, query, setQuery] = useFuse(rooms, {
        includeScore: true,
        includeMatches: true,
        keys: ['code', 'notes', 'roomAssignments.person.firstName', 'roomAssignments.person.lastName'],
    })

    const onRoomSelected = id => {
        setQuery('')
        selectId(id)
    }

    useEventCallback(document, 'keydown', e => {
        if (e.key === 'Escape') setQuery('')
    })

    const searchPlaceholder = useLocalization('search-placeholder')

    return (
        <div class={clsx('search', rest?.class)}>
            <div class="search-field">
                <input
                    placeholder={searchPlaceholder}
                    type="text"
                    value={query}
                    onInput={e => setQuery(e.target.value)}
                />
                <div class="icon">
                    <LuSearch />
                </div>
            </div>
            {query.trim().length > 0 &&
                (results.length > 0 ? (
                    <div class="search-results">
                        {results
                            .slice(0, 5)
                            .map(({ item: { _id: id, code, notes, roomAssignments }, matches }) => {
                                const codeIndices = matches.find(({ key }) => key === 'code')?.indices
                                const notesIndices = matches.find(({ key }) => key === 'notes')?.indices

                                return (
                                    <div class="result" onClick={() => onRoomSelected(id)}>
                                        <div class="code">
                                            <HighlightedText indices={codeIndices} value={code} />
                                        </div>
                                        {notes && (
                                            <div class="notes">
                                                <HighlightedText indices={notesIndices} value={notes} />
                                            </div>
                                        )}
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
                ) : (
                    <div class="search-results">
                        <div class="no-result">
                            <LocalizedString name="no-result" />
                        </div>
                    </div>
                ))}
        </div>
    )
}
