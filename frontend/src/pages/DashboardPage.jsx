import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MemberLayout from '../components/dashboard/MemberLayout'
import { useAuth } from '../context/AuthContext'
import {
  getCurrentDraw,
  getImpactSummary,
  getMyCharityImpact,
  getMyScores,
  getMySubscription,
  setMySubscription,
  updateMyCharityPreference,
  updateMyContribution,
} from '../services/platformService'

const planOptions = ['starter', 'fairway', 'eagle']

function DashboardPage() {
  const { token, user } = useAuth()
  const [dashboard, setDashboard] = useState({
    subscription: null,
    scoreEntries: [],
    draw: null,
    impact: null,
    charities: [],
    userImpact: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [planMessage, setPlanMessage] = useState('')
  const [contributionValue, setContributionValue] = useState(10)
  const [charitySelection, setCharitySelection] = useState('')

  const loadDashboard = async () => {
    setIsLoading(true)
    setPlanMessage('')

    try {
      const [subscriptionPayload, scorePayload, drawPayload, impactPayload, myImpactPayload] = await Promise.all([
        getMySubscription(token),
        getMyScores(token),
        getCurrentDraw(),
        getImpactSummary(),
        getMyCharityImpact(token),
      ])

      const initialContribution =
        subscriptionPayload.subscription?.donationPercentage || myImpactPayload.userImpact?.donationPercentage || 10

      setContributionValue(initialContribution)

      setDashboard({
        subscription: subscriptionPayload.subscription,
        scoreEntries: scorePayload.scoreEntries,
        draw: drawPayload.draw,
        impact: impactPayload.summary,
        charities: impactPayload.charities || [],
        userImpact: myImpactPayload.userImpact,
      })

      setCharitySelection(subscriptionPayload.subscription?.charityPreference?._id || '')
    } catch (error) {
      setPlanMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [token])

  const stats = useMemo(() => {
    const latestScore = dashboard.scoreEntries[0]

    return [
      {
        label: 'Current Plan',
        value: dashboard.subscription?.plan || 'No active plan',
      },
      {
        label: 'Latest Tier',
        value: latestScore?.tier || 'No scores',
      },
      {
        label: 'Monthly Charity',
        value:
          dashboard.impact?.monthlyCharityContribution !== undefined
            ? `INR ${dashboard.impact.monthlyCharityContribution}`
            : '-',
      },
      {
        label: 'Current Draw',
        value: dashboard.draw?.name || 'No open draw',
      },
    ]
  }, [dashboard])

  const handlePlanUpdate = async (plan) => {
    try {
      await setMySubscription(token, {
        plan,
        donationPercentage: contributionValue,
      })
      setPlanMessage(`Plan updated to ${plan}`)
      await loadDashboard()
    } catch (error) {
      setPlanMessage(error.message)
    }
  }

  const handleContributionSave = async () => {
    try {
      await updateMyContribution(token, contributionValue)
      setPlanMessage(`Contribution updated to ${contributionValue}%`)
      await loadDashboard()
    } catch (error) {
      setPlanMessage(error.message)
    }
  }

  const handleCharityUpdate = async () => {
    if (!charitySelection) {
      setPlanMessage('Please select a charity')
      return
    }

    try {
      await updateMyCharityPreference(token, charitySelection)
      setPlanMessage('Charity preference updated')
      await loadDashboard()
    } catch (error) {
      setPlanMessage(error.message)
    }
  }

  return (
    <MemberLayout
      title="Member Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Golfer'}. Here is your live subscription and draw status.`}
    >
      {isLoading ? (
        <section className="member-panel"><p>Loading your dashboard...</p></section>
      ) : (
        <>
          {planMessage && <p className="member-banner">{planMessage}</p>}

          <section className="member-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
              </article>
            ))}
          </section>

          <section className="member-panel">
            <h2>Subscription</h2>
            <p>Choose your active plan. Subscription is required for draw participation.</p>
            <div className="chip-row">
              {planOptions.map((plan) => (
                <button
                  type="button"
                  key={plan}
                  className={dashboard.subscription?.plan === plan ? 'chip active' : 'chip'}
                  onClick={() => handlePlanUpdate(plan)}
                >
                  {plan}
                </button>
              ))}
            </div>

            <div className="contribution-block">
              <label htmlFor="contributionInput">Your Charity Contribution (%)</label>
              <div className="contribution-row">
                <input
                  id="contributionInput"
                  type="number"
                  min="10"
                  max="100"
                  value={contributionValue}
                  onChange={(event) => setContributionValue(Math.max(10, Number(event.target.value || 10)))}
                />
                <button type="button" onClick={handleContributionSave}>Save Contribution</button>
              </div>
              <p className="contribution-note">
                Minimum contribution is 10%. Current charity: {dashboard.subscription?.charityPreference?.name || dashboard.userImpact?.charityPreference || 'Not set'}
              </p>
              <div className="contribution-row">
                <select
                  value={charitySelection}
                  onChange={(event) => setCharitySelection(event.target.value)}
                >
                  <option value="">Select charity</option>
                  {dashboard.charities.map((charity) => (
                    <option key={charity._id} value={charity._id}>
                      {charity.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleCharityUpdate}>Update Charity</button>
              </div>
            </div>
          </section>

          <section className="member-panel split">
            <article>
              <h2>Recent Scores</h2>
              <ul className="plain-list">
                {dashboard.scoreEntries.slice(0, 4).map((score) => (
                  <li key={score._id}>
                    <strong>Score: {score.scoreValue ?? score.points}</strong>
                    <span>
                      {score.tier} • {new Date(score.playedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {!dashboard.scoreEntries.length && <li>No scores yet.</li>}
              </ul>
              <Link className="member-link" to="/scores">Add or manage scores</Link>
            </article>

            <article>
              <h2>Draw Snapshot</h2>
              <p>{dashboard.draw?.name || 'No open draw right now.'}</p>
              {dashboard.draw && (
                <p>
                  Entry cutoff: {new Date(dashboard.draw.entryCutoff).toLocaleString()}
                </p>
              )}
              <Link className="member-link" to="/winners">Go to winners board</Link>
            </article>
          </section>

          <section className="member-panel">
            <h2>Charity Funds Overview</h2>
            <p>
              Your monthly contribution: INR {dashboard.userImpact?.monthlyContribution || 0} at{' '}
              {dashboard.userImpact?.donationPercentage || 10}%.
            </p>
            <div className="charity-grid">
              {dashboard.charities.slice(0, 5).map((charity) => (
                <article className="charity-card" key={charity._id || charity.name}>
                  <h3>{charity.name}</h3>
                  <p>Total Funds: INR {charity.totalFunds}</p>
                  <p>Monthly Incoming: INR {charity.monthlyIncoming || 0}</p>
                  <p>Supporters: {charity.supporters || 0}</p>
                </article>
              ))}
              {!dashboard.charities.length && <p>No charity fund data available yet.</p>}
            </div>
          </section>
        </>
      )}
    </MemberLayout>
  )
}

export default DashboardPage
