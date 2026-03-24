import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import Charity from '../models/Charity.js'
import Draw from '../models/Draw.js'
import ScoreEntry from '../models/ScoreEntry.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import { hydrateCharityMetrics } from '../utils/charityMetrics.js'

dotenv.config()

const charitiesSeed = [
  {
    name: 'Youth Sports for Change',
    description: 'Supports junior golf access and equipment for underserved communities.',
    totalFunds: 125000,
  },
  {
    name: 'Greens for Good Foundation',
    description: 'Funds sustainable golf course maintenance and eco initiatives.',
    totalFunds: 98000,
  },
  {
    name: 'Community Caddie Network',
    description: 'Creates income and training opportunities for local caddies.',
    totalFunds: 110500,
  },
  {
    name: 'Fairway Education Trust',
    description: 'Scholarships for student athletes and golf education programs.',
    totalFunds: 134800,
  },
  {
    name: 'Women in Golf Initiative',
    description: 'Expands women participation with coaching and tournament grants.',
    totalFunds: 105600,
  },
]

const usersSeed = [
  {
    name: 'Admin Golfer',
    email: 'admin@golfcharity.com',
    password: 'secret123',
    role: 'admin',
    charityPreference: 'Youth Sports for Change',
  },
  {
    name: 'Aditi Rao',
    email: 'aditi@golfcharity.com',
    password: 'secret123',
    role: 'subscriber',
    charityPreference: 'Women in Golf Initiative',
  },
  {
    name: 'Vikram Shetty',
    email: 'vikram@golfcharity.com',
    password: 'secret123',
    role: 'subscriber',
    charityPreference: 'Greens for Good Foundation',
  },
  {
    name: 'Noah Daniel',
    email: 'noah@golfcharity.com',
    password: 'secret123',
    role: 'subscriber',
    charityPreference: 'Community Caddie Network',
  },
  {
    name: 'Mia Carter',
    email: 'mia@golfcharity.com',
    password: 'secret123',
    role: 'subscriber',
    charityPreference: 'Fairway Education Trust',
  },
  {
    name: 'Liam Singh',
    email: 'liam@golfcharity.com',
    password: 'secret123',
    role: 'subscriber',
    charityPreference: 'Youth Sports for Change',
  },
]

const plans = [
  { plan: 'starter', monthlyAmount: 15 },
  { plan: 'fairway', monthlyAmount: 35 },
  { plan: 'eagle', monthlyAmount: 75 },
]

const tierFromScoreValue = (scoreValue) => {
  if (scoreValue >= 36) {
    return 'platinum'
  }

  if (scoreValue >= 26) {
    return 'gold'
  }

  if (scoreValue >= 16) {
    return 'silver'
  }

  return 'bronze'
}

const seedCharities = async () => {
  for (const charity of charitiesSeed) {
    await Charity.findOneAndUpdate(
      { name: charity.name },
      { $setOnInsert: charity },
      { upsert: true, new: true },
    )
  }
}

const seedUsers = async () => {
  const createdUsers = []

  for (const userData of usersSeed) {
    let user = await User.findOne({ email: userData.email })

    if (!user) {
      user = await User.create(userData)
    }

    createdUsers.push(user)
  }

  return createdUsers
}

const seedSubscriptions = async (users) => {
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index]
    const planConfig = plans[index % plans.length]
    const donationPercentage = 10 + ((index + 1) % 5) * 5

    const renewalDate = new Date()
    renewalDate.setDate(renewalDate.getDate() + 30)

    await Subscription.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        plan: planConfig.plan,
        monthlyAmount: planConfig.monthlyAmount,
        donationPercentage,
        status: 'active',
        startedAt: new Date(Date.now() - (index + 1) * 5 * 24 * 60 * 60 * 1000),
        renewalDate,
      },
      { upsert: true, new: true },
    )
  }
}

const ensureScoreEntries = async (users) => {
  const allEntries = []

  for (let index = 0; index < users.length; index += 1) {
    const user = users[index]
    const existing = await ScoreEntry.find({ user: user._id }).limit(5)

    if (existing.length >= 3) {
      allEntries.push(...existing)
      continue
    }

    const missingCount = 3 - existing.length

    for (let round = 0; round < missingCount; round += 1) {
      const scoreValue = Math.min(45, 12 + index * 4 + round * 3)
      const par = 45
      const scoreToPar = par - scoreValue
      const points = scoreValue

      const scoreEntry = await ScoreEntry.create({
        user: user._id,
        scoreValue,
        courseName: `Lakeside Championship ${round + 1}`,
        holes: 18,
        par,
        strokes: scoreValue,
        handicap: 0,
        netScore: scoreValue,
        scoreToPar,
        points,
        tier: tierFromScoreValue(scoreValue),
        playedAt: new Date(Date.now() - (index + round + 1) * 24 * 60 * 60 * 1000),
      })

      allEntries.push(scoreEntry)
    }

    allEntries.push(...existing)
  }

  return allEntries
}

const seedDraws = async (users) => {
  const adminUser = users.find((user) => user.role === 'admin') || users[0]

  const completedDrawName = 'Monthly Draw 2026-02'
  let completedDraw = await Draw.findOne({ name: completedDrawName })

  if (!completedDraw) {
    completedDraw = await Draw.create({
      name: completedDrawName,
      drawMonth: '2026-02',
      status: 'completed',
      entryCutoff: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      drawDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      drawNumbers: [5, 12, 19, 27, 41],
      drawLogic: {
        mode: 'random',
        bias: 'most',
      },
      prizePool: {
        contributionPercent: 50,
        monthlyBasePool: 1000,
        totalPool: 1000,
        fiveMatchPool: 400,
        fourMatchPool: 350,
        threeMatchPool: 250,
        jackpotCarriedIn: 0,
        jackpotCarriedOut: 400,
      },
      createdBy: adminUser._id,
      winners: [],
    })
  }

  if (!completedDraw.winners.length) {
    completedDraw.winners = [
      {
        matchType: '4-match',
        user: users[1]?._id || users[0]._id,
        matchedCount: 4,
        matchedNumbers: [5, 12, 19, 27],
        ticketNumbers: [5, 12, 19, 27, 30],
        prizeAmount: 350,
      },
      {
        matchType: '3-match',
        user: users[2]?._id || users[0]._id,
        matchedCount: 3,
        matchedNumbers: [12, 19, 41],
        ticketNumbers: [3, 12, 19, 35, 41],
        prizeAmount: 250,
      },
    ]
    await completedDraw.save()
  }

  const openDrawName = 'Monthly Draw 2026-03'
  const openDraw = await Draw.findOne({ name: openDrawName })

  if (!openDraw) {
    await Draw.create({
      name: openDrawName,
      drawMonth: '2026-03',
      status: 'open',
      entryCutoff: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      drawDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      prizePool: {
        contributionPercent: 50,
        jackpotCarriedIn: 400,
      },
      createdBy: adminUser._id,
      winners: [],
    })
  }
}

const seed = async () => {
  await connectDB()

  await seedCharities()
  const users = await seedUsers()
  await seedSubscriptions(users)
  await ensureScoreEntries(users)
  await seedDraws(users)
  await hydrateCharityMetrics({ userModel: User })

  console.log('Seed completed successfully')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed', error)
  process.exit(1)
})
