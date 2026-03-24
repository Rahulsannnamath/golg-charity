import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MemberLayout from '../components/dashboard/MemberLayout'
import { getCurrentDraw, getDraws } from '../services/platformService'

function WinnersPage() {
  const [currentDraw, setCurrentDraw] = useState(null)
  const [completedDraws, setCompletedDraws] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [currentPayload, completedPayload] = await Promise.all([
          getCurrentDraw(),
          getDraws({ status: 'completed', limit: 8 }),
        ])

        setCurrentDraw(currentPayload.draw)
        setCompletedDraws(completedPayload.draws)
      } catch (error) {
        setNotice(error.message)
      }
    }

    load()
  }, [])

  return (
    <MemberLayout
      title="Winners Board"
      subtitle="Track live draw status and review recently completed winners."
    >
      {notice && <p className="member-banner">{notice}</p>}

      <section className="member-panel split">
        <article>
          <h2>Current Draw</h2>
          {currentDraw ? (
            <>
              <p><strong>{currentDraw.name}</strong></p>
              <p>Status: {currentDraw.status}</p>
              <p>Month: {currentDraw.drawMonth}</p>
              <p>Draw date: {new Date(currentDraw.drawDate).toLocaleString()}</p>
              {currentDraw.drawNumbers?.length === 5 && (
                <p>Numbers: {currentDraw.drawNumbers.join(', ')}</p>
              )}
            </>
          ) : (
            <p>No open draw available right now.</p>
          )}
          <Link className="member-link" to="/scores">Submit your score history</Link>
        </article>

        <article>
          <h2>How winners work</h2>
          <ul className="plain-list">
            <li>Every active subscriber with latest 5 scores is auto-included monthly.</li>
            <li>Match types: 5-number, 4-number, and 3-number.</li>
            <li>Draw mode is random or algorithmic (most/least frequent scores).</li>
            <li>If no 5-match winner, jackpot rolls to next month.</li>
          </ul>
        </article>
      </section>

      <section className="member-panel">
        <h2>Recent Completed Draws</h2>
        {!completedDraws.length && <p>No completed draws yet.</p>}

        <div className="draws-grid">
          {completedDraws.map((draw) => (
            <article className="draw-card" key={draw._id}>
              <h3>{draw.name}</h3>
              <p>{new Date(draw.drawDate).toLocaleDateString()}</p>
              <p>Mode: {draw.drawLogic?.mode || '-'}</p>
              <p>Bias: {draw.drawLogic?.bias || '-'}</p>
              {draw.drawNumbers?.length === 5 && <p>Numbers: {draw.drawNumbers.join(', ')}</p>}
              <p>
                Pools: 5-match INR {draw.prizePool?.fiveMatchPool || 0}, 4-match INR {draw.prizePool?.fourMatchPool || 0},
                {' '}3-match INR {draw.prizePool?.threeMatchPool || 0}
              </p>
              <p>Jackpot Carry Out: INR {draw.prizePool?.jackpotCarriedOut || 0}</p>

              <ul className="plain-list">
                {draw.winners?.map((winner) => (
                  <li key={`${draw._id}-${winner.matchType}-${winner.user?._id || winner.user}`}>
                    <strong>{winner.matchType}</strong>
                    <span>
                      {winner.user?.name || 'Unknown'} • Prize INR {winner.prizeAmount || 0}
                    </span>
                  </li>
                ))}
                {!draw.winners?.length && <li>No winners recorded.</li>}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </MemberLayout>
  )
}

export default WinnersPage
