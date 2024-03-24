import { render } from 'preact'
import { Planimetrie } from '../src/element.jsx'

import '../src/element.scss'

const App = () => {
    let lang = 'it'

    const isEnglish = location.href.includes('/en')
    if (isEnglish) lang = 'en'
    return <Planimetrie lang={lang} />
}

render(<App />, document.body)
