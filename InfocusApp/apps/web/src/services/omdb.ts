import { MediaType } from "../types";

const OMDB_BASE_URL = "http://www.omdbapi.com";

export async function searchOMDB(query: string, year: string | null, type: MediaType | undefined, apiKey: string): Promise<any> {
    if (!apiKey) return null;

    let url = `${OMDB_BASE_URL}/?apikey=${apiKey}&t=${encodeURIComponent(query)}`;

    if (year) {
        url += `&y=${year}`;
    }

    if (type) {
        // OMDB uses 'movie' and 'series'
        const omdbType = type === MediaType.MOVIE ? 'movie' : 'series';
        url += `&type=${omdbType}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.Response === "True") {
            return data; // Returns the full OMDB object, ImportModal checks for .imdbID
        } else if (data.Error === "Request limit reached!") {
            throw new Error("LIMIT_REACHED");
        }
    } catch (error: any) {
        if (error.message === "LIMIT_REACHED") throw error;
        console.error("OMDB Search Error:", error);
    }

    return null;
}
