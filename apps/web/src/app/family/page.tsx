'use client';

import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFamilies } from '@/lib/hooks/use-family';

export default function FamilyPage() {
  const { data: families, isLoading, error } = useFamilies();

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
            <Card key={family.id}>
              <CardHeader>
                <CardTitle>{family.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {family.description && (
                  <p className="text-sm text-gray-600">{family.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Created {new Date(family.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
