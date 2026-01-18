
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

        const css = `
            body {
                font-family: ${settings.fontFamily} !important;
                font-size: ${settings.fontSize}px !important;
                line-height: ${settings.lineHeight} !important;
                color: #0f172a !important;
                background: transparent !important;
                padding: 40px 5% !important;
                transition: all 0.3s ease !important;
            }
            a { color: #6366f1 !important; }
            img { max-width: 100% !important; height: auto !important; }
        `

        this.rendition.hooks.content.register((contents) => {
            this.injectStyle(contents.document, css)

            // Add click listener to close panels when clicking content
            contents.document.body.addEventListener('click', () => {
                document.getElementById('settings-panel').classList.add('hidden')
                document.getElementById('sidebar').classList.remove('open')

                const sel = contents.window.getSelection()
                if (!sel || sel.isCollapsed) {
                    this.ui.hideSelectionMenu()
                }
            })
        })

        // Apply to existing views
        if (this.rendition.manager) {
            this.rendition.views().forEach(view => {
                if (view.contents) {
                    this.injectStyle(view.contents.document, css)
                }
            })
        }
    }

    injectStyle(doc, css) {
        const head = doc.head
        const styleId = 'brepub-custom-styles'
        let style = head.querySelector(`#${styleId}`)

        if (!style) {
            style = doc.createElement('style')
            style.id = styleId
            head.appendChild(style)
        }
        style.textContent = css
    }
}
