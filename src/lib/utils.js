import Fuse from 'fuse.js'
import { useEffect, useState } from 'preact/hooks'

/**
 * Helper to throttle a function. The `fn` function will be called at most once
 * every `delay` milliseconds.
 */
export const throttle = (fn, delay) => {
    let lastCall = 0
    return function (...args) {
        const now = new Date().getTime()
        if (now - lastCall < delay) {
            return
        }
        lastCall = now
        return fn(...args)
    }
}

/**
 * Helper to get a mouse click that is triggered only if not the start of a drag
 * event.
 *
 * @param {HTMLElement} el
 * @param {(e: PointerEvent) => void} onStillClick
 */
export const onMouseDownWhileStill = (el, onStillClick) => {
    let isMouseStill

    el.addEventListener('pointerdown', () => (isMouseStill = true))
    el.addEventListener('pointermove', () => (isMouseStill = false))
    el.addEventListener('pointerup', e => isMouseStill && onStillClick(e))
}

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

export const clsx = (...args) => args.filter(Boolean).join(' ')

export const clamp = (min, value, max) => Math.min(max, Math.min(value, max))
