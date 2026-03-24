const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  'http://localhost:5000'

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    const rawText = await response.text()
    const preview = rawText.slice(0, 120)
    throw new Error(
      `API returned non-JSON response. Check VITE_API_BASE_URL and backend server. Response starts with: ${preview}`,
    )
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

const register = async ({ name, email, password, charityPreference }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, charityPreference }),
  })

  return handleResponse(response)
}

const login = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  return handleResponse(response)
}

export { register, login, API_BASE_URL }
