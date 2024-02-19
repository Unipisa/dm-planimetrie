import Fuse from 'fuse.js'
import { useEffect, useState } from 'preact/hooks'

export const useToggle = initialState => {
    const [value, setValue] = useState(initialState)
    return [value, () => setValue(v => !v)]
}

export const useFuse = (items, options) => {
    const [fuse] = useState(() => new Fuse(items, options))
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        if (fuse) {
            fuse.setCollection(items)
        }
    }, [items])

    useEffect(() => {
        setResults(fuse.search(query))
    }, [query])

    return [results, query, setQuery]
}

/**
 * Automatically registers and un-registers an event listener on the provided object
 *
 * @param {EventTarget} element
 * @param {string} type
 * @param {EventListener} listener
 * @param {any[]} deps
 */
export const useEventCallback = (element, type, listener, deps = []) => {
    useEffect(() => {
        if (element) {
            element.addEventListener(type, listener)

            return () => {
                element.removeEventListener(type, listener)
            }
        }
    }, [...deps, element])
}

export const useToggleRegion = (planimetrieRef, region, visible) => {
    useEffect(() => {
        if (planimetrieRef.current) {
            planimetrieRef.current.toggleRegion(region, visible)
        }
    }, [visible])
}