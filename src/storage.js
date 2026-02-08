
import localforage from 'localforage'

export class StorageManager {
    constructor() {
        this.store = localforage.createInstance({
            name: "brepub_books"
        })
        this.metaStore = localforage.createInstance({
            name: "brepub_meta"
        })
        this.explanationStore = localforage.createInstance({
            name: "brepub_explanations"
        })
    }

    async saveExplanation(bookId, text, explanation) {
        const id = 'exp_' + Date.now()
        const entry = {
            id,
            bookId,
            text,
            explanation,
            timestamp: Date.now()
        }
        await this.explanationStore.setItem(id, entry)
        return entry
    }

    async getHistory(bookId) {
        const entries = []
        await this.explanationStore.iterate((value) => {
            if (value.bookId === bookId) {
                entries.push(value)
            }
        })
        return entries.sort((a, b) => b.timestamp - a.timestamp)
    }

    async deleteExplanation(id) {
        await this.explanationStore.removeItem(id)
    }

    async saveBook(file, fileName) {
        const bookId = 'book_' + Date.now()
        const metadata = {
            id: bookId,
            name: fileName,
            added: Date.now()
        }

        // Store content
        await this.store.setItem(bookId, file)

        // Store metadata (mapping ID to info)
        await this.store.setItem(bookId + '_meta', metadata)

        return bookId
    }

    async getBook(bookId) {
        const file = await this.store.getItem(bookId)
        const metadata = await this.store.getItem(bookId + '_meta')

        if (!file || !metadata) return null

        return {
            file,
            metadata
        }
    }

    async setLastOpened(bookId) {
        await this.metaStore.setItem('last_opened', bookId)
    }

    async getLastOpened() {
        return await this.metaStore.getItem('last_opened')
    }

    async getAllBooks() {
        const books = []
        await this.store.iterate((value, key) => {
            if (key.endsWith('_meta')) {
                books.push(value)
            }
        })
        return books.sort((a, b) => b.added - a.added)
    }

    async deleteBook(bookId) {
        await this.store.removeItem(bookId)
        await this.store.removeItem(bookId + '_meta')

        // If this was the last opened book, clear that record
        const lastOpened = await this.getLastOpened()
        if (lastOpened === bookId) {
            await this.metaStore.removeItem('last_opened')
        }
    }
}
