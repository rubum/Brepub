
import { GeminiService } from './gemini.js'
import { marked } from 'marked'

export class UIManager {
    constructor(settingsManager) {
        this.settingsManager = settingsManager

        // Elements
        this.viewer = document.getElementById('viewer')
        this.sidebar = document.getElementById('sidebar')
        this.historySidebar = document.getElementById('history-sidebar')
        this.settingsPanel = document.getElementById('settings-panel')
        this.searchPanel = document.getElementById('search-panel')
        this.loadingOverlay = document.getElementById('loading-overlay')
        this.emptyState = document.getElementById('empty-state')
        this.tocList = document.getElementById('toc')
        this.historyList = document.getElementById('history-list')

        // Search elements
        this.searchInput = document.getElementById('search-input')
        this.searchResults = document.getElementById('search-results')
        this.btnToggleSearch = document.getElementById('toggle-search')
        this.btnCloseSearch = document.getElementById('close-search')
        this.btnToggleHistory = document.getElementById('toggle-history')
        this.btnCloseHistory = document.getElementById('close-history')

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

        this.btnToggleSearch.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleSearch()
        })

        this.btnCloseSearch.addEventListener('click', () => this.searchPanel.classList.add('hidden'))



        const closeSidebarBtn = document.getElementById('close-sidebar')
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => this.sidebar.classList.remove('open'))

        const closeSettingsBtn = document.getElementById('close-settings')
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.settingsPanel.classList.add('hidden'))

        // Panel closing logic: Use mousedown + capturing phase for maximum reliability
        // This ensures the event is caught even if children prevent bubbling.
        window.addEventListener('mousedown', (e) => {
            const isClickInsidePanel = [
                this.settingsPanel,
                this.sidebar,
                this.searchPanel,
                this.historySidebar
            ].some(panel => panel && panel.contains(e.target))

            const isClickOnToggle = [
                document.getElementById('toggle-settings'),
                document.getElementById('toggle-sidebar'),
                this.btnToggleSearch,
                this.btnToggleHistory
            ].some(toggle => toggle && toggle.contains(e.target))

            if (!isClickInsidePanel && !isClickOnToggle) {
                this.closeAllPanels()
            }
        }, true) // Use capturing phase to get the event first

        this.btnToggleHistory.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleHistory()
        })

        this.btnCloseHistory.addEventListener('click', () => {
            this.historySidebar.classList.remove('open')
        })

        this.settingsPanel.addEventListener('click', (e) => e.stopPropagation())
        this.sidebar.addEventListener('click', (e) => e.stopPropagation())
        this.searchPanel.addEventListener('click', (e) => e.stopPropagation())

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

    updateTitle(filename) {
        document.title = `Brepub - ${filename}`
        const logo = document.querySelector('.logo')
        if (logo) {
            logo.innerHTML = `Brepub <span style="font-weight: normal; font-size: 0.8em; opacity: 0.8;">| ${filename}</span>`
        }
    }

    closeAllPanels() {
        this.settingsPanel.classList.add('hidden')
        this.sidebar.classList.remove('open')
        if (this.searchPanel) this.searchPanel.classList.add('hidden')
        if (this.historySidebar) this.historySidebar.classList.remove('open')
    }

    toggleSidebar() {
        const isOpen = this.sidebar.classList.contains('open')
        this.closeAllPanels()
        if (!isOpen) this.sidebar.classList.add('open')
    }

    toggleSettings() {
        const isHidden = this.settingsPanel.classList.contains('hidden')
        this.closeAllPanels()
        if (isHidden) this.settingsPanel.classList.remove('hidden')
    }

    toggleSearch() {
        const isHidden = this.searchPanel.classList.contains('hidden')
        this.closeAllPanels()
        if (isHidden) {
            this.searchPanel.classList.remove('hidden')
            this.searchInput.focus()
        }
    }

    toggleHistory() {
        const isOpen = this.historySidebar.classList.contains('open')
        this.closeAllPanels()
        if (!isOpen) this.historySidebar.classList.add('open')
    }

    renderHistory(entries) {
        this.historyList.innerHTML = ''
        if (!entries || entries.length === 0) {
            this.historyList.innerHTML = '<p class="history-empty">No explanations yet.</p>'
            return
        }

        entries.forEach(entry => {
            const item = document.createElement('div')
            item.className = 'history-item'

            const date = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const day = new Date(entry.timestamp).toLocaleDateString()

            item.innerHTML = `
                <div class="history-text">"${entry.text}"</div>
                <div class="history-meta">
                    <span>${day} ${date}</span>
                    <button class="btn-icon mini-delete" data-id="${entry.id}">✕</button>
                </div>
            `

            item.onclick = (e) => {
                if (e.target.closest('.mini-delete')) return
                this.showExplanationFromHistory(entry)
                this.historySidebar.classList.remove('open')
            }

            const deleteBtn = item.querySelector('.mini-delete')
            deleteBtn.onclick = async (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (this.onDeleteHistory) await this.onDeleteHistory(entry.id)
            }

            this.historyList.appendChild(item)
        })
    }

    showExplanationFromHistory(entry) {
        this.explanationModal.classList.remove('hidden')
        this.explanationSource.textContent = entry.text
        this.explanationSource.classList.remove('hidden')
        this.chatMessages.innerHTML = ''

        // Restore conversation (simplified for now: just the first explanation)
        this.appendMessage("Explain this text", 'user')
        this.appendMessage(entry.explanation, 'ai')
    }

    renderSearchResults(results, onSelect) {
        this.searchResults.innerHTML = ''
        if (results.length === 0) {
            this.searchResults.innerHTML = '<p class="search-empty">No results found.</p>'
            return
        }

        results.forEach(result => {
            const item = document.createElement('div')
            item.className = 'search-result-item'

            // Highlight the query in excerpt
            // result.excerpt might already have tags or we can wrap it
            // epubjs result object usually has 'excerpt' and 'cfi'
            item.innerHTML = `
                <div class="search-excerpt">${result.excerpt}</div>
                <div class="search-location">Location: ${result.cfi}</div>
            `

            item.onclick = () => {
                onSelect(result.cfi)
                this.searchPanel.classList.add('hidden')
            }
            this.searchResults.appendChild(item)
        })
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

        // Textarea auto-resize and Enter handling
        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto'
            this.chatInput.style.height = (this.chatInput.scrollHeight) + 'px'
        })

        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
                // Reset height
                this.chatInput.style.height = 'auto'
            }
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

    /* Library Management */

    showLibrary(books, onSelect, onDelete) {
        this.viewer.classList.add('hidden')
        this.sidebar.classList.add('hidden')
        this.settingsPanel.classList.add('hidden')
        document.getElementById('library-view').classList.remove('hidden')
        this.emptyState.style.display = 'none'

        this.updateTitle('Library')
        this.renderBookList(books, onSelect, onDelete)
    }

    hideLibrary() {
        document.getElementById('library-view').classList.add('hidden')
        this.viewer.classList.remove('hidden')
        // We don't necessarily show sidebar, depends on user pref/state, but viewer is essential
    }

    renderBookList(books, onSelect, onDelete) {
        const grid = document.getElementById('book-grid')
        grid.innerHTML = ''

        if (books.length === 0) {
            grid.innerHTML = '<p class="empty-msg">No books found. Upload one to get started!</p>'
            return
        }

        books.forEach(book => {
            const card = document.createElement('div')
            card.className = 'book-card'

            const title = document.createElement('div')
            title.className = 'book-title'
            title.textContent = book.name || 'Untitled Book'

            const meta = document.createElement('div')
            meta.className = 'book-meta'
            meta.textContent = new Date(book.added).toLocaleDateString()

            const actions = document.createElement('div')
            actions.className = 'book-actions'

            const deleteBtn = document.createElement('button')
            deleteBtn.className = 'btn-delete'
            deleteBtn.innerHTML = '✕'
            deleteBtn.title = 'Delete Book'
            deleteBtn.onclick = (e) => {
                e.stopPropagation()
                if (confirm(`Delete key "${book.name}"?`)) {
                    onDelete(book.id)
                }
            }

            actions.appendChild(deleteBtn)
            card.appendChild(actions)
            card.appendChild(title)
            card.appendChild(meta)

            card.onclick = () => onSelect(book.id)

            grid.appendChild(card)
        })
    }
}
