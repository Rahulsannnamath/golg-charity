import mongoose from 'mongoose'
import Draw from '../models/Draw.js'
import ScoreEntry from '../models/ScoreEntry.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'

const MATCH_TYPES = {
  5: '5-match',
  4: '4-match',
  3: '3-match',
}

const POOL_SHARE = {
  fiveMatch: 0.4,
  fourMatch: 0.35,
  threeMatch: 0.25,
}

const PRIZE_POOL_CONTRIBUTION_PERCENT = Number(process.env.PRIZE_POOL_CONTRIBUTION_PERCENT || 50)

const toDrawMonth = (dateInput) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

const getEligibleParticipants = async () => {
  const activeSubscriptions = await Subscription.find({ status: 'active' }).populate('user', 'name email')

  if (!activeSubscriptions.length) {
    return { participants: [], activeSubscriptions: [] }
  }

  const users = await User.find(
    { _id: { $in: activeSubscriptions.map((subscription) => subscription.user._id) } },
    { _id: 1 },
  ).lean()

  const userIdList = users.map((user) => user._id)
  const scores = await ScoreEntry.find({ user: { $in: userIdList } })
    .sort({ playedAt: -1, createdAt: -1 })
    .lean()

  const scoreMap = new Map()

  for (const score of scores) {
    const key = String(score.user)

    if (!scoreMap.has(key)) {
      scoreMap.set(key, [])
    }

    const bucket = scoreMap.get(key)
    if (bucket.length < 5) {
      bucket.push(score)
    }
  }

  const participants = activeSubscriptions
    .map((subscription) => {
      const key = String(subscription.user._id)
      const latestFive = scoreMap.get(key) || []

      if (latestFive.length < 5) {
        return null
      }

      const ticketNumbers = latestFive.map((score) => score.scoreValue)

      return {
        user: subscription.user,
        subscription,
        ticketNumbers,
      }
    })
    .filter(Boolean)

  return { participants, activeSubscriptions }
}

const getPreviousJackpotCarry = async (drawMonth) => {
  const allPrevious = await Draw.find({ drawMonth: { $lt: drawMonth }, status: 'completed' })
    .sort({ drawMonth: -1 })
    .limit(1)
    .lean()

  if (!allPrevious.length) {
    return 0
  }

  return Number(allPrevious[0].prizePool?.jackpotCarriedOut || 0)
}

const calculatePrizePools = ({ activeSubscriptions, jackpotCarriedIn }) => {
  const monthlyBasePool = activeSubscriptions.reduce((sum, subscription) => {
    return sum + (subscription.monthlyAmount * PRIZE_POOL_CONTRIBUTION_PERCENT) / 100
  }, 0)

  const fiveMatchPool = monthlyBasePool * POOL_SHARE.fiveMatch + jackpotCarriedIn
  const fourMatchPool = monthlyBasePool * POOL_SHARE.fourMatch
  const threeMatchPool = monthlyBasePool * POOL_SHARE.threeMatch

  return {
    contributionPercent: PRIZE_POOL_CONTRIBUTION_PERCENT,
    monthlyBasePool: Number(monthlyBasePool.toFixed(2)),
    fiveMatchPool: Number(fiveMatchPool.toFixed(2)),
    fourMatchPool: Number(fourMatchPool.toFixed(2)),
    threeMatchPool: Number(threeMatchPool.toFixed(2)),
    totalPool: Number((fiveMatchPool + fourMatchPool + threeMatchPool).toFixed(2)),
    jackpotCarriedIn: Number(jackpotCarriedIn.toFixed(2)),
  }
}

const randomUniqueNumbers = (count, min, max) => {
  const values = new Set()

  while (values.size < count) {
    const next = Math.floor(Math.random() * (max - min + 1)) + min
    values.add(next)
  }

  return [...values].sort((a, b) => a - b)
}

const weightedSampleWithoutReplacement = (weightMap, count) => {
  const picked = []
  const remaining = new Set([...weightMap.keys()])

  while (picked.length < count && remaining.size > 0) {
    const pool = [...remaining]
    const totalWeight = pool.reduce((sum, value) => sum + Math.max(0.0001, Number(weightMap.get(value) || 0)), 0)

    let threshold = Math.random() * totalWeight
    let chosen = pool[0]

    for (const value of pool) {
      threshold -= Math.max(0.0001, Number(weightMap.get(value) || 0))
      if (threshold <= 0) {
        chosen = value
        break
      }
    }

    picked.push(chosen)
    remaining.delete(chosen)
  }

  return picked.sort((a, b) => a - b)
}

