import { clsx } from '../lib/utils.js'

/**
 * @param {{ direction: 'horizontal' | 'vertical' }} props
 */
export const GridAnimation = ({ direction, open, children, ...props } = {}) => {
    const { class: extraClasses, ...rest } = props

    return (
        <div class={clsx('grid-animation', direction, open && 'open', extraClasses)} {...rest}>
            <div class="animation-container">{children}</div>
        </div>
    )
}
