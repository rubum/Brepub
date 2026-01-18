
import { GeminiService } from './gemini.js'
import { marked } from 'marked'

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

        // Selection Menu & Modal elements
        this.selectionMenu = document.getElementById('selection-menu')
        this.explanationModal = document.getElementById('explanation-modal')
        this.btnExplain = document.getElementById('btn-explain')
        this.btnCloseModal = document.getElementById('close-modal')
        this.chatMessages = document.getElementById('chat-messages')
        this.explanationSource = document.getElementById('explanation-source')
        this.chatInput = document.getElementById('chat-input')
        this.btnSend = document.getElementById('btn-send')

        this.currentSelectionText = ''

        // Controls
        this.fontSizeSlider = document.getElementById('font-size-slider')
        this.fontSizeVal = document.getElementById('font-size-val')
        this.lineHeightSlider = document.getElementById('line-height-slider')
        this.lineHeightVal = document.getElementById('line-height-val')
        this.readerWidthSlider = document.getElementById('reader-width-slider')
        this.readerWidthVal = document.getElementById('reader-width-val')
        this.fontBtns = document.querySelectorAll('.font-btn')

        this.geminiService = new GeminiService()
        // Initialize with saved key if available
        const settings = this.settingsManager.get()
        if (settings.apiKey) {
            this.geminiService.configure(settings.apiKey)
        }

        this.setupListeners()
        this.setupSelectionListeners()
        this.setupChatListeners()
        this.updateUI(settings)
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

        this.settingsPanel.addEventListener('click', (e) => e.stopPropagation())
        this.sidebar.addEventListener('click', (e) => e.stopPropagation())

        // API Key Listener
        const apiKeyInput = document.getElementById('api-key-input')
        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                const key = e.target.value.trim()
                this.settingsManager.set('apiKey', key)
                this.geminiService.configure(key)
            })
        }

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

        const apiKeyInput = document.getElementById('api-key-input')
        if (apiKeyInput) {
            apiKeyInput.value = settings.apiKey || ''
        }
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

    setupSelectionListeners() {
        // Modal close
        this.btnCloseModal.addEventListener('click', () => {
            this.explanationModal.classList.add('hidden')
        })

        // Close modal on outside click
        this.explanationModal.addEventListener('click', (e) => {
            if (e.target === this.explanationModal) {
                this.explanationModal.classList.add('hidden')
            }
        })

        // Explain button
        this.btnExplain.addEventListener('click', () => {
            const textToExplain = this.currentSelectionText
            this.hideSelectionMenu()
            this.showExplanationModal(textToExplain)
        })

        // Hide selection menu on scroll/resize (optional, handled mainly by reader interactions)
        window.addEventListener('scroll', () => this.hideSelectionMenu())
        window.addEventListener('resize', () => this.hideSelectionMenu())
    }

    showSelectionMenu(x, y, text) {
        this.currentSelectionText = text
        this.selectionMenu.style.left = `${x}px`
        this.selectionMenu.style.top = `${y}px`
        this.selectionMenu.classList.remove('hidden')
    }

    hideSelectionMenu() {
        this.selectionMenu.classList.add('hidden')
        this.currentSelectionText = ''
    }

    setupChatListeners() {
        const sendMessage = async () => {
            const message = this.chatInput.value.trim()
            if (!message) return

            // User Message
            this.appendMessage(message, 'user')
            this.chatInput.value = ''

            // AI Loading
            const loadingId = this.appendLoadingMessage()

            try {
                const response = await this.geminiService.sendMessage(message)
                this.removeMessage(loadingId)
                this.appendMessage(response, 'ai')
            } catch (error) {
                this.removeMessage(loadingId)
                this.appendMessage(`Error: ${error.message}`, 'ai')
            }
        }

        this.btnSend.addEventListener('click', sendMessage)
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage()
        })
    }

    appendMessage(text, sender) {
        const bubble = document.createElement('div')
        bubble.classList.add('message-bubble', `message-${sender}`)

        if (sender === 'ai') {
            bubble.innerHTML = marked.parse(text)
        } else {
            bubble.textContent = text
        }

        this.chatMessages.appendChild(bubble)
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight
        return bubble
    }

    appendLoadingMessage() {
        const id = 'loading-' + Date.now()
        const bubble = document.createElement('div')
        bubble.id = id
        bubble.classList.add('message-bubble', 'message-ai')
        bubble.innerHTML = '<div class="loader-inline"></div> Thinking...'
        this.chatMessages.appendChild(bubble)
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight
        return id
    }

    removeMessage(id) {
        const el = document.getElementById(id)
        if (el) el.remove()
    }

    async showExplanationModal(text) {
        this.explanationModal.classList.remove('hidden')

        // Show source text
        this.explanationSource.textContent = text
        this.explanationSource.classList.remove('hidden')

        // Clear previous chat
        this.chatMessages.innerHTML = ''

        // Initial Message interactions
        this.appendMessage("Explain this text", 'user')
        const loadingId = this.appendLoadingMessage()

        try {
            // Start new chat session
            const explanation = await this.geminiService.startChat(text)
            this.removeMessage(loadingId)
            this.appendMessage(explanation, 'ai')
        } catch (error) {
            this.removeMessage(loadingId)
            this.appendMessage(`Error: ${error.message}`, 'ai')
        }
    }
}
