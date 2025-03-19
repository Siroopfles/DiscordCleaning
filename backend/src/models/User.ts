import { Schema, model, Document } from 'mongoose';
import { IUser } from '../types/models';

export interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>({
  discord_id: {
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries by discord_id
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark'],
    },
    language: {
      type: String,
      default: 'nl',
      enum: ['nl', 'en'],
    },
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  versionKey: false, // Disable the version key (__v)
});

// Create indexes for common queries
userSchema.index({ username: 1 });

export const User = model<UserDocument>('User', userSchema);