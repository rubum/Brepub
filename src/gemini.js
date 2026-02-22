import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
    constructor() {
        this.genAI = null
        this.model = null
        this.chatSession = null
        this.modelName = 'gemini-3-flash-preview'
    }

    configure(apiKey) {
        if (!apiKey) {
            this.genAI = null
            this.model = null
            return
        }
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = this.genAI.getGenerativeModel({ model: this.modelName })
    }

    async startChat(contextText) {
        if (!this.model) {
            throw new Error('API Key not configured')
        }

        try {
            this.chatSession = this.model.startChat({
                history: [],
            })

            const initialPrompt = `You are a helpful AI assistant built into an eBook reader. 
            The user has selected the following text from a book:
            
            "${contextText}"
            
            Please provide a detailed and comprehensive explanation of this text, providing rich context, definitions, and analysis if necessary. 
            Be ready to answer follow-up questions about this specific text or the broader topic.`

            const result = await this.chatSession.sendMessage(initialPrompt)
            const response = await result.response
            return response.text()
        } catch (error) {
            console.error('Gemini API Error:', error)
            throw new Error(`Failed to start AI session: ${error.message}`)
        }
    }

    async sendMessage(message) {
        if (!this.chatSession) {
            throw new Error('Chat session not started')
        }

        try {
            const result = await this.chatSession.sendMessage(message)
            const response = await result.response
            return response.text()
        } catch (error) {
            console.error('Gemini API Error:', error)
            throw new Error('Failed to send message.')
        }
    }
}
