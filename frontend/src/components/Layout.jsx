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

      <footer className="site-footer">
        <div className="site-footer-grid">
          <div className="footer-block">
            <h4>Contatti</h4>
            <p>Email: support@zeromarket.it</p>
            <p>Telefono: +39 02 1234 5678</p>
            <p>Assistenza: Lun-Ven 09:00-18:00</p>
          </div>

          <div className="footer-block">
            <h4>Dati Aziendali</h4>
            <p>ZeroMarket S.r.l.</p>
            <p>Partita IVA: IT12345678901</p>
            <p>Codice Fiscale: 12345678901</p>
            <p>REA: MI-9876543</p>
          </div>

          <div className="footer-block">
            <h4>Sede & Info</h4>
            <p>Via del Mercato 42, 20121 Milano (MI)</p>
            <p>PEC: zeromarket@pec.example.it</p>
            <p>Capitale Sociale: EUR 10.000 i.v.</p>
          </div>
        </div>

        <p className="footer-manifesto">
          il progetto reale e fallito, mancanza di investitori: 2 anni spesi nel vero sviluppo,
          <br />
          8 mesi solo per la formazione dei vari team di sviluppo..
          <br />
          34 persone
          <br />
          <span className="footer-manifesto-highlight">zero online..noi non ci arrenderemo</span>
          <br />
          -zero online.
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
