
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { aiApi } from '@/lib/api/ai';
import { useAuth } from '@/lib/context/auth-context';
import Image from 'next/image';

export function AvatarGenerator() {
    const { user } = useAuth();
    const [username, setUsername] = useState(user?.displayName || user?.name || '');
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!username) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await aiApi.generateAvatar(username);
            if (response.avatarUrl) {
                setGeneratedAvatar(response.avatarUrl);
            } else {
                setError('Failed to generate avatar. Please try again.');
            }
        } catch (err) {
            console.error('Avatar generation error:', err);
            setError('An error occurred while generating the avatar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username for Avatar Style
                </label>
                <div className="flex space-x-2">
                    <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username..."
                        disabled={isLoading}
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !username}>
                        {isLoading ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
                <p className="text-xs text-gray-500">
                    Enter a name or style keyword to generate a unique AI avatar.
                </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {generatedAvatar && (
                <div className="mt-4 flex flex-col items-center space-y-3">
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-indigo-100 shadow-lg">
                        <Image
                            src={generatedAvatar}
                            alt="Generated Avatar"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <p className="text-sm text-green-600 font-medium">Avatar Generated Successfully!</p>
                    {/* Future: Add Save button here */}
                </div>
            )}
        </div>
    );
}
