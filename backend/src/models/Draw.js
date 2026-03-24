import mongoose from 'mongoose'

const drawWinnerSchema = new mongoose.Schema(
  {
    matchType: {
      type: String,
      enum: ['5-match', '4-match', '3-match'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchedCount: {
      type: Number,
      required: true,
      min: 3,
      max: 5,
    },
    matchedNumbers: {
      type: [Number],
      default: [],
    },
    ticketNumbers: {
      type: [Number],
      default: [],
    },
    prizeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
)

const simulationSchema = new mongoose.Schema(
  {
    numbers: {
      type: [Number],
      default: [],
    },
    mode: {
      type: String,
      enum: ['random', 'algorithmic'],
    },
    bias: {
      type: String,
      enum: ['most', 'least'],
      default: 'most',
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    tierWinnerCounts: {
      fiveMatch: { type: Number, default: 0 },
      fourMatch: { type: Number, default: 0 },
      threeMatch: { type: Number, default: 0 },
    },
    simulatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const prizePoolSchema = new mongoose.Schema(
  {
    contributionPercent: {
      type: Number,
      default: 50,
    },
    monthlyBasePool: {
      type: Number,
      default: 0,
    },
    totalPool: {
      type: Number,
      default: 0,
    },
    fiveMatchPool: {
      type: Number,
      default: 0,
    },
    fourMatchPool: {
      type: Number,
      default: 0,
    },
    threeMatchPool: {
      type: Number,
      default: 0,
    },
    jackpotCarriedIn: {
      type: Number,
      default: 0,
    },
    jackpotCarriedOut: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
)

const drawSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'simulated', 'completed'],
      default: 'open',
      index: true,
    },
    drawMonth: {
      type: String,
      required: true,
      index: true,
    },
    entryCutoff: {
      type: Date,
      required: true,
      index: true,
    },
    drawDate: {
      type: Date,
      required: true,
    },
    drawNumbers: {
      type: [Number],
      default: [],
    },
    drawLogic: {
      mode: {
        type: String,
        enum: ['random', 'algorithmic'],
      },
      bias: {
        type: String,
        enum: ['most', 'least'],
        default: 'most',
      },
    },
    simulation: {
      type: simulationSchema,
      default: null,
    },
    prizePool: {
      type: prizePoolSchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    winners: {
      type: [drawWinnerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

drawSchema.index({ drawMonth: 1 }, { unique: true })

const Draw = mongoose.model('Draw', drawSchema)

export default Draw
