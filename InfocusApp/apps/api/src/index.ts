import express from "express";
import morgan from "morgan";
import cors from "cors";
import { prisma } from "@repo/db";
import { searchMulti } from "./services/tmdb";
import dotenv from "dotenv";
import path from "path";

// Load env from root
// Load env from root and local
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config(); // Loads .env from CWD (apps/api)

const app = express();
const port = process.env.PORT || 3001;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

console.log("API Key loaded:", process.env.TMDB_API_KEY ? "YES" : "NO");

import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import multer from "multer";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Serve Uploads
app.use("/uploads", express.static(uploadDir));

// Mount Auth Routes
app.use("/api/auth", authRoutes);
// Mount AI Routes
app.use("/api/ai", aiRoutes);

// Upload Endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Middleware to protect other routes (optional for now, but good practice)
// For now, we'll keep the existing routes open or adapt them to use the token if present.
// But we need to remove the hardcoded "bigdaddy" user fetching in other routes eventually.
// For this step, let's just add the auth routes.

// --- Routes ---

// Search TMDB
app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query required" });

    try {
        const results = await searchMulti(query);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
});

// Get TMDB Details
app.get("/api/tmdb/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    if (type !== "movie" && type !== "tv") return res.status(400).json({ error: "Invalid type" });

    try {
        // Import dynamically to avoid circular deps if any, or just use the service
        const { getMediaDetails } = require("./services/tmdb");
        const details = await getMediaDetails(parseInt(id), type);
        res.json(details);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch details" });
    }
});

import { authenticate } from "./middleware/auth";

// ...

// Get User's Media
app.get("/api/media", authenticate, async (req, res) => {
    const status = req.query.status as string;
    const favorite = req.query.favorite === "true";
    const user = (req as any).user;

    try {
        const where: any = { userId: user.id };
        if (status) where.status = status;
        if (favorite) where.isFavorite = true;

        const media = await prisma.mediaItem.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        });
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

// Add Media
app.post("/api/media", authenticate, async (req, res) => {
    const { tmdbId, type, title, posterPath, status } = req.body;
    const user = (req as any).user;

    try {
        const media = await prisma.mediaItem.create({
            data: {
                tmdbId,
                type, // MOVIE or TV
                title,
                posterPath,
                status: status || "PLANNED",
                userId: user.id,
            },
        });
        res.json(media);
    } catch (error: any) {
        // Handle unique constraint violation (P2002)
        if (error.code === 'P2002') {
            const existing = await prisma.mediaItem.findUnique({
                where: {
                    userId_tmdbId_type: {
                        userId: user.id,
                        tmdbId,
                        type: type as any,
                    }
                }
            });
            return res.json(existing);
        }
        console.error(error);
        res.status(500).json({ error: "Failed to add media" });
    }
});

// Update Media Status
app.patch("/api/media/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { status, isFavorite } = req.body;
    const user = (req as any).user;

    try {
        // Verify ownership
        const existing = await prisma.mediaItem.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

        const updateData: any = {};
        if (status) updateData.status = status;
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
        if (req.body.rating !== undefined) updateData.rating = req.body.rating;

        const media = await prisma.mediaItem.update({
            where: { id },
            data: updateData,
        });
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to update media" });
    }
});

// Delete Media
app.delete("/api/media/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const user = (req as any).user;

    try {
        // Verify ownership
        const existing = await prisma.mediaItem.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

        await prisma.mediaItem.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete media" });
    }
});

// --- Lists API ---

// Get All Lists
app.get("/api/lists", authenticate, async (req, res) => {
    const user = (req as any).user;
    try {
        const lists = await prisma.list.findMany({
            where: { userId: user.id },
            include: { _count: { select: { items: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch lists" });
    }
});

// Get Single List
app.get("/api/lists/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const user = (req as any).user;
    try {
        const list = await prisma.list.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!list) return res.status(404).json({ error: "List not found" });
        if (list.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

        res.json(list);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch list" });
    }
});

// Create List
app.post("/api/lists", authenticate, async (req, res) => {
    const { name } = req.body;
    const user = (req as any).user;
    if (!name) return res.status(400).json({ error: "Name required" });

    try {
        const list = await prisma.list.create({
            data: {
                name,
                userId: user.id,
            },
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: "Failed to create list" });
    }
});

// Delete List
app.delete("/api/lists/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const user = (req as any).user;
    try {
        const list = await prisma.list.findUnique({ where: { id } });
        if (!list || list.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

        await prisma.list.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete list" });
    }
});

// Add Item to List
app.post("/api/lists/:id/items", authenticate, async (req, res) => {
    const { id } = req.params;
    const { mediaId } = req.body;
    const user = (req as any).user;

    try {
        const list = await prisma.list.findUnique({ where: { id } });
        if (!list || list.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

        await prisma.list.update({
            where: { id },
            data: {
                items: {
                    connect: { id: mediaId },
                },
            },
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add item to list" });
    }
});

// Remove Item from List
app.delete("/api/lists/:id/items/:mediaId", authenticate, async (req, res) => {
    const { id, mediaId } = req.params;
    const user = (req as any).user;

    try {
        const list = await prisma.list.findUnique({ where: { id } });
        if (!list || list.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

        await prisma.list.update({
            where: { id },
            data: {
                items: {
                    disconnect: { id: mediaId },
                },
            },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove item from list" });
    }
});

app.get("/", (req, res) => {
    res.send("API is running");
});

app.listen(port, async () => {
    // await seedUser(); // Removed

    console.log(`API running on port ${port}`);
});
