'use client';

import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/context/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <PageShell title="Settings" description="Manage your account settings and preferences">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <p className="mt-1 text-gray-900">{user?.displayName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your InFocus experience</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Preferences settings coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Notification settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
