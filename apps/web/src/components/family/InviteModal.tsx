'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface InviteModalProps {
  familyId: string;
  onClose: () => void;
  onInvite: (email: string) => Promise<any>;
}

export function InviteModal({ familyId, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onInvite(email);
      setInviteToken(result.data.token);
      toast.success('Invitation sent successfully!');
      setEmail('');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to send invitation';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteLink = inviteToken
    ? `${window.location.origin}/family/${familyId}/invite/${inviteToken}`
    : null;

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invite Family Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            {inviteToken && inviteLink && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">Invitation created!</p>
                <p className="mt-2 text-xs text-green-700">Share this link:</p>
                <div className="mt-2 flex items-center space-x-2">
                  <Input value={inviteLink} readOnly className="text-xs" />
                  <Button type="button" onClick={copyToClipboard} size="sm">
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" disabled={isSubmitting || !email}>
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
