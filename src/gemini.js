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
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
    }

    async startChat(contextText) {
        if (!this.model) {
            throw new Error('API Key not configured')
        }

        this.chatSession = this.model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{
                        text: `You are a helpful AI assistant built into an eBook reader. 
                    The user has selected the following text from a book:
                    
                    "${contextText}"
                    
                    Please provide a detailed and comprehensive explanation of this text, providing rich context, definitions, and analysis if necessary. 
                    Be ready to answer follow-up questions about this specific text or the broader topic.` }],
                },
            ],
        })

        try {
            // We need to send an empty message or just get the first response?
            // Actually, we can just send "Explain this" as the first message or rely on history.
            // But startChat with history doesn't auto-generate a response. We need to send a message.
            // Let's adjust: Set up history with system prompt (if model supports it) or just send the first query.
            // Gemini 1.5 Flash supports system instructions, but let's stick to the simple chat method for now.

            this.chatSession = this.model.startChat()

            const result = await this.chatSession.sendMessage(`Explain the following text in a detailed and comprehensive way, providing context, analysis, or definitions if necessary:\n\n"${contextText}"`)
            const response = await result.response
            return response.text()
        } catch (error) {
            console.error('Gemini API Error:', error)
            throw new Error('Failed to start chat. Please check your API Key.')
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
