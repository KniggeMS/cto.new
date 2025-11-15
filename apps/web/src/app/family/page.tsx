'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFamilies, useCreateFamily } from '@/lib/hooks/use-family';
import toast from 'react-hot-toast';

export default function FamilyPage() {
  const { data: families, isLoading, error } = useFamilies();
  const createMutation = useCreateFamily();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    try {
      await createMutation.mutateAsync({ name: newFamilyName.trim() });
      toast.success('Family created successfully!');
      setNewFamilyName('');
      setShowCreateForm(false);
    } catch (error) {
      toast.error('Failed to create family');
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Family" description="Manage your family groups and share recommendations">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-gray-600">Loading families...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Family">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Failed to load families. Please try again.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Family" description="Manage your family groups and share recommendations">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'Create Family'}
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Family</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label htmlFor="family-name" className="block text-sm font-medium text-gray-700">
                    Family Name
                  </label>
                  <Input
                    id="family-name"
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder="The Smith Family"
                    required
                  />
                </div>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!families || families.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No family groups yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Create a family group to share recommendations with loved ones.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <Link key={family.id} href={`/family/${family.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>{family.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created by {family.creator.name || family.creator.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(family.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
