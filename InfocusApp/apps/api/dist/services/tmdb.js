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
exports.getMediaDetails = exports.searchMulti = void 0;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const searchMulti = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey)
        throw new Error("TMDB_API_KEY is not configured");
    const response = yield fetch(`${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=de-DE`);
    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return response.json();
});
exports.searchMulti = searchMulti;
const getMediaDetails = (id, type) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey)
        throw new Error("TMDB_API_KEY is not configured");
    const response = yield fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${apiKey}&language=de-DE`);
    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return response.json();
});
exports.getMediaDetails = getMediaDetails;
