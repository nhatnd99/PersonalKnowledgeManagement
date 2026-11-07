import mongoose from 'mongoose';
import { RELATIONSHIP_TYPES } from '../../constants/index.js';

const { Schema } = mongoose;

/**
 * NoteRelationship Schema
 *
 * Represents an independent, directional relationship between two notes.
 *
 * Directionality: sourceNoteId -> targetNoteId
 * Independent from parent-child hierarchy.
 */
const noteRelationshipSchema = new Schema(
  {
    sourceNoteId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      required: [true, 'Source note is required'],
      index: true,
    },
    targetNoteId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      required: [true, 'Target note is required'],
      index: true,
    },
    relationshipType: {
      type: String,
      enum: {
        values: Object.values(RELATIONSHIP_TYPES),
        message: 'Invalid relationship type: {VALUE}',
      },
      required: [true, 'Relationship type is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate relationship of same type between the same two notes
noteRelationshipSchema.index(
  { sourceNoteId: 1, targetNoteId: 1, relationshipType: 1 },
  { unique: true }
);

// Prevent self-referential relationships
noteRelationshipSchema.pre('save', function (next) {
  if (this.sourceNoteId.equals(this.targetNoteId)) {
    return next(new Error('A note cannot have a relationship with itself'));
  }
  next();
});

const NoteRelationship = mongoose.model('NoteRelationship', noteRelationshipSchema);

export default NoteRelationship;
