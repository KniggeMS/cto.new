import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // For backward compatibility during dev, maybe allow? No, let's enforce auth or fail.
        // But wait, the frontend isn't sending tokens yet.
        // Let's make it optional for now, or just return 401.
        // Given the user wants "Login", we should enforce it.
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) return res.status(401).json({ error: "User not found" });

        (req as any).user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};
