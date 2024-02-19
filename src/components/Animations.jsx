import { clsx } from '../lib/utils.js'

/**
 * @param {{ direction: 'horizontal' | 'vertical' }} props
 */
export const GridAnimation = ({ direction, open, children, ...rest } = {}) => {
    return (
        <div class={clsx('grid-animation', direction, open && 'open', rest?.class)}>
            <div class="animation-container">{children}</div>
        </div>
    )
}
