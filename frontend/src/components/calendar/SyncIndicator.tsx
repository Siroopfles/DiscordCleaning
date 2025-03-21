import { useAppSelector } from '@/store/hooks';
import { Spinner } from '@/components/ui/Spinner';
import { MdSync, MdError } from 'react-icons/md';
import type { IconType } from 'react-icons';
import clsx from 'clsx';

interface SyncIndicatorProps {
  className?: string;
}

interface StatusIconProps {
  icon: IconType;
  color: string;
}

const StatusIcon = ({ icon: Icon, color }: StatusIconProps) => (
  <div className={color}>
    <Icon size={18} />
  </div>
);

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ className }) => {
  const { syncing, error } = useAppSelector((state: { calendar: { syncing: boolean; error: string | null } }) => ({
    syncing: state.calendar.syncing,
    error: state.calendar.error
  }));

  return (
    <div className={clsx('flex items-center gap-2 text-sm', className)}>
      {syncing ? (
        <>
          <Spinner size="sm" />
          <span className="text-gray-600">Synchronizing...</span>
        </>
      ) : error ? (
        <>
          <StatusIcon icon={MdError} color="text-red-500" />
          <span className="text-red-500">{error}</span>
        </>
      ) : (
        <>
          <StatusIcon icon={MdSync} color="text-green-500" />
          <span className="text-gray-600">Synced</span>
        </>
      )}
    </div>
  );
};