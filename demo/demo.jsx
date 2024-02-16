import { render } from 'preact'
import { Planimetrie } from '../src/element.jsx'

import '../src/element.scss'

const App = () => {
    return <Planimetrie />
}

render(<App />, document.body)
