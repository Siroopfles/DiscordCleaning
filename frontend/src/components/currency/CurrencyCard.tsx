import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

export const CurrencyCard: React.FC = () => {
  const { balance, isLoading, refreshBalance } = useCurrency();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">💰 Credits</h2>
        <button
          onClick={refreshBalance}
          disabled={isLoading}
          className="text-blue-500 hover:text-blue-700"
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
      
      <div className="text-3xl font-bold text-gray-800">
        {balance} <span className="text-sm text-gray-500">credits</span>
      </div>
    </div>
  );
};