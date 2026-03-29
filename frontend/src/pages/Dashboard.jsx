import './Dashboard.css'

function Dashboard({ user }) {
  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1>👋 Benvenuto, {user?.username}!</h1>
        <p>Ecosistema Economico Virtuale ZeroMarket</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">💰 Saldo</div>
          <div className="stat-value">{user?.balance?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📦 Inventario</div>
          <div className="stat-value">0 items</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📊 Valore Portafoglio</div>
          <div className="stat-value">0.00</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⭐ Reputazione</div>
          <div className="stat-value">5.0</div>
        </div>
      </div>

      <div className="info-section">
        <h2>🚀 Introduzione a ZeroMarket</h2>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">🛒</div>
            <h3>Shop Centrale</h3>
            <p>Acquista gli item più rari dal negozio principale con prezzi sempre competitivi</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📈</div>
            <h3>Marketplace P2P</h3>
            <p>Scambia item con altri player in un marketplace sicuro e affidabile</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Aste Dinamiche</h3>
            <p>Partecipa a aste per acquisire item rari e collezionare rarità</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Analisi Economica</h3>
            <p>Monitora i prezzi, le tendenze e il valore della tua collezione</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Inizia a Fare Trading</h2>
        <div className="button-group">
          <a href="/shop" className="cta-button primary">
            Vai allo Shop 🛍️
          </a>
          <a href="/inventory" className="cta-button secondary">
            Visualizza Inventario 📦
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
