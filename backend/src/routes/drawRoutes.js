import express from 'express'
import {
  closeDraw,
  createDraw,
  enterCurrentDraw,
  getCurrentDraw,
  getDrawById,
  listDraws,
  runDraw,
  simulateDraw,
} from '../controllers/drawController.js'
import { protect } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/current', getCurrentDraw)
router.get('/', listDraws)
router.get('/:drawId', getDrawById)

router.post('/entries', protect, enterCurrentDraw)
router.post('/', protect, requireAdmin, createDraw)
router.patch('/:drawId/close', protect, requireAdmin, closeDraw)
router.post('/:drawId/simulate', protect, requireAdmin, simulateDraw)
router.post('/:drawId/publish', protect, requireAdmin, runDraw)
router.post('/:drawId/run', protect, requireAdmin, runDraw)

export default router
