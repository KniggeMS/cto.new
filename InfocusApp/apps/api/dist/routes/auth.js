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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("@repo/db");
const ai_1 = require("../services/ai");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
// Register
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, firstName, lastName, avatarUrl } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const existingUser = yield db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const user = yield db_1.prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
                avatarUrl
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed" });
    }
}));
// Login
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, username } = req.body;
    // Allow login with either email or username (sent in 'email' field or 'username' field)
    const loginIdentifier = email || username;
    if (!loginIdentifier || !password) {
        return res.status(400).json({ error: "Missing credentials" });
    }
    try {
        const user = yield db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginIdentifier },
                    { username: loginIdentifier }
                ]
            }
        });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const valid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login failed" });
    }
}));
// Me (Get Current User)
router.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield db_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl });
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
}));
// Update Profile (Avatar)
router.patch("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { avatarUrl } = req.body;
        const user = yield db_1.prisma.user.update({
            where: { id: payload.userId },
            data: { avatarUrl },
        });
        res.json({ id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl });
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ error: "Invalid token or update failed" });
    }
}));
// Generate AI Avatar
router.post("/generate-avatar", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield db_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const avatarUrl = yield (0, ai_1.generateAvatar)(user.username);
        if (!avatarUrl) {
            return res.status(500).json({ error: "Failed to generate avatar" });
        }
        const updatedUser = yield db_1.prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl },
        });
        res.json({ id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, avatarUrl: updatedUser.avatarUrl });
    }
    catch (error) {
        console.error("Avatar generation route error:", error);
        res.status(500).json({ error: "Generation failed", details: error instanceof Error ? error.message : String(error) });
    }
}));
// Change Password
router.post("/change-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Missing fields" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield db_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || !user.passwordHash)
            return res.status(404).json({ error: "User not found" });
        const valid = yield bcryptjs_1.default.compare(oldPassword, user.passwordHash);
        if (!valid)
            return res.status(400).json({ error: "Incorrect old password" });
        const passwordHash = yield bcryptjs_1.default.hash(newPassword, 10);
        yield db_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ error: "Invalid token or update failed" });
    }
}));
exports.default = router;
