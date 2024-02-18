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

// const throttleMap = new WeakMap()

// Throttle function that can be used directly at call-site
// export const throttleCall =
//     (fn, delay, ref) =>
//     (...args) => {
//         ref ??= fn

//         const lastCallDate = throttleMap.get(ref)
//         if (!lastCallDate) {
//             throttleMap.set(ref, new Date())
//             fn(...args)
//         } else {
//             const now = new Date()
//             const delta = now.getTime() - lastCallDate.getTime()
//             if (delta > delay) {
//                 throttleMap.set(ref, now)
//                 fn(...args)
//             }
//         }
//     }

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

export const clsx = (...args) =>
    args
        .filter(Boolean)
        .flatMap(s => (typeof s === 'string' ? s.split(' ') : [s]))
        .join(' ')

export const clamp = (min, value, max) => Math.min(max, Math.max(value, min))

export const dedup = iterable => {
    const result = []
    const alreadyPresent = new Set()

    for (const item of iterable) {
        if (!alreadyPresent.has(item)) {
            result.push(item)
            alreadyPresent.add(item)
        }
    }

    return result
}

//
// Functional Set Operations
//

export const Sets = {
    with: (set, ...items) => {
        const result = new Set(set)
        for (const item of items) {
            result.add(item)
        }

        return result
    },
    without: (set, ...items) => {
        const result = new Set(set)
        for (const item of items) {
            result.delete(item)
        }

        return result
    },
    toggle: (set, item) => {
        const result = new Set(set)

        if (result.has(item)) {
            result.delete(item)
        } else {
            result.add(item)
        }

        return result
    },
}
