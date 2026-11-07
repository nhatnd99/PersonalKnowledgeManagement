import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Tag Schema
 *
 * Reusable tags for categorizing and filtering notes.
 */
const tagSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Tag name cannot exceed 100 characters'],
      minlength: [1, 'Tag name cannot be empty'],
      set: (v) => v.toLowerCase().trim(),
    },
    color: {
      type: String,
      default: null,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (#RRGGBB)'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
