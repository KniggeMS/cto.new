
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// We use a factory function or singleton to ensure we can handle missing keys gracefully
class AIService {
    private client: GoogleGenAI | null = null;
    private readonly MODEL_NAME = "gemini-2.0-flash";
    private readonly IMAGE_MODEL_NAME = "gemini-2.0-flash";

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.client = new GoogleGenAI({ apiKey });
        } else {
            console.warn("GEMINI_API_KEY is not set. AI features will not work.");
        }
    }

    private getClient(): GoogleGenAI {
        if (!this.client) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("GEMINI_API_KEY is not configured on the server.");
            }
            this.client = new GoogleGenAI({ apiKey });
        }
        return this.client;
    }

    /**
     * Advanced Recommendation Engine (Hybrid Filtering)
     */
    async getRecommendations(items: any[]): Promise<any[]> {
        if (items.length === 0) return [];

        // 1. Data Preparation
        const relevantItems = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 4) || (i.userNotes && i.userNotes.length > 5));
        const sourceItems = relevantItems.length < 3 ? items.slice(0, 10) : relevantItems.slice(0, 20);

        const profileSummary = sourceItems.map(item => {
            let info = `- "${item.title}" (${item.year})`;
            if (item.userRating) info += ` [Rating: ${item.userRating}/5]`;
            if (item.isFavorite) info += ` [Favorite]`;
            if (item.userNotes) info += ` [User Note: "${item.userNotes}"]`;
            return info;
        }).join("\n");

        try {
            const prompt = `
        Act as a sophisticated movie recommendation engine using Hybrid Filtering.
        Analyze the following user profile:
        ${profileSummary}

        Task:
        1. Analyze 'User Notes' for specific tastes.
        2. Analyze high-rated items for genres/themes.
        3. Recommend 3 NEW movies or series.
        
        Return JSON format.
      `;

            const response = await this.getClient().models.generateContent({
                model: this.MODEL_NAME,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                year: { type: Type.NUMBER },
                                type: { type: Type.STRING, enum: ["MOVIE", "SERIES"] },
                                genre: { type: Type.ARRAY, items: { type: Type.STRING } },
                                plot: { type: Type.STRING, description: "Why this fits the profile (in German)" },
                                rating: { type: Type.NUMBER },
                            },
                            required: ["title", "year", "type", "genre", "plot", "rating"],
                        },
                    },
                },
            });

            if (response.text) {
                return JSON.parse(response.text);
            }
            return [];
        } catch (error) {
            console.error("Gemini Recommendation Error:", error);
            throw error;
        }
    }

    /**
     * Generates a profile picture for the user based on their username.
     */
    async generateAvatar(username: string): Promise<string | null> {
        try {
            const prompt = `A cool, artistic, high-quality circular avatar profile picture for a movie lover named "${username}". Pop art style or cinematic lighting. Minimalist background.`;

            const response = await this.getClient().models.generateContent({
                model: this.IMAGE_MODEL_NAME,
                contents: {
                    parts: [{ text: prompt }]
                }
            });

            // Loop through parts to find the image
            // Note: The SDK structure might vary slightly, adapting from the provided snippet
            // Assuming standard generateContent response structure for images if using a model that returns inline data or similar
            // For 'imagen' type models, it might be different, but sticking to the user's snippet logic:
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            const debugInfo = JSON.stringify(response, null, 2);
            console.warn("No image found in response:", debugInfo);
            throw new Error(`No image found. Response: ${debugInfo}`);
        } catch (error) {
            console.error("Gemini Avatar Generation Error:", error);
            throw error;
        }
    }

    /**
     * Vision Search: Identifies a movie/series from an image.
     */
    async identifyMovieFromImage(base64Image: string): Promise<string | null> {
        try {
            const prompt = "Identify the movie or TV series shown in this image. Return ONLY the exact title. If not sure, return nothing.";
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

            const response = await this.getClient().models.generateContent({
                model: this.MODEL_NAME,
                contents: [
                    {
                        parts: [
                            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                            { text: prompt }
                        ]
                    }
                ]
            });

            const text = response.text;
            return text?.trim() || null;
        } catch (error) {
            console.error("Vision Search Error:", error);
            return null;
        }
    }

    /**
     * ChatBot: Answer questions based on context.
     */
    async chat(message: string, contextItems: any[]): Promise<string> {
        try {
            const collectionContext = contextItems.slice(0, 50).map(i =>
                `${i.title} (${i.year}) - Status: ${i.status}, Rating: ${i.userRating || 'N/A'}`
            ).join('\n');

            const systemInstruction = `
            You are 'CineLog AI', a helpful movie assistant.
            User's Collection Context:
            ${collectionContext}

            Rules:
            1. Keep answers concise, friendly, and in German.
            2. Use the collection context to personalize answers.
        `;

            const response = await this.getClient().models.generateContent({
                model: this.MODEL_NAME,
                contents: message,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            return response.text || "Entschuldigung, ich konnte keine Antwort generieren.";
        } catch (error) {
            console.error("Chat Error:", error);
            return "Entschuldigung, ich habe gerade Verbindungsprobleme.";
        }
    }

    /**
     * Deep Content Analysis
     */
    async analyzeContext(title: string, plot: string, notes: string): Promise<string> {
        try {
            const prompt = `
            Analyze the movie/series "${title}".
            Plot: "${plot}"
            User's Private Notes: "${notes || 'None'}"
            
            Task:
            Provide a short, 2-sentence "Deep Insight" in German.
            Mention if the vibe matches the plot or if there are specific warnings based on notes.
        `;

            const response = await this.getClient().models.generateContent({
                model: this.MODEL_NAME,
                contents: prompt,
            });

            return response.text || "Keine Analyse verfügbar.";
        } catch (error) {
            return "Analyse fehlgeschlagen.";
        }
    }
}

export const aiService = new AIService();
