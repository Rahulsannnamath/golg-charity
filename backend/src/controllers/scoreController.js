import mongoose from 'mongoose'
import DrawEntry from '../models/DrawEntry.js'
import ScoreEntry from '../models/ScoreEntry.js'

const getTier = (scoreValue) => {
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

const createScoreEntry = async (req, res) => {
  const { scoreValue, playedAt } = req.body
  const parsedScoreValue = Number(scoreValue)
  const parsedPlayedAt = new Date(playedAt)

  if (Number.isNaN(parsedScoreValue)) {
    return res.status(400).json({
      message: 'scoreValue is required',
    })
  }

  if (parsedScoreValue < 1 || parsedScoreValue > 45) {
    return res.status(400).json({
      message: 'scoreValue must be between 1 and 45',
    })
  }

  if (!playedAt || Number.isNaN(parsedPlayedAt.getTime())) {
    return res.status(400).json({
      message: 'playedAt date is required',
    })
  }

  const points = parsedScoreValue
  const tier = getTier(parsedScoreValue)
  const par = 45
  const scoreToPar = par - parsedScoreValue

  const scoreEntry = await ScoreEntry.create({
    user: req.user._id,
    scoreValue: parsedScoreValue,
    courseName: 'Quick Score Entry',
    holes: 18,
    par,
    strokes: parsedScoreValue,
    handicap: 0,
    netScore: parsedScoreValue,
    scoreToPar,
    points,
    tier,
    playedAt: parsedPlayedAt,
  })

  const allUserScores = await ScoreEntry.find({ user: req.user._id })
    .sort({ playedAt: 1, createdAt: 1 })

  while (allUserScores.length > 5) {
    const oldestScore = allUserScores.shift()

    await DrawEntry.deleteMany({ scoreEntry: oldestScore._id })
    await ScoreEntry.deleteOne({ _id: oldestScore._id })
  }

  return res.status(201).json({
    message: 'Score submitted successfully',
    scoreEntry,
  })
}

const getMyScoreEntries = async (req, res) => {
  const scoreEntries = await ScoreEntry.find({ user: req.user._id }).sort({
    playedAt: -1,
    createdAt: -1,
  })

  return res.status(200).json({ scoreEntries })
}

const getLeaderboard = async (req, res) => {
  const days = Number(req.query.days || 30)
  const since = new Date()
  since.setDate(since.getDate() - days)

  const leaderboard = await ScoreEntry.aggregate([
    {
      $match: {
        playedAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$user',
        rounds: { $sum: 1 },
        avgPoints: { $avg: '$points' },
        avgScoreToPar: { $avg: '$scoreToPar' },
        bestTierWeight: {
          $max: {
            $switch: {
              branches: [
                { case: { $eq: ['$tier', 'platinum'] }, then: 4 },
                { case: { $eq: ['$tier', 'gold'] }, then: 3 },
                { case: { $eq: ['$tier', 'silver'] }, then: 2 },
              ],
              default: 1,
            },
          },
        },
      },
    },
    {
      $sort: {
        avgPoints: -1,
        avgScoreToPar: 1,
      },
    },
    {
      $limit: 20,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        rounds: 1,
        avgPoints: { $round: ['$avgPoints', 2] },
        avgScoreToPar: { $round: ['$avgScoreToPar', 2] },
        bestTierWeight: 1,
      },
    },
  ])

  return res.status(200).json({
    days,
    leaderboard,
  })
}

const withdrawScoreEntry = async (req, res) => {
  const { scoreId } = req.params

  if (!mongoose.Types.ObjectId.isValid(scoreId)) {
    return res.status(400).json({ message: 'Invalid score ID' })
  }

  const scoreEntry = await ScoreEntry.findOne({
    _id: scoreId,
    user: req.user._id,
  })

  if (!scoreEntry) {
    return res.status(404).json({ message: 'Score entry not found' })
  }

  await DrawEntry.deleteMany({ scoreEntry: scoreEntry._id })
  await ScoreEntry.deleteOne({ _id: scoreEntry._id })

  return res.status(200).json({
    message: 'Score withdrawn successfully',
  })
}

const getScoreEntryById = async (req, res) => {
  const { scoreId } = req.params

  if (!mongoose.Types.ObjectId.isValid(scoreId)) {
    return res.status(400).json({ message: 'Invalid score ID' })
  }

  const scoreEntry = await ScoreEntry.findOne({
    _id: scoreId,
    user: req.user._id,
  })

  if (!scoreEntry) {
    return res.status(404).json({ message: 'Score entry not found' })
  }

  return res.status(200).json({ scoreEntry })
}

export {
  createScoreEntry,
  getMyScoreEntries,
  getLeaderboard,
  getScoreEntryById,
  withdrawScoreEntry,
  getTier,
}
