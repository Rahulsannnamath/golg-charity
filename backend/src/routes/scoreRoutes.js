import express from 'express'
import {
  createScoreEntry,
  getLeaderboard,
  getMyScoreEntries,
  getScoreEntryById,
  withdrawScoreEntry,
} from '../controllers/scoreController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/leaderboard', getLeaderboard)

router.use(protect)

router.post('/', createScoreEntry)
router.get('/me', getMyScoreEntries)
router.get('/:scoreId', getScoreEntryById)
router.delete('/:scoreId', withdrawScoreEntry)

export default router
