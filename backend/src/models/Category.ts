import { Schema, model, Document } from 'mongoose';
import { ICategory } from '../types/models';

export interface CategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<CategoryDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    unique: true,
    index: true, // Index for name lookups
  },
  color: {
    type: String,
    required: true,
    validate: {
      validator: (value: string) => {
        // Validate hex color code (e.g., #FF0000)
        return /^#[0-9A-F]{6}$/i.test(value);
      },
      message: 'Color must be a valid hex color code (e.g., #FF0000)',
    },
  },
  created_by: {
    type: String,
    required: true,
    ref: 'User',
    index: true, // Index for user-based queries
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  versionKey: false, // Disable the version key (__v)
});

// Ensure case-insensitive unique category names per server
categorySchema.index({ 
  name: 1, 
  created_by: 1 
}, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

export const Category = model<CategoryDocument>('Category', categorySchema);