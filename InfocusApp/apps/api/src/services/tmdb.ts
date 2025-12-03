const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const searchMulti = async (query: string) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error("TMDB_API_KEY is not configured");

    const response = await fetch(
        `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=de-DE`
    );

    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }

    return response.json();
};

export const getMediaDetails = async (id: number, type: "movie" | "tv") => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error("TMDB_API_KEY is not configured");

    const response = await fetch(
        `${TMDB_BASE_URL}/${type}/${id}?api_key=${apiKey}&language=de-DE&append_to_response=watch/providers,credits`
    );

    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }

    return response.json();
};
