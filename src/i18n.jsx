import { LuHome, LuLayers } from 'react-icons/lu'
export default {
    'floors': {
        it: 'Piani',
        en: 'Floors',
    },
    'reset-view': {
        it: 'Reimposta Vista',
        en: 'Reset View',
    },
    'dip': {
        it: 'Dipartimento di Matematica',
        en: 'Department of Mathematics',
    },
    'ground-floor': {
        it: 'Piano Terra',
        en: 'Ground Floor',
    },
    'first-floor': {
        it: '1° Piano',
        en: '1st Floor',
    },
    'second-floor': {
        it: '2° Piano',
        en: '2nd Floor',
    },
    'building-a-b': {
        it: 'Edifici A e B',
        en: 'Buildings A and B',
    },
    'building-exdma': {
        it: 'Edificio ex-Albergo',
        en: 'Ex-Hotel Building',
    },
    'building-a': {
        it: 'Edificio A',
        en: 'Building A',
    },
    'building-b': {
        it: 'Edificio B',
        en: 'Building B',
    },
    'building-x': {
        it: 'Ex-Albergo',
        en: 'Ex-Hotel',
    },
    'unknown': {
        it: 'Ignoto',
        en: 'Unknown',
    },
    'code': {
        it: 'Codice',
        en: 'Code',
    },
    'notes': {
        it: 'Note',
        en: 'Notes',
    },
    'assignments': {
        it: 'Persone',
        en: 'People',
    },
    'room': {
        it: 'Stanza',
        en: 'Room',
    },
    'search-placeholder': {
        it: 'Cerca il codice di una stanza o un professore...',
        en: 'Search for a room code or professor...',
    },
    'no-result': {
        it: 'Nessun risultato...',
        en: 'No results...',
    },
    'help-title': {
        it: 'Come navigare la mappa',
        en: 'How to navigate the map',
    },
    'help-content': {
        it: (
            <ul>
                <li>Per spostare la mappa, trascina con il mouse o con un dito</li>
                <li>Per zoomare, usa la rotellina del mouse o i gesti di pinch-to-zoom</li>
                <li>Per ruotare, clicca e trascina con il tasto destro del mouse o con due dita</li>
                <li>
                    Per selezionare un piano, clicca sull'icona dell'occhio corrispondente dentro il pannello{' '}
                    <LuLayers />
                </li>
                <li>
                    Per tornare alla vista iniziale, clicca su <LuHome />
                </li>
            </ul>
        ),
        en: (
            <ul>
                <li>To move the map, drag with the mouse or a finger</li>
                <li>To zoom, use the mouse wheel or pinch-to-zoom gestures</li>
                <li>To rotate, click and drag with the right mouse button or two fingers</li>
                <li>
                    To select a floor, click on the corresponding eye icon inside the <LuLayers /> panel
                </li>
                <li>
                    To return to the initial view, click on <LuHome />
                </li>
            </ul>
        ),
    },
}
