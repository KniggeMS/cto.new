import express from "express";
import { authenticate } from "../middleware/auth";
import { getRecommendations, chatWithAI } from "../services/ai";
import { prisma } from "@repo/db";

const router = express.Router();

// Get Recommendations
router.get("/recommendations", authenticate, async (req, res) => {
    const user = (req as any).user;
    try {
        // Fetch user's media items for context
        const items = await prisma.mediaItem.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 50
        });

        // Map to MediaItem type expected by AI service
        const mediaItems = items.map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            type: item.type === "TV" ? "SERIES" as any : "MOVIE" as any,
            title: item.title,
            year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0,
            genre: [], // Prisma model doesn't store genres yet
            status: item.status as any,
            userRating: item.rating || undefined,
            isFavorite: item.isFavorite,
            userNotes: undefined, // Not in schema yet
            posterPath: item.posterPath,
            backdropPath: item.backdropPath
        }));

        const recommendations = await getRecommendations(mediaItems);
        res.json(recommendations);
    } catch (error: any) {
        console.error("Recommendation Error:", error);
        if (error.status === 429 || (error.message && error.message.includes("429"))) {
            return res.status(429).json({ error: "Zu viele Anfragen. Bitte warte einen Moment.", details: "Quota exceeded" });
        }
        res.status(500).json({ error: "Failed to get recommendations" });
    }
});

// Chat with AI
router.post("/chat", authenticate, async (req, res) => {
    const { message, history } = req.body;
    const user = (req as any).user;

    if (!message) return res.status(400).json({ error: "Message required" });

    try {
        // Fetch user's media items for context
        const items = await prisma.mediaItem.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 50
        });

        const mediaItems = items.map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            type: item.type === "TV" ? "SERIES" as any : "MOVIE" as any,
            title: item.title,
            year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0,
            genre: [],
            status: item.status as any,
            userRating: item.rating || undefined,
            isFavorite: item.isFavorite,
            userNotes: undefined,
            posterPath: item.posterPath,
            backdropPath: item.backdropPath
        }));

        const response = await chatWithAI(message, mediaItems, history || []);
        res.json({ response });
    } catch (error: any) {
        console.error("Chat Error:", error);
        if (error.status === 429 || (error.message && error.message.includes("429"))) {
            return res.status(429).json({ error: "Zu viele Anfragen. Bitte warte einen Moment.", details: "Quota exceeded" });
        }
        res.status(500).json({ error: "Failed to chat with AI" });
    }
});

export default router;
