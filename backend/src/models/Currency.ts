import mongoose, { Schema, Document } from 'mongoose';

export interface ICurrency extends Document {
  userId: string;
  serverId: string;
  balance: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface CreateTransactionDto {
  userId: string;
  serverId: string;
  amount: number;
  type: 'REWARD' | 'DEDUCTION' | 'TRANSFER';
  description: string;
  relatedTaskId?: string;
  relatedUserId?: string;
}

export interface ITransaction extends Document {
  userId: string;
  serverId: string;
  amount: number;
  type: 'REWARD' | 'DEDUCTION' | 'TRANSFER';
  description: string;
  relatedTaskId?: string;
  relatedUserId?: string;
  timestamp: Date;
}

const CurrencySchema: Schema = new Schema({
  userId: { 
    type: String, 
    required: true 
  },
  serverId: { 
    type: String, 
    required: true 
  },
  balance: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const TransactionSchema: Schema = new Schema({
  userId: { 
    type: String, 
    required: true 
  },
  serverId: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['REWARD', 'DEDUCTION', 'TRANSFER'],
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  relatedTaskId: { 
    type: String 
  },
  relatedUserId: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound indexes for efficient querying
CurrencySchema.index({ userId: 1, serverId: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, serverId: 1, timestamp: -1 });
TransactionSchema.index({ serverId: 1, timestamp: -1 });

// Pre-save middleware to update lastUpdated
CurrencySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export const Currency = mongoose.model<ICurrency>('Currency', CurrencySchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);