const generateDrawNumbers = ({ mode, bias, participants }) => {
  if (mode === 'algorithmic') {
    const frequency = new Map()

    for (let value = 1; value <= 45; value += 1) {
      frequency.set(value, 0)
    }

    for (const participant of participants) {
      for (const score of participant.ticketNumbers) {
        frequency.set(score, (frequency.get(score) || 0) + 1)
      }
    }

    const maxFrequency = Math.max(...frequency.values())
    const weightMap = new Map()

    for (let value = 1; value <= 45; value += 1) {
      const freq = frequency.get(value) || 0
      const weight = bias === 'least' ? maxFrequency - freq + 1 : freq + 1
      weightMap.set(value, weight)
    }

    return weightedSampleWithoutReplacement(weightMap, 5)
  }

  return randomUniqueNumbers(5, 1, 45)
}

const countMatches = (ticketNumbers, drawNumbers) => {
  const drawSet = new Set(drawNumbers)
  const matched = ticketNumbers.filter((number) => drawSet.has(number))

  return {
    matched,
    matchedCount: matched.length,
  }
}

const evaluateDrawOutcome = ({ participants, drawNumbers, pools }) => {
  const grouped = {
    5: [],
    4: [],
    3: [],
  }

  for (const participant of participants) {
    const { matched, matchedCount } = countMatches(participant.ticketNumbers, drawNumbers)

    if (matchedCount >= 3 && matchedCount <= 5) {
      grouped[matchedCount].push({
        user: participant.user,
        ticketNumbers: participant.ticketNumbers,
        matchedNumbers: matched,
        matchedCount,
      })
    }
  }

  const fiveWinners = grouped[5]
  const fourWinners = grouped[4]
  const threeWinners = grouped[3]

  const fivePrizeEach = fiveWinners.length ? pools.fiveMatchPool / fiveWinners.length : 0
  const fourPrizeEach = fourWinners.length ? pools.fourMatchPool / fourWinners.length : 0
  const threePrizeEach = threeWinners.length ? pools.threeMatchPool / threeWinners.length : 0

  const winners = [
    ...fiveWinners.map((winner) => ({
      matchType: MATCH_TYPES[5],
      user: winner.user._id,
      matchedCount: winner.matchedCount,
      matchedNumbers: winner.matchedNumbers,
      ticketNumbers: winner.ticketNumbers,
      prizeAmount: Number(fivePrizeEach.toFixed(2)),
    })),
    ...fourWinners.map((winner) => ({
      matchType: MATCH_TYPES[4],
      user: winner.user._id,
      matchedCount: winner.matchedCount,
      matchedNumbers: winner.matchedNumbers,
      ticketNumbers: winner.ticketNumbers,
      prizeAmount: Number(fourPrizeEach.toFixed(2)),
    })),
    ...threeWinners.map((winner) => ({
      matchType: MATCH_TYPES[3],
      user: winner.user._id,
      matchedCount: winner.matchedCount,
      matchedNumbers: winner.matchedNumbers,
      ticketNumbers: winner.ticketNumbers,
      prizeAmount: Number(threePrizeEach.toFixed(2)),
    })),
  ]

  return {
    winners,
    winnerCounts: {
      fiveMatch: fiveWinners.length,
      fourMatch: fourWinners.length,
      threeMatch: threeWinners.length,
    },
    jackpotCarriedOut: Number((fiveWinners.length ? 0 : pools.fiveMatchPool).toFixed(2)),
  }
}

