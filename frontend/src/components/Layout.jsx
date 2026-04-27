import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import './Layout.css'

function Layout({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <div className="sky-layer" aria-hidden="true" />
      <div className="rune-layer" aria-hidden="true" />
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <Link to="/">
              <span className="logo-mark">WZ</span>
              <span className="logo-text">World Zero Market</span>
            </Link>
          </div>
          <ul className="nav-menu">
            <li><NavLink to="/">Dashboard</NavLink></li>
            <li><NavLink to="/shop">Shop</NavLink></li>
            <li><NavLink to="/auctions">Aste</NavLink></li>
            <li><NavLink to="/inventory">Inventario</NavLink></li>
          </ul>
          <div className="navbar-user">
            <span className="user-info">
              Avventuriero: {user?.username || 'Guest'}
            </span>
            <span className="balance">
              Oro: {user?.balance?.toFixed(2) || '0.00'}
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

      <footer className="site-footer">
        <div className="site-footer-grid">
          <div className="footer-block">
            <h4>Gilda Mercanti</h4>
            <p>Piazza Principale di Arcadia</p>
            <p>Canale supporto: support@wzmarket.gg</p>
            <p>Presidio attivo: Lun-Dom, 09:00-23:00</p>
          </div>

          <div className="footer-block">
            <h4>Hub Trading</h4>
            <p>Vendita diretta di equip e cosmetici</p>
            <p>Aste live con rilanci in tempo reale</p>
            <p>Storico prezzi e gestione inventario</p>
          </div>

          <div className="footer-block">
            <h4>Standard</h4>
            <p>Interfaccia responsive desktop/mobile</p>
            <p>Transazioni tracciate lato backend</p>
            <p>Design system fantasy originale</p>
          </div>
        </div>

        <p className="footer-manifesto">
          Un mercato d'avventura pensato per il ritmo di World Zero:
          <span className="footer-manifesto-highlight"> rapido, leggibile, epico.</span>
        </p>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ZeroMarket. Tutti i diritti riservati.</span>
          <span>Privacy • Termini • Cookie</span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
