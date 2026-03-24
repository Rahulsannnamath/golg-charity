import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const registerUser = async (req, res) => {
  const { name, email, password, charityPreference } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' })
  }

  const userExists = await User.findOne({ email: email.toLowerCase() })

  if (userExists) {
    return res.status(400).json({ message: 'User already exists with this email' })
  }

  const user = await User.create({
    name,
    email,
    password,
    charityPreference,
  })

  return res.status(201).json({
    message: 'Account created successfully',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      charityPreference: user.charityPreference,
      role: user.role,
    },
  })
}

const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  return res.status(200).json({
    message: 'Login successful',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      charityPreference: user.charityPreference,
      role: user.role,
    },
  })
}

export { registerUser, loginUser }
