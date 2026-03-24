import express from 'express'
import {
  cancelMySubscription,
  getMySubscription,
  updateMyContribution,
  upsertMySubscription,
} from '../controllers/subscriptionController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/me', getMySubscription)
router.post('/me', upsertMySubscription)
router.patch('/me/contribution', updateMyContribution)
router.patch('/me/cancel', cancelMySubscription)

export default router
