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
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("@repo/db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield db_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(401).json({ error: "User not found" });
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});
exports.authenticate = authenticate;
