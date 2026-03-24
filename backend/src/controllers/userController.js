import mongoose from 'mongoose'
import Charity from '../models/Charity.js'

const getCurrentUser = async (req, res) => {
  return res.status(200).json({ user: req.user })
}

const updateMyCharityPreference = async (req, res) => {
  const { charityPreference } = req.body

  if (!charityPreference) {
    return res.status(400).json({ message: 'charityPreference is required' })
  }

  const charityQuery = mongoose.Types.ObjectId.isValid(charityPreference)
    ? { _id: charityPreference, isActive: true }
    : { name: charityPreference, isActive: true }

  const charity = await Charity.findOne(charityQuery)

  if (!charity) {
    return res.status(400).json({ message: 'Selected charity is not available' })
  }

  req.user.charityPreference = charity.name
  await req.user.save()

  return res.status(200).json({
    message: 'Charity preference updated',
    user: req.user,
  })
}

export { getCurrentUser, updateMyCharityPreference }
