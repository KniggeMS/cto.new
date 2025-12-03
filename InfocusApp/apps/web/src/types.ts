export enum MediaType {
    MOVIE = "MOVIE",
    SERIES = "SERIES"
}

export interface SearchResult {
    id?: number; // TMDB ID
    tmdbId?: number;
    title: string;
    year: number;
    type: MediaType;
    genre: string[];
    plot: string;
    rating: number;
    posterPath?: string | null;
    backdropPath?: string | null;
    customNotes?: string;
    imdbID?: string;
}
