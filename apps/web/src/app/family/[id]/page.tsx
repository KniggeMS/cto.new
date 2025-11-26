'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useFamily,
  useFamilyMembers,
  useFamilyInvitations,
  useFamilyWatchlists,
  useFamilyRecommendations,
  useInviteToFamily,
  useResendInvitation,
  useRemoveMember,
  useLeaveFamily,
} from '@/lib/hooks/use-family';
import { useAuth } from '@/lib/context/auth-context';
import { InviteModal } from '@/components/family/InviteModal';
import { MembersList } from '@/components/family/MembersList';
import { InvitationsList } from '@/components/family/InvitationsList';
import { SharedWatchlist } from '@/components/family/SharedWatchlist';
import { RecommendationsFeed } from '@/components/family/RecommendationsFeed';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'watchlist' | 'recommendations' | 'members' | 'invites';

export default function FamilyDetailPage() {
  const params = useParams();
  const familyId = params.id as string;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [watchlistStatusFilter, setWatchlistStatusFilter] = useState<string>('');

  const { data: family, isLoading: familyLoading } = useFamily(familyId);
  const { data: members, isLoading: membersLoading } = useFamilyMembers(familyId);
  const { data: invitations, isLoading: invitationsLoading } = useFamilyInvitations(familyId);
  const { data: watchlists, isLoading: watchlistsLoading } = useFamilyWatchlists(
    familyId,
    watchlistStatusFilter || undefined,
  );
  const { data: recommendations, isLoading: recommendationsLoading } =
    useFamilyRecommendations(familyId);

  const inviteMutation = useInviteToFamily();
  const resendMutation = useResendInvitation();
  const removeMutation = useRemoveMember();
  const leaveMutation = useLeaveFamily();

  const handleInvite = async (email: string) => {
    try {
      return await inviteMutation.mutateAsync({ familyId, email });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to send invitation';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      await resendMutation.mutateAsync({ familyId, invitationId });
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMutation.mutateAsync({ familyId, memberId });
      toast.success('Member removed successfully');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to remove member';
      toast.error(errorMessage);
    }
  };

  const handleLeaveFamily = async () => {
    if (!confirm('Are you sure you want to leave this family?')) return;

    try {
      await leaveMutation.mutateAsync(familyId);
      toast.success('Left family successfully');
      // Redirect to families list after leaving
      window.location.href = '/family';
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to leave family';
      toast.error(errorMessage);
    }
  };

  const userMembership = members?.find((m) => m.userId === user?.id);
  const isOwner = userMembership?.role === 'owner';
  const isAdmin = userMembership?.role === 'admin' || isOwner;

  if (familyLoading) {
    return (
      <PageShell title="Family">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-gray-600">Loading family details...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!family) {
    return (
      <PageShell title="Family">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Family not found</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'watchlist', label: 'Shared Watchlist' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'members', label: 'Members' },
    ...(isAdmin ? [{ id: 'invites' as Tab, label: 'Invitations' }] : []),
  ];

  return (
    <PageShell title={family.name} description="Family dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{family.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Created by {family.creator.name || family.creator.email}
            </p>
          </div>
          <div className="flex space-x-3">
            {isAdmin && <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>}
            {!isOwner && (
              <Button variant="outline" onClick={handleLeaveFamily}>
                Leave Family
              </Button>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Family Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Members</dt>
                    <dd className="font-medium">{members?.length || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Pending Invites</dt>
                    <dd className="font-medium">
                      {invitations?.filter((i) => i.status === 'pending').length || 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Shared Watchlist Items</dt>
                    <dd className="font-medium">{watchlists?.length || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Recommendations</dt>
                    <dd className="font-medium">{recommendations?.length || 0}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Last updated {new Date(family.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'watchlist' && (
          <SharedWatchlist
            watchlists={watchlists || []}
            members={members || []}
            isLoading={watchlistsLoading}
            statusFilter={watchlistStatusFilter}
            onStatusFilterChange={setWatchlistStatusFilter}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsFeed
            recommendations={recommendations || []}
            isLoading={recommendationsLoading}
          />
        )}

        {activeTab === 'members' && (
          <MembersList
            members={members || []}
            isLoading={membersLoading}
            currentUserId={user?.id || ''}
            isOwner={isOwner}
            onRemoveMember={handleRemoveMember}
          />
        )}

        {activeTab === 'invites' && isAdmin && (
          <InvitationsList
            invitations={invitations || []}
            isLoading={invitationsLoading}
            onResend={handleResend}
          />
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          familyId={familyId}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
        />
      )}
    </PageShell>
  );
}
