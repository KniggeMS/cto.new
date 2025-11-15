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
