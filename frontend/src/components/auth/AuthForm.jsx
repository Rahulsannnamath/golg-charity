import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login, register } from '../../services/authService'

function AuthForm({ mode }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    charityPreference: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = isLogin
        ? await login({ email: formData.email, password: formData.password })
        : await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            charityPreference: formData.charityPreference,
          })

      setSession({ token: payload.token, user: payload.user })

      setSuccessMessage(isLogin ? 'Login successful! Redirecting...' : 'Signup successful! Redirecting...')

      const nextPath = location.state?.from?.pathname || '/dashboard'

      setTimeout(() => {
        navigate(nextPath, { replace: true })
      }, 700)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p>{isLogin ? 'Sign in to continue your dashboard journey.' : 'Start your subscription and join the monthly draws.'}</p>

      {errorMessage && <p className="auth-feedback auth-error">{errorMessage}</p>}
      {successMessage && <p className="auth-feedback auth-success">{successMessage}</p>}

      {!isLogin && (
        <label>
          Full Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Rahul S."
            required
          />
        </label>
      )}

      <label>
        Email Address
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter secure password"
          required
        />
      </label>

      {!isLogin && (
        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
          />
        </label>
      )}

      {isLogin && (
        <div className="auth-inline-row">
          <label className="checkbox-row">
            <input type="checkbox" />
            Remember me
          </label>
          <button className="text-btn" type="button">Forgot password?</button>
        </div>
      )}

      {!isLogin && (
        <label>
          Charity Preference
          <select
            name="charityPreference"
            value={formData.charityPreference}
            onChange={handleChange}
          >
            <option value="" disabled>Select your charity</option>
            <option>Youth Sports for Change</option>
            <option>Greens for Good Foundation</option>
            <option>Community Caddie Network</option>
          </select>
        </label>
      )}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait...' : isLogin ? 'Sign In Securely' : 'Create My Account'}
      </button>
    </form>
  )
}

export default AuthForm
