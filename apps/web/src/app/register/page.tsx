'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/context/auth-context';
import { registerSchema, type RegisterFormData } from '@/lib/validation/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/watchlist');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.displayName);
      toast.success('Account created successfully!');
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';

      if (error instanceof Error) {
        if ('response' in error) {
          const response = error as any;
          errorMessage = response.response?.data?.error || errorMessage;
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  if (isAuthenticated && !authLoading) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Display Name"
                type="text"
                placeholder="John Doe"
                {...register('displayName')}
                autoComplete="name"
              />
              {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>}
            </div>

            <div>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                autoComplete="new-password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting || authLoading}>
              Register
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
