import { useEffect, useState } from 'react'
import MemberLayout from '../components/dashboard/MemberLayout'
import { useAuth } from '../context/AuthContext'
import {
  createScore,
  getCurrentDraw,
  getMyScores,
  withdrawScore,
} from '../services/platformService'

const initialForm = {
  scoreValue: '',
  playedAt: '',
}

function ScoresPage() {
  const { token } = useAuth()
  const [formData, setFormData] = useState(initialForm)
  const [scoreEntries, setScoreEntries] = useState([])
  const [currentDraw, setCurrentDraw] = useState(null)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [myScoresPayload, drawPayload] = await Promise.all([
        getMyScores(token),
        getCurrentDraw(),
      ])

      setScoreEntries(myScoresPayload.scoreEntries)
      setCurrentDraw(drawPayload.draw)
    } catch (error) {
      setNotice(error.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)

    try {
      await createScore(token, {
        scoreValue: Number(formData.scoreValue),
        playedAt: formData.playedAt,
      })

      setFormData(initialForm)
      setNotice('Score submitted successfully')
      await loadData()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdrawScore = async (scoreId) => {
    setNotice('')

    try {
      await withdrawScore(token, scoreId)
      setNotice('Score withdrawn successfully')
      await loadData()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <MemberLayout
      title="Add Score / Withdraw"
      subtitle="Submit one simple score (1 to 45), keep only your latest 5, and withdraw any score when needed."
    >
      {notice && <p className="member-banner">{notice}</p>}

      <section className="member-panel split">
        <article>
          <h2>Submit Score</h2>
          <form className="score-form" onSubmit={handleSubmit}>
            <label>
              Score Value (1-45)
              <input
                name="scoreValue"
                type="number"
                min="1"
                max="45"
                value={formData.scoreValue}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Score Date
              <input
                name="playedAt"
                type="date"
                value={formData.playedAt}
                onChange={handleChange}
                required
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </button>
          </form>
        </article>

        <article>
          <h2>Current Draw</h2>
          <p>{currentDraw?.name || 'No active draw currently'}</p>
          {currentDraw && <p>Cutoff: {new Date(currentDraw.entryCutoff).toLocaleString()}</p>}

          <h3>Your Latest 5 Scores (Most Recent First)</h3>
          <ul className="plain-list">
            {scoreEntries.map((score) => (
              <li key={score._id}>
                <strong>Score: {score.scoreValue ?? score.points}</strong>
                <span>
                  Tier: {score.tier} • Played: {new Date(score.playedAt).toLocaleDateString()}
                </span>
                <div className="score-actions">
                  <button type="button" onClick={() => handleWithdrawScore(score._id)}>
                    Withdraw
                  </button>
                </div>
              </li>
            ))}
            {!scoreEntries.length && <li>No scores yet.</li>}
          </ul>
        </article>
      </section>

    </MemberLayout>
  )
}

export default ScoresPage
