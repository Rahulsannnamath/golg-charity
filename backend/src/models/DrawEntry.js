import mongoose from 'mongoose'

const drawEntrySchema = new mongoose.Schema(
  {
    draw: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Draw',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scoreEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScoreEntry',
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      required: true,
      index: true,
    },
    tickets: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'winner'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

drawEntrySchema.index({ draw: 1, user: 1, createdAt: -1 })

const DrawEntry = mongoose.model('DrawEntry', drawEntrySchema)

export default DrawEntry
