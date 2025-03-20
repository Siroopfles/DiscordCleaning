import { Schema, model, Document, Types } from 'mongoose';

export interface ILeaderboardEntry {
  userId: Types.ObjectId;
  username: string;
  points: number;
  rank: number;
  achievements: number;
  streak: number;
}

export interface ILeaderboardSnapshot extends Document {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  entries: ILeaderboardEntry[];
  startDate: Date;
  endDate: Date;
  totalParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaderboardEntrySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  rank: {
    type: Number,
    required: true,
    min: 1
  },
  achievements: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  streak: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, { _id: false });

const LeaderboardSnapshotSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME']
  },
  entries: [LeaderboardEntrySchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalParticipants: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'leaderboard_snapshots'
});

// Indexen voor snelle queries
LeaderboardSnapshotSchema.index({ type: 1, startDate: -1 });
LeaderboardSnapshotSchema.index({ type: 1, endDate: -1 });

// Samengestelde index voor tijdsperiode queries
LeaderboardSnapshotSchema.index({ 
  type: 1, 
  startDate: -1, 
  endDate: -1 
});

// Index voor entries.userId om specifieke gebruikers te vinden
LeaderboardSnapshotSchema.index({ 'entries.userId': 1 });

export const LeaderboardSnapshot = model<ILeaderboardSnapshot>('LeaderboardSnapshot', LeaderboardSnapshotSchema);