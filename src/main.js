
import './style.css'
import { SettingsManager } from './settings.js'
import { UIManager } from './ui.js'
import { EpubReader } from './reader.js'

document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager()
    const uiManager = new UIManager(settingsManager)
    const reader = new EpubReader(settingsManager, uiManager)

    // Handle File Upload
    const epubUpload = document.getElementById('epub-upload')
    if (epubUpload) {
        epubUpload.addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (!file) return

            const fileReader = new FileReader()
            fileReader.onload = (event) => {
                reader.load(event.target.result)
            }
            fileReader.readAsArrayBuffer(file)
        })
    }
})
