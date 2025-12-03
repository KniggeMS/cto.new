import { MediaType, SearchResult } from "../types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function searchTMDB(query: string, apiKey: string, year?: string): Promise<SearchResult[]> {
    if (!apiKey) return [];

    let url = `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=de-DE`;

    // Note: TMDB search/multi doesn't support year filtering directly in the same way as search/movie
    // But we can filter client side or use specific endpoints if type is known.
    // For now, we search multi and filter.

    const res = await fetch(url);
    if (!res.ok) throw new Error("TMDB Request Failed");

    const data = await res.json();

    if (!data.results) return [];

    let results = data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');

    if (year) {
        results = results.filter((item: any) => {
            const date = item.release_date || item.first_air_date;
            return date && date.startsWith(year);
        });
    }

    return results.map((item: any) => mapTmdbToResult(item));
}

export async function findByExternalId(externalId: string, apiKey: string): Promise<SearchResult | null> {
    if (!apiKey) return null;

    const url = `${TMDB_BASE_URL}/find/${externalId}?api_key=${apiKey}&external_source=imdb_id&language=de-DE`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    if (data.movie_results && data.movie_results.length > 0) {
        return mapTmdbToResult({ ...data.movie_results[0], media_type: 'movie' });
    }

    if (data.tv_results && data.tv_results.length > 0) {
        return mapTmdbToResult({ ...data.tv_results[0], media_type: 'tv' });
    }

    return null;
}

function mapTmdbToResult(item: any): SearchResult {
    const isMovie = item.media_type === 'movie' || item.title;

    return {
        tmdbId: item.id,
        title: item.title || item.name,
        year: parseInt((item.release_date || item.first_air_date || "").substring(0, 4)) || 0,
        type: isMovie ? MediaType.MOVIE : MediaType.SERIES,
        genre: [], // We'd need to map IDs to names, skipping for now
        plot: item.overview || "",
        rating: item.vote_average || 0,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path
    };
}