const ensureNextMonthlyDraw = async ({ completedDraw, jackpotCarry }) => {
  const [year, month] = completedDraw.drawMonth.split('-').map(Number)
  const nextMonthDate = new Date(Date.UTC(year, month, 1))
  const nextDrawMonth = toDrawMonth(nextMonthDate)

  const existing = await Draw.findOne({ drawMonth: nextDrawMonth })

  if (existing) {
    if (jackpotCarry > 0) {
      existing.prizePool = {
        ...existing.prizePool,
        jackpotCarriedIn: Number(jackpotCarry.toFixed(2)),
      }
      await existing.save()
    }
    return
  }

  const entryCutoff = new Date(Date.UTC(year, month, 25, 23, 59, 59))
  const drawDate = new Date(Date.UTC(year, month, 28, 18, 0, 0))

  await Draw.create({
    name: `Monthly Draw ${nextDrawMonth}`,
    drawMonth: nextDrawMonth,
    entryCutoff,
    drawDate,
    status: 'open',
    createdBy: completedDraw.createdBy,
    prizePool: {
      contributionPercent: PRIZE_POOL_CONTRIBUTION_PERCENT,
      jackpotCarriedIn: Number(jackpotCarry.toFixed(2)),
    },
  })
}

const getCurrentDraw = async (req, res) => {
  const nowMonth = toDrawMonth(new Date())
  const draw = await Draw.findOne({
    drawMonth: { $gte: nowMonth },
    status: { $in: ['open', 'closed', 'simulated'] },
  }).sort({ drawMonth: 1 })

  return res.status(200).json({ draw })
}

const listDraws = async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 50)
  const status = req.query.status

  const query = {}
  if (status) {
    query.status = status
  }

  const draws = await Draw.find(query)
    .sort({ drawDate: -1 })
    .limit(limit)
    .populate('winners.user', 'name email')

  return res.status(200).json({ draws })
}

const createDraw = async (req, res) => {
  const { name, entryCutoff, drawDate } = req.body

  if (!name || !entryCutoff || !drawDate) {
    return res.status(400).json({
      message: 'name, entryCutoff, and drawDate are required',
    })
  }

  const parsedCutoff = new Date(entryCutoff)
  const parsedDrawDate = new Date(drawDate)

  if (Number.isNaN(parsedCutoff.getTime()) || Number.isNaN(parsedDrawDate.getTime())) {
    return res.status(400).json({ message: 'Invalid draw date fields' })
  }

  if (parsedDrawDate <= parsedCutoff) {
    return res.status(400).json({ message: 'drawDate must be after entryCutoff' })
  }

  const drawMonth = toDrawMonth(parsedDrawDate)
  const exists = await Draw.findOne({ drawMonth })

  if (exists) {
    return res.status(400).json({ message: `A monthly draw already exists for ${drawMonth}` })
  }

  const jackpotCarriedIn = await getPreviousJackpotCarry(drawMonth)

  const draw = await Draw.create({
    name,
    drawMonth,
    entryCutoff: parsedCutoff,
    drawDate: parsedDrawDate,
    createdBy: req.user._id,
    prizePool: {
      contributionPercent: PRIZE_POOL_CONTRIBUTION_PERCENT,
      jackpotCarriedIn,
    },
  })

  return res.status(201).json({
    message: 'Draw created successfully',
    draw,
  })
}

const enterCurrentDraw = async (req, res) => {
  return res.status(410).json({
    message: 'Manual draw entry is no longer required. Active subscribers with 5 scores are auto-included.',
  })
}

const closeDraw = async (req, res) => {
  const { drawId } = req.params

  if (!mongoose.Types.ObjectId.isValid(drawId)) {
    return res.status(400).json({ message: 'Invalid draw ID' })
  }

  const draw = await Draw.findById(drawId)

  if (!draw) {
    return res.status(404).json({ message: 'Draw not found' })
  }

  if (draw.status !== 'open') {
    return res.status(400).json({ message: 'Draw is not open' })
  }

  draw.status = 'closed'
  await draw.save()

  return res.status(200).json({
    message: 'Draw closed successfully',
    draw,
  })
}

