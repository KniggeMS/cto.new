"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMovieContext = exports.chatWithAI = exports.identifyMovieFromImage = exports.generateAvatar = exports.getRecommendations = void 0;
const genai_1 = require("@google/genai");
const types_1 = require("../types");
// Initialize Gemini Client
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";
/**
 * Advanced Recommendation Engine (Hybrid Filtering)
 * Uses Gemini as an ML engine to analyze user behavior, ratings, and private notes.
 */
const getRecommendations = (items) => __awaiter(void 0, void 0, void 0, function* () {
    if (items.length === 0)
        return [];
    // 1. Data Preparation (Feature Extraction)
    // We prioritize: Favorites, High User Ratings (>=4), and Items with Notes.
    const relevantItems = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 4) || (i.userNotes && i.userNotes.length > 5));
    // If not enough data, take the last 10 added items
    const sourceItems = relevantItems.length < 3 ? items.slice(0, 10) : relevantItems.slice(0, 20);
    // 2. Construct User Profile Context for the LLM
    const profileSummary = sourceItems.map(item => {
        let info = `- "${item.title}" (${item.year}, ${item.genre.join('/')})`;
        if (item.userRating)
            info += ` [Rating: ${item.userRating}/5]`;
        if (item.isFavorite)
            info += ` [Favorite]`;
        if (item.userNotes)
            info += ` [User Note: "${item.userNotes}"]`;
        return info;
    }).join("\n");
    try {
        const prompt = `
      Act as a sophisticated movie recommendation engine using Hybrid Filtering (Content-Based + Collaborative logic).
      
      Analyze the following user profile based on their watch history, ratings, and specific notes:
      ${profileSummary}

      Task:
      1. Analyze the 'User Notes' to understand specific elements the user likes (e.g., "plot twists", "cinematography", "dark atmosphere").
      2. Analyze the high-rated items to identify preferred genres and themes.
      3. Recommend 3 NEW movies or series that fit this specific taste profile. Do not recommend items already in the list.
      
      Return JSON format.
    `;
        const response = yield ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.ARRAY,
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            title: { type: genai_1.Type.STRING },
                            year: { type: genai_1.Type.NUMBER },
                            type: { type: genai_1.Type.STRING, enum: ["MOVIE", "SERIES"] },
                            genre: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                            plot: { type: genai_1.Type.STRING, description: "Warum passt das zu meinem Profil? (Auf Deutsch)" },
                            rating: { type: genai_1.Type.NUMBER },
                        },
                        required: ["title", "year", "type", "genre", "plot", "rating"],
                    },
                },
            },
        });
        if (response.text) {
            const data = JSON.parse(response.text);
            return data.map((item) => (Object.assign(Object.assign({}, item), { type: item.type === "SERIES" ? types_1.MediaType.SERIES : types_1.MediaType.MOVIE, posterPath: null, backdropPath: null })));
        }
        return [];
    }
    catch (error) {
        console.error("Gemini Recommendation Error:", error);
        return [];
    }
});
exports.getRecommendations = getRecommendations;
/**
 * Generates a profile picture for the user based on their username.
 * Uses gemini-2.5-flash-image ("NanoBanana").
 */
const generateAvatar = (username) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use DiceBear "Notionists" style
        // We add a random component to the seed to ensure a new avatar is generated each time
        const randomSeed = Math.random().toString(36).substring(7);
        const seed = `${username}-${randomSeed}`;
        return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
    catch (error) {
        console.error("Avatar Generation Error:", error);
        return null;
    }
});
exports.generateAvatar = generateAvatar;
/**
 * Vision Search: Identifies a movie/series from an image (DVD cover, poster, scene).
 */
const identifyMovieFromImage = (base64Image) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const prompt = "Identify the movie or TV series shown in this image. Return ONLY the exact title. If not sure, return nothing.";
        // Remove header if present (data:image/jpeg;base64,)
        const base64Data = base64Image.split(',')[1];
        const response = yield ai.models.generateContent({
            model: MODEL_NAME, // Gemini 2.5 Flash is multimodal
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            }
        });
        return ((_a = response.text) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    }
    catch (error) {
        console.error("Vision Search Error:", error);
        return null;
    }
});
exports.identifyMovieFromImage = identifyMovieFromImage;
/**
 * ChatBot: Answer questions based on the user's collection context.
 */
const chatWithAI = (message, collection, history) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create a summary of the user's collection for context
        // Limit to last 50 items to save tokens
        const collectionContext = collection.slice(0, 50).map(i => `${i.title} (${i.year}) - Status: ${i.status}, Rating: ${i.userRating || 'N/A'}`).join('\n');
        const systemInstruction = `
            You are 'CineLog AI', a helpful movie assistant.
            You have access to the user's movie collection/watchlist provided below.
            
            User's Collection Context:
            ${collectionContext}

            Rules:
            1. If the user asks "Where can I watch X?", try to answer generally or ask them to check the app's streaming info.
            2. If they ask for recommendations, consider what they have already watched/rated.
            3. Keep answers concise, friendly, and in the language of the user (German/English).
            4. You can filter their collection (e.g., "Show me 80s horror movies I haven't watched").
        `;
        const response = yield ai.models.generateContent({
            model: MODEL_NAME,
            contents: message,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text || "Sorry, I couldn't generate a response.";
    }
    catch (error) {
        console.error("Chat Error:", error);
        return "Sorry, I'm having trouble connecting to the AI right now.";
    }
});
exports.chatWithAI = chatWithAI;
/**
 * Deep Content Analysis: Analyzes plot vs user preferences/notes.
 */
const analyzeMovieContext = (item, userNotes) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prompt = `
            Analyze the movie/series "${item.title}".
            Plot: "${item.plot}"
            User's Private Notes on this item: "${userNotes || 'None'}"
            
            Task:
            Provide a short, 2-sentence "Deep Insight".
            1. Mention if the "Vibe" matches the plot (e.g. "Dark & Complex").
            2. Warn about structural things like Cliffhangers if it's a series, or if the user notes indicate they liked/disliked something specific about it.
            
            Output Language: German.
        `;
        const response = yield ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "Keine Analyse verfügbar.";
    }
    catch (error) {
        return "Analyse fehlgeschlagen.";
    }
});
exports.analyzeMovieContext = analyzeMovieContext;
