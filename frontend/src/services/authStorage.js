const AUTH_TOKEN_KEY = 'golfAuthToken'
const AUTH_USER_KEY = 'golfAuthUser'

const readStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

const readStoredUser = () => {
  const raw = localStorage.getItem(AUTH_USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

const persistSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

const clearSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  readStoredToken,
  readStoredUser,
  persistSession,
  clearSession,
}
