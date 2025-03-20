import React, { useCallback, useRef } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface TransactionRowProps {
  type: string;
  amount: number;
  description: string;
  timestamp: string;
  relatedUser?: string;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  type,
  amount,
  description,
  timestamp,
  relatedUser
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'REWARD':
        return 'text-green-600';
      case 'DEDUCTION':
        return 'text-red-600';
      case 'TRANSFER':
        return amount > 0 ? 'text-green-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'REWARD':
        return '🎁';
      case 'DEDUCTION':
        return '💸';
      case 'TRANSFER':
        return amount > 0 ? '📥' : '📤';
      default:
        return '💰';
    }
  };

  return (
    <div className="border-b border-gray-200 p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <span className="text-xl">{getTypeIcon()}</span>
          <div>
            <p className="font-medium">
              {type}{relatedUser ? ` ${amount > 0 ? 'van' : 'naar'} ${relatedUser}` : ''}
            </p>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400">
              {new Date(timestamp).toLocaleString('nl-NL')}
            </p>
          </div>
        </div>
        <span className={`font-semibold ${getTypeColor()}`}>
          {amount > 0 ? '+' : ''}{amount} credits
        </span>
      </div>
    </div>
  );
};

export const TransactionHistory: React.FC = () => {
  const { transactions, loadMoreTransactions, isLoading } = useCurrency();
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && !isLoading) {
      loadMoreTransactions();
    }
  }, [loadMoreTransactions, isLoading]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nog geen transacties om weer te geven
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold p-4 border-b border-gray-200">
        Transactiegeschiedenis
      </h2>
      
      <div className="divide-y divide-gray-200">
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            type={tx.type}
            amount={tx.amount}
            description={tx.description}
            timestamp={tx.timestamp}
            relatedUser={tx.relatedUserId}
          />
        ))}
      </div>

      <div ref={observerTarget} className="p-4 text-center">
        {isLoading && (
          <div className="flex justify-center items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-gray-500">Laden...</span>
          </div>
        )}
      </div>
    </div>
  );
};