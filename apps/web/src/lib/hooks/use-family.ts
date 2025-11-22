import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '@/lib/api/family';
import type { CreateFamilyData } from '@/lib/api/family';

export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getFamilies,
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: ['family', id],
    queryFn: () => familyApi.getFamily(id),
    enabled: !!id,
  });
}

export function useFamilyMembers(familyId: string) {
  return useQuery({
    queryKey: ['family', familyId, 'members'],
    queryFn: () => familyApi.getFamilyMembers(familyId),
    enabled: !!familyId,
  });
}

export function useFamilyInvitations(familyId: string) {
  return useQuery({
    queryKey: ['family', familyId, 'invitations'],
    queryFn: () => familyApi.getFamilyInvitations(familyId),
    enabled: !!familyId,
  });
}

export function useFamilyWatchlists(familyId: string, status?: string) {
  return useQuery({
    queryKey: ['family', familyId, 'watchlists', status],
    queryFn: () => familyApi.getFamilyWatchlists(familyId, status),
    enabled: !!familyId,
  });
}

export function useFamilyRecommendations(familyId: string) {
  return useQuery({
    queryKey: ['family', familyId, 'recommendations'],
    queryFn: () => familyApi.getFamilyRecommendations(familyId),
    enabled: !!familyId,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFamilyData) => familyApi.createFamily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

export function useInviteToFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, email }: { familyId: string; email: string }) =>
      familyApi.inviteToFamily(familyId, email),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['family', familyId, 'invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, invitationId }: { familyId: string; invitationId: string }) =>
      familyApi.resendInvitation(familyId, invitationId),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['family', familyId, 'invitations'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, memberId }: { familyId: string; memberId: string }) =>
      familyApi.removeMember(familyId, memberId),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['family', familyId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['family', familyId] });
    },
  });
}

export function useLeaveFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (familyId: string) => familyApi.leaveFamily(familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}
