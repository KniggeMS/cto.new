import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import { generateAvatar } from "../services/ai";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// Register
router.post("/register", async (req, res) => {
    const { username, email, password, firstName, lastName, avatarUrl } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const existingUser = await prisma.user.findFirst({
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

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
                avatarUrl
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { email, password, username } = req.body;

    // Allow login with either email or username (sent in 'email' field or 'username' field)
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ error: "Missing credentials" });
    }

    try {
        const user = await prisma.user.findFirst({
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

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login failed" });
    }
});

// Me (Get Current User)
router.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl });
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// Update Profile (Avatar)
router.patch("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const { avatarUrl } = req.body;

        const user = await prisma.user.update({
            where: { id: payload.userId },
            data: { avatarUrl },
        });

        res.json({ id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: "Invalid token or update failed" });
    }
});

// Generate AI Avatar
router.post("/generate-avatar", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });

        if (!user) return res.status(404).json({ error: "User not found" });

        const avatarUrl = await generateAvatar(user.username);

        if (!avatarUrl) {
            return res.status(500).json({ error: "Failed to generate avatar" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl },
        });

        res.json({ id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Avatar generation route error:", error);
        res.status(500).json({ error: "Generation failed", details: error instanceof Error ? error.message : String(error) });
    }
});

// Change Password
router.post("/change-password", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });

        if (!user || !user.passwordHash) return res.status(404).json({ error: "User not found" });

        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid) return res.status(400).json({ error: "Incorrect old password" });

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: "Invalid token or update failed" });
    }
});

export default router;
