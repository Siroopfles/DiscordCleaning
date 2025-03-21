import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { ComponentType, useEffect } from 'react';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;

      if (!session) {
        router.replace({
          pathname: '/api/auth/signin',
          query: { callbackUrl: router.asPath }
        });
      }
    }, [session, status, router]);

    if (status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!session) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}