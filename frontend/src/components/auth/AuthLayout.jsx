import { Link } from 'react-router-dom'

function AuthLayout({ title, subtitle, badge, children, altText, altLink, altLabel }) {
  return (
    <main className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-blob blob-1" />
        <span className="auth-blob blob-2" />
        <span className="auth-blob blob-3" />
      </div>

      <section className="auth-shell">
        <aside className="auth-side">
          <p className="auth-badge">{badge}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="auth-side-cards">
            <article>
              <h3>Fair Draw Engine</h3>
              <p>Monthly random or weighted logic with transparent payout flow.</p>
            </article>
            <article>
              <h3>Impact First</h3>
              <p>Every plan contributes to a charity selected by the subscriber.</p>
            </article>
          </div>
        </aside>

        <section className="auth-card-wrap">
          <Link className="auth-home" to="/">Back to Home</Link>
          {children}
          <p className="auth-alt-link">
            {altText} <Link to={altLink}>{altLabel}</Link>
          </p>
        </section>
      </section>
    </main>
  )
}

export default AuthLayout
