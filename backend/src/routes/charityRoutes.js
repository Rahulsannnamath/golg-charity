import express from 'express'
import { getImpactSummary, getMyCharityImpact } from '../controllers/charityController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/impact', getImpactSummary)
router.get('/impact/me', protect, getMyCharityImpact)

export default router
