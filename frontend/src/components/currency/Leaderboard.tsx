import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../../services/api';
import { TransferModal } from './TransferModal';

interface LeaderboardEntry {
  userId: string;
  username: string;
  balance: number;
  rank?: number;
}

export const Leaderboard: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['currency', 'leaderboard'],
    queryFn: async () => {
      const response = await currencyApi.getLeaderboard(10);
      return response.data;
    },
    refetchInterval: 60000 // Ververs elke minuut
  });

  const handleTransferClick = (userId: string) => {
    setSelectedUser(userId);
    setShowTransferModal(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">🏆 Leaderboard</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {leaderboard?.map((entry: LeaderboardEntry, index: number) => (
          <div
            key={entry.userId}
            className="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-4">
              <div className="w-8 text-center">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div>
                <p className="font-medium">{entry.username}</p>
                <p className="text-sm text-gray-500">{entry.balance} credits</p>
              </div>
            </div>
            
            <button
              onClick={() => handleTransferClick(entry.userId)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Credits Overmaken
            </button>
          </div>
        ))}
      </div>

      {selectedUser && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedUser(null);
          }}
          recipientId={selectedUser}
        />
      )}
    </div>
  );
};