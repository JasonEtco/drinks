import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButton } from './AuthButton';

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Sign in required</h2>
        <p className="text-muted-foreground mb-6">
          You need to sign in to access this feature. Sign in to create, edit, and manage your cocktail recipes.
        </p>
        <AuthButton variant="default" size="default" />
      </div>
    );
  }

  return <>{children}</>;
}