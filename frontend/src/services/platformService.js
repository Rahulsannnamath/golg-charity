import { API_BASE_URL } from './authService'

const requestJson = async (path, options = {}) => {
  const { method = 'GET', body, token } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    const rawText = await response.text()
    throw new Error(`Non-JSON API response: ${rawText.slice(0, 120)}`)
  }

  const payload = await response.json()

  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed')
    error.status = response.status
    throw error
  }

  return payload
}

const getCurrentUser = (token) => requestJson('/api/users/me', { token })
const getMySubscription = (token) => requestJson('/api/subscriptions/me', { token })
const setMySubscription = (token, { plan, donationPercentage }) =>
  requestJson('/api/subscriptions/me', {
    method: 'POST',
    token,
    body: { plan, donationPercentage },
  })
const updateMyContribution = (token, donationPercentage) =>
  requestJson('/api/subscriptions/me/contribution', {
    method: 'PATCH',
    token,
    body: { donationPercentage },
  })
const cancelMySubscription = (token) =>
  requestJson('/api/subscriptions/me/cancel', {
    method: 'PATCH',
    token,
  })

const createScore = (token, data) =>
  requestJson('/api/scores', {
    method: 'POST',
    token,
    body: data,
  })

const withdrawScore = (token, scoreId) =>
  requestJson(`/api/scores/${scoreId}`, {
    method: 'DELETE',
    token,
  })

const getMyScores = (token) => requestJson('/api/scores/me', { token })
const getLeaderboard = (days = 30) => requestJson(`/api/scores/leaderboard?days=${days}`)

const updateMyCharityPreference = (token, charityPreference) =>
  requestJson('/api/users/me/charity', {
    method: 'PATCH',
    token,
    body: { charityPreference },
  })

const getCurrentDraw = () => requestJson('/api/draws/current')
const getDraws = ({ status, limit = 10 } = {}) => {
  const query = new URLSearchParams()

  if (status) {
    query.set('status', status)
  }

  query.set('limit', String(limit))

  return requestJson(`/api/draws?${query.toString()}`)
}

const simulateDraw = (token, drawId, { mode = 'random', bias = 'most' } = {}) =>
  requestJson(`/api/draws/${drawId}/simulate`, {
    method: 'POST',
    token,
    body: { mode, bias },
  })

const publishDraw = (token, drawId, { mode = 'random', bias = 'most', useSimulation = true } = {}) =>
  requestJson(`/api/draws/${drawId}/publish`, {
    method: 'POST',
    token,
    body: { mode, bias, useSimulation },
  })

const enterDraw = (token, scoreEntryId) =>
  requestJson('/api/draws/entries', {
    method: 'POST',
    token,
    body: { scoreEntryId },
  })

const getImpactSummary = () => requestJson('/api/charity/impact')
const getMyCharityImpact = (token) => requestJson('/api/charity/impact/me', { token })

export {
  getCurrentUser,
  getMySubscription,
  setMySubscription,
  updateMyContribution,
  cancelMySubscription,
  createScore,
  withdrawScore,
  getMyScores,
  getLeaderboard,
  updateMyCharityPreference,
  getCurrentDraw,
  getDraws,
  simulateDraw,
  publishDraw,
  enterDraw,
  getImpactSummary,
  getMyCharityImpact,
}
