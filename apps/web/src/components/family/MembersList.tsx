'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { FamilyMembership } from '@/lib/api/family';

interface MembersListProps {
  members: FamilyMembership[];
  isLoading: boolean;
  currentUserId: string;
  isOwner: boolean;
  onRemoveMember: (memberId: string) => void;
}

export function MembersList({
  members,
  isLoading,
  currentUserId,
  isOwner,
  onRemoveMember,
}: MembersListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-4 text-gray-600">Loading members...</p>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">No members found</p>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <span className="text-sm font-medium text-primary-700">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user.name || member.user.email}
                      {member.userId === currentUserId && (
                        <span className="ml-2 text-sm text-gray-500">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(
                    member.role,
                  )}`}
                >
                  {member.role}
                </span>
                {isOwner && member.userId !== currentUserId && member.role !== 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveMember(member.userId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
