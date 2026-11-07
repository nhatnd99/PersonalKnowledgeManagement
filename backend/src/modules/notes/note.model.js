import mongoose from 'mongoose';
import { NOTE_TYPES, CONTENT_FORMATS } from '../../constants/index.js';

const { Schema } = mongoose;

/**
 * Note Schema
 *
 * Represents an individual knowledge item. Notes are the center of the application.
 *
 * Hierarchy pattern: Adjacency List via parentId.
 * - parentId: null indicates a root-level note
 * - parentId references another Note document
 * - Circular references must be checked and prevented at the service layer
 *
 * Relationship independence:
 * - Moving a note to another parent does NOT affect its NoteRelationship connections
 */
const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
      minlength: [1, 'Title cannot be empty'],
    },
    content: {
      type: String,
      default: '',
    },
    contentFormat: {
      type: String,
      enum: {
        values: Object.values(CONTENT_FORMATS),
        message: 'Invalid content format: {VALUE}',
      },
      default: CONTENT_FORMATS.HTML,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(NOTE_TYPES),
        message: 'Invalid note type: {VALUE}',
      },
      default: NOTE_TYPES.NOTE,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    sortOrder: {
      type: Number,
      default: 0,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Full-text search index
noteSchema.index({ title: 'text', content: 'text' }, { weights: { title: 10, content: 1 } });

// List and filtering compound indexes
noteSchema.index({ isArchived: 1, updatedAt: -1 });
noteSchema.index({ isFavorite: 1, updatedAt: -1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