const simulateDraw = async (req, res) => {
  const { drawId } = req.params
  const mode = req.body?.mode || 'random'
  const bias = req.body?.bias || 'most'

  if (!mongoose.Types.ObjectId.isValid(drawId)) {
    return res.status(400).json({ message: 'Invalid draw ID' })
  }

  if (!['random', 'algorithmic'].includes(mode)) {
    return res.status(400).json({ message: 'mode must be random or algorithmic' })
  }

  if (!['most', 'least'].includes(bias)) {
    return res.status(400).json({ message: 'bias must be most or least' })
  }

  const draw = await Draw.findById(drawId)

  if (!draw) {
    return res.status(404).json({ message: 'Draw not found' })
  }

  if (draw.status === 'completed') {
    return res.status(400).json({ message: 'Draw already completed' })
  }

  const { participants, activeSubscriptions } = await getEligibleParticipants()

  if (!participants.length) {
    return res.status(400).json({ message: 'No eligible participants with 5 recent scores found' })
  }

  const jackpotCarriedIn = Number(draw.prizePool?.jackpotCarriedIn || 0)
  const pools = calculatePrizePools({ activeSubscriptions, jackpotCarriedIn })
  const drawNumbers = generateDrawNumbers({ mode, bias, participants })
  const outcome = evaluateDrawOutcome({ participants, drawNumbers, pools })

  draw.simulation = {
    numbers: drawNumbers,
    mode,
    bias,
    participantCount: participants.length,
    tierWinnerCounts: outcome.winnerCounts,
    simulatedAt: new Date(),
  }
  draw.status = 'simulated'
  await draw.save()

  return res.status(200).json({
    message: 'Simulation completed. Review before publishing.',
    draw,
    simulation: {
      drawNumbers,
      participantCount: participants.length,
      winnerCounts: outcome.winnerCounts,
      pools,
      jackpotIfUnclaimed: outcome.jackpotCarriedOut,
    },
  })
}

const runDraw = async (req, res) => {
  const { drawId } = req.params
  const useSimulation = req.body?.useSimulation !== false

  if (!mongoose.Types.ObjectId.isValid(drawId)) {
    return res.status(400).json({ message: 'Invalid draw ID' })
  }

  const draw = await Draw.findById(drawId)

  if (!draw) {
    return res.status(404).json({ message: 'Draw not found' })
  }

  if (draw.status === 'completed') {
    return res.status(400).json({ message: 'Draw already completed' })
  }

  const mode = req.body?.mode || draw.drawLogic?.mode || draw.simulation?.mode || 'random'
  const bias = req.body?.bias || draw.drawLogic?.bias || draw.simulation?.bias || 'most'

  if (!['random', 'algorithmic'].includes(mode)) {
    return res.status(400).json({ message: 'mode must be random or algorithmic' })
  }

  if (!['most', 'least'].includes(bias)) {
    return res.status(400).json({ message: 'bias must be most or least' })
  }

  const { participants, activeSubscriptions } = await getEligibleParticipants()

  if (!participants.length) {
    return res.status(400).json({ message: 'No eligible participants with 5 recent scores found' })
  }

  const jackpotCarriedIn = Number(draw.prizePool?.jackpotCarriedIn || 0)
  const pools = calculatePrizePools({ activeSubscriptions, jackpotCarriedIn })

  const drawNumbers = useSimulation && draw.simulation?.numbers?.length === 5
    ? draw.simulation.numbers
    : generateDrawNumbers({ mode, bias, participants })

  const outcome = evaluateDrawOutcome({ participants, drawNumbers, pools })

  draw.status = 'completed'
  draw.drawNumbers = drawNumbers
  draw.drawLogic = {
    mode,
    bias,
  }
  draw.winners = outcome.winners
  draw.prizePool = {
    ...pools,
    jackpotCarriedOut: outcome.jackpotCarriedOut,
  }
  await draw.save()

  await ensureNextMonthlyDraw({ completedDraw: draw, jackpotCarry: outcome.jackpotCarriedOut })

  const populatedDraw = await Draw.findById(draw._id)
    .populate('winners.user', 'name email')

  return res.status(200).json({
    message: 'Draw published successfully',
    draw: populatedDraw,
  })
}

const getDrawById = async (req, res) => {
  const { drawId } = req.params

  if (!mongoose.Types.ObjectId.isValid(drawId)) {
    return res.status(400).json({ message: 'Invalid draw ID' })
  }

  const draw = await Draw.findById(drawId).populate('createdBy', 'name email').populate('winners.user', 'name email')

  if (!draw) {
    return res.status(404).json({ message: 'Draw not found' })
  }

  return res.status(200).json({
    draw,
  })
}

export {
  getCurrentDraw,
  listDraws,
  createDraw,
  enterCurrentDraw,
  closeDraw,
  simulateDraw,
  runDraw,
  getDrawById,
}
