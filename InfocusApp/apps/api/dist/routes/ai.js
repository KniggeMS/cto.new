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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const ai_1 = require("../services/ai");
const db_1 = require("@repo/db");
const router = express_1.default.Router();
// Get Recommendations
router.get("/recommendations", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        // Fetch user's media items for context
        const items = yield db_1.prisma.mediaItem.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 50
        });
        // Map to MediaItem type expected by AI service
        const mediaItems = items.map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            type: item.type === "TV" ? "SERIES" : "MOVIE",
            title: item.title,
            year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0,
            genre: [], // Prisma model doesn't store genres yet
            status: item.status,
            userRating: item.rating || undefined,
            isFavorite: item.isFavorite,
            userNotes: undefined, // Not in schema yet
            posterPath: item.posterPath,
            backdropPath: item.backdropPath
        }));
        const recommendations = yield (0, ai_1.getRecommendations)(mediaItems);
        res.json(recommendations);
    }
    catch (error) {
        console.error("Recommendation Error:", error);
        if (error.status === 429 || (error.message && error.message.includes("429"))) {
            return res.status(429).json({ error: "Zu viele Anfragen. Bitte warte einen Moment.", details: "Quota exceeded" });
        }
        res.status(500).json({ error: "Failed to get recommendations" });
    }
}));
// Chat with AI
router.post("/chat", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, history } = req.body;
    const user = req.user;
    if (!message)
        return res.status(400).json({ error: "Message required" });
    try {
        // Fetch user's media items for context
        const items = yield db_1.prisma.mediaItem.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 50
        });
        const mediaItems = items.map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            type: item.type === "TV" ? "SERIES" : "MOVIE",
            title: item.title,
            year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0,
            genre: [],
            status: item.status,
            userRating: item.rating || undefined,
            isFavorite: item.isFavorite,
            userNotes: undefined,
            posterPath: item.posterPath,
            backdropPath: item.backdropPath
        }));
        const response = yield (0, ai_1.chatWithAI)(message, mediaItems, history || []);
        res.json({ response });
    }
    catch (error) {
        console.error("Chat Error:", error);
        if (error.status === 429 || (error.message && error.message.includes("429"))) {
            return res.status(429).json({ error: "Zu viele Anfragen. Bitte warte einen Moment.", details: "Quota exceeded" });
        }
        res.status(500).json({ error: "Failed to chat with AI" });
    }
}));
exports.default = router;
