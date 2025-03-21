import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setPermissionStatus } from '@/store/slices/calendarSlice';
import { MdLock, MdLockOpen, MdRefresh } from 'react-icons/md';
import type { IconType } from 'react-icons';
import clsx from 'clsx';

interface PermissionManagerProps {
  className?: string;
  onPermissionChange?: (granted: boolean) => void;
}

interface StatusIconProps {
  icon: IconType;
  color: string;
}

const StatusIcon = ({ icon: Icon, color }: StatusIconProps) => (
  <div className={color}>
    <Icon size={20} />
  </div>
);

const checkCalendarPermission = (session: any): boolean => {
  if (!session?.accessToken) return false;
  // In a real implementation, you would check the token scopes here
  // For now, we'll assume having a token means we have calendar access
  return true;
};

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  className,
  onPermissionChange,
}) => {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  
  const permission = useAppSelector((state) => state.calendar.permission);

  useEffect(() => {
    const hasCalendarAccess = checkCalendarPermission(session);
    dispatch(setPermissionStatus(hasCalendarAccess));
    onPermissionChange?.(hasCalendarAccess);
  }, [session, dispatch, onPermissionChange]);

  const handleRequestAccess = async () => {
    setIsChecking(true);
    try {
      await signIn('google', {
        callbackUrl: window.location.href,
        scope: 'https://www.googleapis.com/auth/calendar'
      });
    } catch (error) {
      console.error('Failed to request calendar access:', error);
      dispatch(setPermissionStatus(false));
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckAccess = async () => {
    setIsChecking(true);
    try {
      const hasAccess = checkCalendarPermission(session);
      dispatch(setPermissionStatus(hasAccess));
      onPermissionChange?.(hasAccess);
    } catch (error) {
      console.error('Failed to check calendar access:', error);
      dispatch(setPermissionStatus(false));
    } finally {
      setIsChecking(false);
    }
  };

  if (status === 'loading' || isChecking) {
    return (
      <div className={clsx('flex items-center space-x-2 text-gray-600', className)}>
        <StatusIcon icon={MdRefresh} color="text-gray-600" />
        <span>Controleren...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={clsx('flex items-center space-x-2', className)}>
        <StatusIcon icon={MdLock} color="text-red-500" />
        <span className="text-gray-600">Log in om agenda te gebruiken</span>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center space-x-4', className)}>
      <div className="flex items-center space-x-2">
        {permission.granted ? (
          <>
            <StatusIcon icon={MdLockOpen} color="text-green-500" />
            <span className="text-gray-600">Agenda toegang verleend</span>
          </>
        ) : (
          <>
            <StatusIcon icon={MdLock} color="text-red-500" />
            <span className="text-gray-600">Agenda toegang vereist</span>
          </>
        )}
      </div>

      <button
        onClick={permission.granted ? handleCheckAccess : handleRequestAccess}
        className={clsx(
          'px-3 py-1 text-sm font-medium rounded-md',
          permission.granted
            ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            : 'text-white bg-blue-600 hover:bg-blue-700'
        )}
      >
        {permission.granted ? 'Controleer Toegang' : 'Verleen Toegang'}
      </button>

      {permission.error && (
        <span className="text-sm text-red-500">{permission.error}</span>
      )}
    </div>
  );
};