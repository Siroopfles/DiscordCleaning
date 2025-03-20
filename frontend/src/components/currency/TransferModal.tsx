import React, { useState } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  recipientId = ''
}) => {
  const { transferCurrency, balance } = useCurrency();
  const [amount, setAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>(recipientId);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || amount <= 0 || amount > balance) return;

    setIsSubmitting(true);
    try {
      await transferCurrency(recipient, amount, description);
      onClose();
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Credits Overmaken</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Ontvanger ID
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Gebruikers ID"
              required
              disabled={!!recipientId}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Aantal Credits
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value)))}
              className="w-full p-2 border rounded"
              placeholder="0"
              required
              min="1"
              max={balance}
            />
            <p className="text-sm text-gray-500 mt-1">
              Beschikbaar: {balance} credits
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Beschrijving
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Optionele beschrijving"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isSubmitting || amount <= 0 || amount > balance || !recipient}
            >
              {isSubmitting ? 'Bezig...' : 'Overmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};