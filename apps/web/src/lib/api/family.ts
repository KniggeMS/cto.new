import { apiClient } from './client';

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: FamilyMembership[];
  creator: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface FamilyMembership {
  id: string;
  userId: string;
  familyId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  mediaItemId: string;
  status: 'not_watched' | 'watching' | 'completed';
  rating: number | null;
  notes: string | null;
  dateAdded: string;
  dateUpdated: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  mediaItem: {
    id: string;
    tmdbId: number;
    tmdbType: string;
    title: string;
    description: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    rating: number | null;
    genres: string[];
    creators: string[];
    streamingProviders: StreamingProvider[];
  };
}

export interface StreamingProvider {
  id: string;
  provider: string;
  url: string | null;
  regions: string[];
}

export interface Recommendation {
  id: string;
  mediaItemId: string;
  recommendedBy: string;
  recommendedTo: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  mediaItem: {
    id: string;
    tmdbId: number;
    tmdbType: string;
    title: string;
    description: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    rating: number | null;
    genres: string[];
    creators: string[];
    streamingProviders: StreamingProvider[];
  };
  fromUser: {
    id: string;
    email: string;
    name: string | null;
  };
  toUser: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface CreateFamilyData {
  name: string;
  description?: string;
}

export interface InviteResponse {
  message: string;
  data: FamilyInvitation;
}

export const familyApi = {
  async getFamilies(): Promise<Family[]> {
    const response = await apiClient.get('/family');
    return response.data.data;
  },

  async getFamily(id: string): Promise<Family> {
    const response = await apiClient.get(`/family/${id}`);
    return response.data.data;
  },

  async createFamily(data: CreateFamilyData): Promise<Family> {
    const response = await apiClient.post('/family', data);
    return response.data.data;
  },

  async getFamilyMembers(familyId: string): Promise<FamilyMembership[]> {
    const response = await apiClient.get(`/family/${familyId}/members`);
    return response.data.data;
  },

  async inviteToFamily(familyId: string, email: string): Promise<InviteResponse> {
    const response = await apiClient.post(`/family/${familyId}/invite`, { email });
    return response.data;
  },

  async getFamilyInvitations(familyId: string): Promise<FamilyInvitation[]> {
    const response = await apiClient.get(`/family/${familyId}/invitations`);
    return response.data.data;
  },

  async resendInvitation(familyId: string, invitationId: string): Promise<FamilyInvitation> {
    const response = await apiClient.post(`/family/${familyId}/invitations/${invitationId}/resend`);
    return response.data.data;
  },

  async removeMember(familyId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/family/${familyId}/members/${memberId}`);
  },

  async getFamilyWatchlists(familyId: string, status?: string): Promise<WatchlistEntry[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/family/${familyId}/watchlists`, { params });
    return response.data.data;
  },

  async getFamilyRecommendations(familyId: string): Promise<Recommendation[]> {
    const response = await apiClient.get(`/family/${familyId}/recommendations`);
    return response.data.data;
  },

  async leaveFamily(familyId: string): Promise<void> {
    await apiClient.post(`/family/${familyId}/leave`);
  },
};
