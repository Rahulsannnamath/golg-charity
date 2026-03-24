import mongoose from 'mongoose'

const charitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    totalFunds: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyIncoming: {
      type: Number,
      default: 0,
      min: 0,
    },
    supporters: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

const Charity = mongoose.model('Charity', charitySchema)

export default Charity
