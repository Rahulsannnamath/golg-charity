import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import { hydrateCharityMetrics } from '../utils/charityMetrics.js'

const PLAN_CONFIG = {
  starter: { monthlyAmount: 15, donationPercentage: 30 },
  fairway: { monthlyAmount: 35, donationPercentage: 40 },
  eagle: { monthlyAmount: 75, donationPercentage: 50 },
}

const getMySubscription = async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id })

  return res.status(200).json({ subscription })
}

const upsertMySubscription = async (req, res) => {
  const { plan, donationPercentage } = req.body

  if (!plan || !PLAN_CONFIG[plan]) {
    return res.status(400).json({
      message: 'Valid plan is required: starter, fairway, eagle',
    })
  }

  const config = PLAN_CONFIG[plan]
  const parsedDonationPercentage =
    donationPercentage === undefined ? config.donationPercentage : Number(donationPercentage)

  if (Number.isNaN(parsedDonationPercentage) || parsedDonationPercentage < 10 || parsedDonationPercentage > 100) {
    return res.status(400).json({
      message: 'donationPercentage must be between 10 and 100',
    })
  }

  const renewalDate = new Date()
  renewalDate.setDate(renewalDate.getDate() + 30)

  const subscription = await Subscription.findOneAndUpdate(
    { user: req.user._id },
    {
      plan,
      monthlyAmount: config.monthlyAmount,
      donationPercentage: parsedDonationPercentage,
      status: 'active',
      startedAt: new Date(),
      renewalDate,
      cancelledAt: null,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  )

  await hydrateCharityMetrics({ userModel: User })

  return res.status(200).json({
    message: 'Subscription updated successfully',
    subscription,
  })
}

const updateMyContribution = async (req, res) => {
  const { donationPercentage } = req.body
  const parsedDonationPercentage = Number(donationPercentage)

  if (Number.isNaN(parsedDonationPercentage) || parsedDonationPercentage < 10 || parsedDonationPercentage > 100) {
    return res.status(400).json({
      message: 'donationPercentage must be between 10 and 100',
    })
  }

  const subscription = await Subscription.findOne({ user: req.user._id })

  if (!subscription) {
    return res.status(404).json({
      message: 'Subscription not found. Choose a plan first.',
    })
  }

  subscription.donationPercentage = parsedDonationPercentage
  await subscription.save()

  await hydrateCharityMetrics({ userModel: User })

  return res.status(200).json({
    message: 'Contribution percentage updated',
    subscription,
  })
}

const cancelMySubscription = async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id })

  if (!subscription) {
    return res.status(404).json({ message: 'Subscription not found' })
  }

  subscription.status = 'cancelled'
  subscription.cancelledAt = new Date()
  await subscription.save()

  return res.status(200).json({
    message: 'Subscription cancelled',
    subscription,
  })
}

export { getMySubscription, upsertMySubscription, updateMyContribution, cancelMySubscription }
