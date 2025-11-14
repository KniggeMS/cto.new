import { apiClient } from './client';

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface CreateFamilyData {
  name: string;
  description?: string;
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

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const response = await apiClient.get(`/family/${familyId}/members`);
    return response.data.data;
  },

  async inviteToFamily(familyId: string, email: string): Promise<void> {
    await apiClient.post(`/family/${familyId}/invite`, { email });
  },

  async leaveFamily(familyId: string): Promise<void> {
    await apiClient.post(`/family/${familyId}/leave`);
  },
};
