import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Dashboard.css'

function MemberLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <main className="member-page">
      <header className="member-topbar">
        <div>
          <p className="member-kicker">Drive for Good</p>
          <h1>{title}</h1>
          <p className="member-subtitle">{subtitle}</p>
        </div>

        <div className="member-userbox">
          <p>{user?.name}</p>
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="member-nav">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/scores">Add Score</NavLink>
        <NavLink to="/winners">Winners</NavLink>
      </nav>

      {children}
    </main>
  )
}

export default MemberLayout
