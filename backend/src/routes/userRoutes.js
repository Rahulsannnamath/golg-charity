import express from 'express'
import { getCurrentUser, updateMyCharityPreference } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/me', protect, getCurrentUser)
router.patch('/me/charity', protect, updateMyCharityPreference)

export default router
