import Charity from '../models/Charity.js'
import Subscription from '../models/Subscription.js'

const hydrateCharityMetrics = async ({ userModel }) => {
  const activeSubscriptions = await Subscription.find({ status: 'active' })

  if (!activeSubscriptions.length) {
    await Charity.updateMany({}, { monthlyIncoming: 0, supporters: 0 })
    return
  }

  const userIds = activeSubscriptions.map((subscription) => subscription.user)
  const users = await userModel.find({ _id: { $in: userIds } }, { charityPreference: 1 }).lean()

  const userCharityMap = new Map(users.map((user) => [String(user._id), user.charityPreference]))

  const charityTotals = new Map()

  for (const subscription of activeSubscriptions) {
    const charityName = userCharityMap.get(String(subscription.user)) || 'Unassigned Charity'
    const monthlyContribution = (subscription.monthlyAmount * subscription.donationPercentage) / 100

    if (!charityTotals.has(charityName)) {
      charityTotals.set(charityName, { monthlyIncoming: 0, supporters: 0 })
    }

    const accumulator = charityTotals.get(charityName)
    accumulator.monthlyIncoming += monthlyContribution
    accumulator.supporters += 1
  }

  for (const [charityName, totals] of charityTotals.entries()) {
    await Charity.findOneAndUpdate(
      { name: charityName },
      {
        $set: {
          monthlyIncoming: Number(totals.monthlyIncoming.toFixed(2)),
          supporters: totals.supporters,
        },
      },
      { new: true, upsert: true },
    )
  }

  const knownCharities = [...charityTotals.keys()]
  await Charity.updateMany(
    { name: { $nin: knownCharities } },
    { $set: { monthlyIncoming: 0, supporters: 0 } },
  )
}

export { hydrateCharityMetrics }
