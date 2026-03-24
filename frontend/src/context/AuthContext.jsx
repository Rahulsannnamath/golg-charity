import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '../services/platformService'
import {
  clearSession,
  persistSession,
  readStoredToken,
  readStoredUser,
} from '../services/authStorage'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken())
  const [user, setUser] = useState(() => readStoredUser())
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(readStoredToken()))

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsBootstrapping(false)
        return
      }

      if (user) {
        setIsBootstrapping(false)
        return
      }

      try {
        const payload = await getCurrentUser(token)
        setUser(payload.user)
        persistSession({ token, user: payload.user })
      } catch {
        clearSession()
        setToken(null)
        setUser(null)
      } finally {
        setIsBootstrapping(false)
      }
    }

    bootstrap()
  }, [token, user])

  const setSession = ({ token: nextToken, user: nextUser }) => {
    persistSession({ token: nextToken, user: nextUser })
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    clearSession()
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      setSession,
      logout,
      setUser,
    }),
    [token, user, isBootstrapping],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export { AuthProvider, useAuth }
