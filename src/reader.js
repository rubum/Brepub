
import ePub from 'epubjs'

export class EpubReader {
    constructor(settingsManager, uiManager) {
        this.settingsManager = settingsManager
        this.ui = uiManager
        this.book = null
        this.rendition = null

        // Subscribe to setting changes
        this.settingsManager.subscribe(() => this.applyStyles())

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.rendition) this.rendition.resize()
        })
    }

    async load(data) {
        this.ui.showLoading()

        if (this.book) {
            this.book.destroy()
        }

        try {
            this.book = ePub(data)

            this.rendition = this.book.renderTo('viewer', {
                manager: 'continuous',
                flow: 'scrolled',
                width: '100%',
                height: '100%'
            })

            this.rendition.on('selected', (cfiRange, contents) => {
                const range = contents.range(cfiRange)
                const text = range.toString().trim()

                if (text) {
                    const rect = range.getBoundingClientRect()
                    const iframe = contents.document.defaultView.frameElement
                    const iframeRect = iframe.getBoundingClientRect()
                    const x = rect.left + iframeRect.left + (rect.width / 2) - 75
                    const y = rect.top + iframeRect.top - 50
                    this.ui.showSelectionMenu(x, y, text)
                }
            })

            await this.rendition.display()

            // Register content hook once per rendition
            this.rendition.hooks.content.register((contents) => {
                this.injectStyle(contents.document)

                contents.document.body.addEventListener('mousedown', (e) => {
                    // Bridge the event to the parent window so ui.js can catch it
                    const bridgeEvent = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: e.clientX,
                        clientY: e.clientY
                    })
                    window.dispatchEvent(bridgeEvent)

                    const sel = contents.window.getSelection()
                    if (!sel || sel.isCollapsed) {
                        this.ui.hideSelectionMenu()
                    }
                })
            })

            // Setup navigation
            const navigation = await this.book.loaded.navigation
            this.ui.updateTOC(navigation, (href) => this.rendition.display(href))

            this.applyStyles()
            this.ui.hideLoading()

        } catch (error) {
            this.ui.showError('Failed to load EPUB file.')
        }
    }

    applyStyles() {
        if (!this.rendition) return
        const settings = this.settingsManager.get()

        this.currentStyles = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&display=swap');

            html, body {
                background: transparent !important;
            }

            body, p, div, span, li {
                font-family: ${settings.fontFamily} !important;
                font-size: ${settings.fontSize}px !important;
                line-height: ${settings.lineHeight} !important;
                color: #0f172a !important;
                padding: 0 !important;
                margin-top: 0.5em !important;
                margin-bottom: 0.5em !important;
            }

            body {
                padding: 40px 5% !important;
                max-width: 100% !important;
            }

            a { color: #4f46e5 !important; }
            img { max-width: 100% !important; height: auto !important; }
        `

        // Apply updated styles to existing documents
        if (this.rendition.manager) {
            this.rendition.views().forEach(view => {
                if (view.contents) {
                    this.injectStyle(view.contents.document)
                }
            })
        }
    }

    injectStyle(doc) {
        const head = doc.head
        const styleId = 'brepub-custom-styles'
        let style = head.querySelector(`#${styleId}`)

        if (!style) {
            style = doc.createElement('style')
            style.id = styleId
            head.appendChild(style)
        }
        style.textContent = this.currentStyles
    }

    async search(query) {
        if (!this.book || !query) return []

        const results = await Promise.all(
            this.book.spine.spineItems.map(item =>
                item.load(this.book.load.bind(this.book))
                    .then(doc => {
                        const results = item.find(query)
                        item.unload()
                        return results
                    })
            )
        )
        return results.flat()
    }
}
