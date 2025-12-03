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
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("@repo/db");
const tmdb_1 = require("./services/tmdb");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env from root
// Load env from root and local
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../../.env") });
dotenv_1.default.config(); // Loads .env from CWD (apps/api)
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
console.log("API Key loaded:", process.env.TMDB_API_KEY ? "YES" : "NO");
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = path_1.default.join(__dirname, "../uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer Config
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage: storage });
// Serve Uploads
app.use("/uploads", express_1.default.static(uploadDir));
// Mount Auth Routes
app.use("/api/auth", auth_1.default);
// Mount AI Routes
app.use("/api/ai", ai_1.default);
// Upload Endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});
// Middleware to protect other routes (optional for now, but good practice)
// For now, we'll keep the existing routes open or adapt them to use the token if present.
// But we need to remove the hardcoded "bigdaddy" user fetching in other routes eventually.
// For this step, let's just add the auth routes.
// --- Routes ---
// Search TMDB
app.get("/api/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query.q;
    if (!query)
        return res.status(400).json({ error: "Query required" });
    try {
        const results = yield (0, tmdb_1.searchMulti)(query);
        res.json(results);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
}));
// Get TMDB Details
app.get("/api/tmdb/:type/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, id } = req.params;
    if (type !== "movie" && type !== "tv")
        return res.status(400).json({ error: "Invalid type" });
    try {
        // Import dynamically to avoid circular deps if any, or just use the service
        const { getMediaDetails } = require("./services/tmdb");
        const details = yield getMediaDetails(parseInt(id), type);
        res.json(details);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch details" });
    }
}));
const auth_2 = require("./middleware/auth");
// ...
// Get User's Media
app.get("/api/media", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const status = req.query.status;
    const favorite = req.query.favorite === "true";
    const user = req.user;
    try {
        const where = { userId: user.id };
        if (status)
            where.status = status;
        if (favorite)
            where.isFavorite = true;
        const media = yield db_1.prisma.mediaItem.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        });
        res.json(media);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
}));
// Add Media
app.post("/api/media", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tmdbId, type, title, posterPath, status } = req.body;
    const user = req.user;
    try {
        const media = yield db_1.prisma.mediaItem.create({
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
    }
    catch (error) {
        // Handle unique constraint violation (P2002)
        if (error.code === 'P2002') {
            const existing = yield db_1.prisma.mediaItem.findUnique({
                where: {
                    userId_tmdbId_type: {
                        userId: user.id,
                        tmdbId,
                        type: type,
                    }
                }
            });
            return res.json(existing);
        }
        console.error(error);
        res.status(500).json({ error: "Failed to add media" });
    }
}));
// Update Media Status
app.patch("/api/media/:id", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status, isFavorite } = req.body;
    const user = req.user;
    try {
        // Verify ownership
        const existing = yield db_1.prisma.mediaItem.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id)
            return res.status(403).json({ error: "Forbidden" });
        const updateData = {};
        if (status)
            updateData.status = status;
        if (isFavorite !== undefined)
            updateData.isFavorite = isFavorite;
        const media = yield db_1.prisma.mediaItem.update({
            where: { id },
            data: updateData,
        });
        res.json(media);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update media" });
    }
}));
// Delete Media
app.delete("/api/media/:id", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    try {
        // Verify ownership
        const existing = yield db_1.prisma.mediaItem.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id)
            return res.status(403).json({ error: "Forbidden" });
        yield db_1.prisma.mediaItem.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete media" });
    }
}));
// --- Lists API ---
// Get All Lists
app.get("/api/lists", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        const lists = yield db_1.prisma.list.findMany({
            where: { userId: user.id },
            include: { _count: { select: { items: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json(lists);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch lists" });
    }
}));
// Get Single List
app.get("/api/lists/:id", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    try {
        const list = yield db_1.prisma.list.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!list)
            return res.status(404).json({ error: "List not found" });
        if (list.userId !== user.id)
            return res.status(403).json({ error: "Forbidden" });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch list" });
    }
}));
// Create List
app.post("/api/lists", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    const user = req.user;
    if (!name)
        return res.status(400).json({ error: "Name required" });
    try {
        const list = yield db_1.prisma.list.create({
            data: {
                name,
                userId: user.id,
            },
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create list" });
    }
}));
// Delete List
app.delete("/api/lists/:id", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    try {
        const list = yield db_1.prisma.list.findUnique({ where: { id } });
        if (!list || list.userId !== user.id)
            return res.status(403).json({ error: "Forbidden" });
        yield db_1.prisma.list.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete list" });
    }
}));
// Add Item to List
app.post("/api/lists/:id/items", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { mediaId } = req.body;
    const user = req.user;
    try {
        const list = yield db_1.prisma.list.findUnique({ where: { id } });
        if (!list || list.userId !== user.id)
            return res.status(403).json({ error: "Forbidden" });
        yield db_1.prisma.list.update({
            where: { id },
            data: {
                items: {
                    connect: { id: mediaId },
                },
            },
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add item to list" });
    }
}));
// Remove Item from List
app.delete("/api/lists/:id/items/:mediaId", auth_2.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, mediaId } = req.params;
    const user = req.user;
    try {
        const list = yield db_1.prisma.list.findUnique({ where: { id } });
        if (!list || list.userId !== user.id)
            return res.status(403).json({ error: "Forbidden" });
        yield db_1.prisma.list.update({
            where: { id },
            data: {
                items: {
                    disconnect: { id: mediaId },
                },
            },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to remove item from list" });
    }
}));
app.get("/", (req, res) => {
    res.send("API is running");
});
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    // await seedUser(); // Removed
    console.log(`API running on port ${port}`);
}));
