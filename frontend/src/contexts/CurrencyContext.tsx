import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

// Types
interface Currency {
  userId: string;
  serverId: string;
  balance: number;
}

interface Transaction {
  id: string;
  userId: string;
  serverId: string;
  amount: number;
  type: 'REWARD' | 'DEDUCTION' | 'TRANSFER';
  description: string;
  timestamp: string;
  relatedUserId?: string;
  relatedTaskId?: string;
}

interface CurrencyState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
}

interface CurrencyContextType extends CurrencyState {
  refreshBalance: () => Promise<void>;
  transferCurrency: (toUserId: string, amount: number, description?: string) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
}

// Context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Actions
type CurrencyAction =
  | { type: 'SET_BALANCE'; payload: number }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null };

// Reducer
const currencyReducer = (state: CurrencyState, action: CurrencyAction): CurrencyState => {
  switch (action.type) {
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { 
        ...state, 
        transactions: [action.payload, ...state.transactions]
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Provider
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(currencyReducer, {
    balance: 0,
    transactions: [],
    isLoading: false,
    error: null
  });

  // WebSocket setup voor real-time updates
  const { lastMessage } = useWebSocket('/currency');

  useEffect(() => {
    if (lastMessage?.type === 'CURRENCY_UPDATE') {
      const { balance, transaction } = lastMessage.data;
      dispatch({ type: 'SET_BALANCE', payload: balance });
      if (transaction) {
        dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      }
    }
  }, [lastMessage]);

  // Query voor initiële data
  const { data: balanceData } = useQuery({
    queryKey: ['currency', 'balance'],
    queryFn: () => api.get('/currency/balance').then(res => res.data),
    onSuccess: (data) => {
      dispatch({ type: 'SET_BALANCE', payload: data.balance });
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_ERROR', payload: error });
      toast.error('Fout bij het ophalen van saldo');
    }
  });

  // Mutations
  const transferMutation = useMutation({
    mutationFn: (data: { toUserId: string; amount: number; description?: string }) =>
      api.post('/currency/transfer', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currency', 'balance']);
      toast.success('Transfer succesvol');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Transfer mislukt');
    }
  });

  const refreshBalance = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.get('/currency/balance');
      dispatch({ type: 'SET_BALANCE', payload: response.data.balance });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      toast.error('Fout bij het vernieuwen van saldo');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const transferCurrency = async (toUserId: string, amount: number, description?: string) => {
    await transferMutation.mutateAsync({ toUserId, amount, description });
  };

  const loadMoreTransactions = async () => {
    const page = Math.ceil(state.transactions.length / 10) + 1;
    try {
      const response = await api.get(`/currency/transactions?page=${page}`);
      const newTransactions = [...state.transactions, ...response.data.transactions];
      dispatch({ type: 'SET_TRANSACTIONS', payload: newTransactions });
    } catch (error) {
      toast.error('Fout bij het laden van meer transacties');
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        ...state,
        refreshBalance,
        transferCurrency,
        loadMoreTransactions
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};