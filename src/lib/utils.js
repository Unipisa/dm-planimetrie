import { useState } from 'preact/hooks'

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
