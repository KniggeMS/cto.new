export enum MediaType {
    MOVIE = "MOVIE",
    SERIES = "SERIES"
}

export interface MediaItem {
    id: string;
    tmdbId: number;
    type: MediaType;
    title: string;
    year: number;
    genre: string[];
    status: "PLANNED" | "WATCHING" | "WATCHED" | "DROPPED";
    userRating?: number;
    isFavorite?: boolean;
    userNotes?: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    plot?: string;
}

export interface SearchResult {
    title: string;
    year: number;
    type: MediaType;
    genre: string[];
    plot: string;
    rating: number;
    posterPath?: string | null;
    backdropPath?: string | null;
}

export interface ChatMessage {
    role: "user" | "model";
    content: string;
}
