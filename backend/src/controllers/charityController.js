import Charity from '../models/Charity.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import { hydrateCharityMetrics } from '../utils/charityMetrics.js'

const getImpactSummary = async (req, res) => {
  await hydrateCharityMetrics({ userModel: User })

  const subscriptions = await Subscription.find({})

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active')

  const monthlyRecurring = activeSubscriptions.reduce(
    (sum, subscription) => sum + subscription.monthlyAmount,
    0,
  )

  const monthlyCharityContribution = activeSubscriptions.reduce(
    (sum, subscription) => sum + (subscription.monthlyAmount * subscription.donationPercentage) / 100,
    0,
  )

  const lifetimeContributionEstimate = subscriptions.reduce((sum, subscription) => {
    const endDate = subscription.cancelledAt || new Date()
    const months = Math.max(
      1,
      Math.ceil((endDate.getTime() - subscription.startedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    )

    const donationPerMonth = (subscription.monthlyAmount * subscription.donationPercentage) / 100

    return sum + donationPerMonth * months
  }, 0)

  const charityBreakdown = await User.aggregate([
    {
      $group: {
        _id: '$charityPreference',
        members: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        charityPreference: '$_id',
        members: 1,
      },
    },
    {
      $sort: {
        members: -1,
      },
    },
  ])

  const charities = await Charity.find({ isActive: true })
    .sort({ totalFunds: -1, monthlyIncoming: -1 })
    .lean()

  return res.status(200).json({
    summary: {
      membersWithSubscription: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRecurring,
      monthlyCharityContribution: Number(monthlyCharityContribution.toFixed(2)),
      lifetimeContributionEstimate: Number(lifetimeContributionEstimate.toFixed(2)),
    },
    charityBreakdown,
    charities,
  })
}

const getMyCharityImpact = async (req, res) => {
  await hydrateCharityMetrics({ userModel: User })

  const subscription = await Subscription.findOne({ user: req.user._id, status: 'active' })
  const charity = await Charity.findOne({ name: req.user.charityPreference }).lean()

  const monthlyContribution = subscription
    ? Number(((subscription.monthlyAmount * subscription.donationPercentage) / 100).toFixed(2))
    : 0

  return res.status(200).json({
    userImpact: {
      charityPreference: req.user.charityPreference,
      donationPercentage: subscription?.donationPercentage || 10,
      monthlyContribution,
      plan: subscription?.plan || null,
      monthlyAmount: subscription?.monthlyAmount || 0,
      status: subscription?.status || 'inactive',
    },
    charity,
  })
}

export { getImpactSummary, getMyCharityImpact }
