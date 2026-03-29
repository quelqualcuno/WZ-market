import { Outlet, Link, useNavigate } from 'react-router-dom'
import './Layout.css'

function Layout({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <Link to="/">
              <span className="logo-text">ZeroMarket</span>
            </Link>
          </div>
          <ul className="nav-menu">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/auctions">Aste</Link></li>
            <li><Link to="/inventory">Inventario</Link></li>
          </ul>
          <div className="navbar-user">
            <span className="user-info">
              👤 {user?.username || 'Guest'}
            </span>
            <span className="balance">
              💰 {user?.balance?.toFixed(2) || '0.00'}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
