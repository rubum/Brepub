
export class SettingsManager {
    constructor() {
        this.defaults = {
            fontSize: 18,
            lineHeight: 1.6,
            readerWidth: 80,
            fontFamily: "'Source Serif 4', Georgia, serif",
            apiKey: ''
        }
        this.settings = this.load()
        this.listeners = []
    }

    load() {
        return JSON.parse(localStorage.getItem('reader-settings')) || { ...this.defaults }
    }

    save() {
        localStorage.setItem('reader-settings', JSON.stringify(this.settings))
        this.notify()
    }

    get() {
        return this.settings
    }

    set(key, value) {
        this.settings[key] = value
        this.save()
    }

    subscribe(callback) {
        this.listeners.push(callback)
    }

    notify() {
        this.listeners.forEach(cb => cb(this.settings))
    }
}
