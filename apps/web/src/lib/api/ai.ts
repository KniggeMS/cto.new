import { apiClient } from './client';

export interface Recommendation {
    title: string;
    year: number;
    type: 'MOVIE' | 'SERIES';
    genre: string[];
    plot: string;
    rating: number;
}

export interface ChatResponse {
    response: string;
}

export interface AnalysisResponse {
    analysis: string;
}

export interface AvatarResponse {
    avatarUrl: string | null;
}

export interface VisionResponse {
    analysis: string;
}

export const aiApi = {
    getRecommendations: async (userHistory: any[]): Promise<Recommendation[]> => {
        const response = await apiClient.post<Recommendation[]>('/ai/recommendations', { userHistory });
        return response.data;
    },

    generateAvatar: async (username: string): Promise<AvatarResponse> => {
        const response = await apiClient.post<AvatarResponse>('/ai/avatar', { username });
        return response.data;
    },

    chatWithAI: async (message: string, context: any): Promise<ChatResponse> => {
        const response = await apiClient.post<ChatResponse>('/ai/chat', { message, context });
        return response.data;
    },

    analyzeContent: async (
        title: string,
        plot: string,
        notes: string,
    ): Promise<AnalysisResponse> => {
        const response = await apiClient.post<AnalysisResponse>('/ai/analyze', {
            movieTitle: title,
            plot,
            notes,
        });
        return response.data;
    },

    identifyMovie: async (base64Image: string): Promise<VisionResponse> => {
        const response = await apiClient.post<VisionResponse>('/ai/vision', { image: base64Image });
        return response.data;
    },
};
