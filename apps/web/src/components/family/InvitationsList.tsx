'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { FamilyInvitation } from '@/lib/api/family';

interface InvitationsListProps {
  invitations: FamilyInvitation[];
  isLoading: boolean;
  onResend: (invitationId: string) => void;
}

export function InvitationsList({ invitations, isLoading, onResend }: InvitationsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-4 text-gray-600">Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">No invitations found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (invitation: FamilyInvitation) => {
    const isExpired = new Date(invitation.expiresAt) < new Date();

    if (invitation.status === 'accepted') {
      return <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">Accepted</span>;
    }

    if (invitation.status === 'declined') {
      return <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-800">Declined</span>;
    }

    if (isExpired) {
      return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">Expired</span>;
    }

    return <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-800">Pending</span>;
  };

  const pendingInvitations = invitations.filter((i) => {
    const isExpired = new Date(i.expiresAt) < new Date();
    return i.status === 'pending' && !isExpired;
  });

  const otherInvitations = invitations.filter((i) => {
    const isExpired = new Date(i.expiresAt) < new Date();
    return i.status !== 'pending' || isExpired;
  });

  return (
    <div className="space-y-6">
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({pendingInvitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Sent {new Date(invitation.createdAt).toLocaleDateString()} • Expires{' '}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(invitation)}
                    <Button variant="outline" size="sm" onClick={() => onResend(invitation.id)}>
                      Resend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {otherInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {otherInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Sent {new Date(invitation.createdAt).toLocaleDateString()}
                      {invitation.acceptedAt &&
                        ` • Accepted ${new Date(invitation.acceptedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">{getStatusBadge(invitation)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
