import { useCallback, useEffect, useMemo, useState } from 'react'
import { inventoryAPI } from '../services/api'
import './Dashboard.css'

function Dashboard({ user }) {
  const [inventoryItems, setInventoryItems] = useState([])
  const [inventoryTotalValue, setInventoryTotalValue] = useState(0)

  const fetchInventoryStats = useCallback(async () => {
    try {
      const response = await inventoryAPI.get()
      const items = response.data?.items || []
      const totalValue = Number(response.data?.total_value || 0)
      setInventoryItems(items)
      setInventoryTotalValue(Number.isFinite(totalValue) ? totalValue : 0)
    } catch (err) {
      console.error('Errore nel caricamento statistiche inventario:', err)
    }
  }, [])

  useEffect(() => {
    fetchInventoryStats()

    const intervalId = setInterval(fetchInventoryStats, 15000)
    const onFocus = () => fetchInventoryStats()

    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchInventoryStats])

  const inventoryQuantity = useMemo(() => {
    return inventoryItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }, [inventoryItems])

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
          <div className="stat-value">{inventoryQuantity} items</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📊 Valore Portafoglio</div>
          <div className="stat-value">{inventoryTotalValue.toFixed(2)}</div>
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
