
export class UIManager {
    constructor(settingsManager) {
        this.settingsManager = settingsManager

        // Elements
        this.viewer = document.getElementById('viewer')
        this.sidebar = document.getElementById('sidebar')
        this.settingsPanel = document.getElementById('settings-panel')
        this.loadingOverlay = document.getElementById('loading-overlay')
        this.emptyState = document.getElementById('empty-state')
        this.tocList = document.getElementById('toc')

        // Controls
        this.fontSizeSlider = document.getElementById('font-size-slider')
        this.fontSizeVal = document.getElementById('font-size-val')
        this.lineHeightSlider = document.getElementById('line-height-slider')
        this.lineHeightVal = document.getElementById('line-height-val')
        this.readerWidthSlider = document.getElementById('reader-width-slider')
        this.readerWidthVal = document.getElementById('reader-width-val')
        this.fontBtns = document.querySelectorAll('.font-btn')

        this.setupListeners()
        this.updateUI(this.settingsManager.get())
    }

    setupListeners() {
        // Toggles
        document.getElementById('toggle-sidebar').addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleSidebar()
        })

        document.getElementById('toggle-settings').addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleSettings()
        })

        document.getElementById('toggle-theme').addEventListener('click', () => {
            const current = this.settingsManager.get().theme
            this.settingsManager.set('theme', current === 'light' ? 'dark' : 'light')
        })

        const closeSidebarBtn = document.getElementById('close-sidebar')
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => this.sidebar.classList.remove('open'))

        const closeSettingsBtn = document.getElementById('close-settings')
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.settingsPanel.classList.add('hidden'))

        // Panel closing logic
        window.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && !document.getElementById('toggle-settings').contains(e.target)) {
                this.settingsPanel.classList.add('hidden')
            }
            if (!this.sidebar.contains(e.target) && !document.getElementById('toggle-sidebar').contains(e.target)) {
                this.sidebar.classList.remove('open')
            }
        })

        this.settingsPanel.addEventListener('click', (e) => e.stopPropagation())
        this.sidebar.addEventListener('click', (e) => e.stopPropagation())

        // Input Listeners
        this.fontSizeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value)
            this.settingsManager.set('fontSize', val)
            this.fontSizeVal.textContent = `${val}px`
        })

        this.lineHeightSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value)
            this.settingsManager.set('lineHeight', val)
            this.lineHeightVal.textContent = val
        })

        this.readerWidthSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value)
            this.settingsManager.set('readerWidth', val)
            this.readerWidthVal.textContent = `${val}%`
            this.viewer.style.maxWidth = `${val}%`
        })

        this.fontBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.settingsManager.set('fontFamily', btn.dataset.fontFamily)
                this.updateUI(this.settingsManager.get())
            })
        })
    }

    updateUI(settings) {
        document.documentElement.setAttribute('data-theme', settings.theme)

        this.fontSizeSlider.value = settings.fontSize
        this.fontSizeVal.textContent = `${settings.fontSize}px`

        this.lineHeightSlider.value = settings.lineHeight
        this.lineHeightVal.textContent = settings.lineHeight

        this.readerWidthSlider.value = settings.readerWidth
        this.readerWidthVal.textContent = `${settings.readerWidth}%`
        this.viewer.style.maxWidth = `${settings.readerWidth}%`

        this.fontBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.fontFamily === settings.fontFamily)
        })
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open')
        this.settingsPanel.classList.add('hidden')
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('hidden')
        this.sidebar.classList.remove('open')
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden')
        this.emptyState.style.display = 'none'
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden')
    }

    showError(msg) {
        this.hideLoading()
        this.emptyState.style.display = 'flex'
        console.error(msg)
        alert(msg)
    }

    updateTOC(navigation, onNavigate) {
        this.tocList.innerHTML = ''
        // Show Sidebar if hidden
        this.sidebar.classList.remove('hidden')

        navigation.toc.forEach(chapter => {
            const li = document.createElement('li')
            const a = document.createElement('a')
            a.textContent = chapter.label
            a.href = chapter.href
            a.addEventListener('click', (e) => {
                e.preventDefault()
                onNavigate(chapter.href)
                if (window.innerWidth < 1024) {
                    this.sidebar.classList.remove('open')
                }
            })
            li.appendChild(a)
            this.tocList.appendChild(li)
        })
    }
}
