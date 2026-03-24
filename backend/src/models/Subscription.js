import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'fairway', 'eagle'],
      default: 'starter',
    },
    monthlyAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    donationPercentage: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    renewalDate: {
      type: Date,
      required: true,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription
