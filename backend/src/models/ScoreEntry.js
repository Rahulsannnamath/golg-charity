import mongoose from 'mongoose'

const scoreEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scoreValue: {
      type: Number,
      required: true,
      min: 1,
      max: 45,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    holes: {
      type: Number,
      enum: [9, 18],
      required: true,
    },
    par: {
      type: Number,
      required: true,
    },
    strokes: {
      type: Number,
      required: true,
      min: 1,
    },
    handicap: {
      type: Number,
      required: true,
      min: 0,
      max: 54,
    },
    netScore: {
      type: Number,
      required: true,
    },
    scoreToPar: {
      type: Number,
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      required: true,
      index: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

const ScoreEntry = mongoose.model('ScoreEntry', scoreEntrySchema)

export default ScoreEntry
