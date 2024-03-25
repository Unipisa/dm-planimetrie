import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import i18n from '../i18n'

export const LangContext = createContext('it')

export const useLang = () => {
    return useContext(LangContext)
}   

export const useLocalization = name => {
    const lang = useContext(LangContext)
    return i18n[name][lang]
}

export const LocalizedString = ({ name }) => {
    const lang = useContext(LangContext)
    return <>{i18n[name][lang]}</>
}
