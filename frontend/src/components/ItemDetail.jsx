import { useState, useEffect } from 'react'
import './ItemDetail.css'

function ItemDetail({ item, onClose }) {
  const [priceHistory, setPriceHistory] = useState([])
  const [priceChange, setPriceChange] = useState(0)
  const [hoveredBar, setHoveredBar] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!item) return
    // Generate fake price trend data (last 30 days)
    const history = []
    let currentPrice = item.current_price
    for (let i = 29; i >= 0; i--) {
      const change = (Math.random() - 0.5) * 20
      currentPrice += change
      currentPrice = Math.max(currentPrice, item.base_price * 0.5)
      history.push({
        day: i,
        price: parseFloat(currentPrice.toFixed(2))
      })
    }
    history.reverse()
    setPriceHistory(history)
    
    // Calculate price change percentage
    if (history.length > 1) {
      const oldPrice = history[0].price
      const change = ((item.current_price - oldPrice) / oldPrice) * 100
      setPriceChange(parseFloat(change.toFixed(2)))
    }
  }, [item])

  if (!item) return null

  // Convert rarity_index to stars (1-5)
  const rarityStars = Math.min(Math.round(item.rarity_index), 5)

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count)
  }

  const priceChangeColor = priceChange >= 0 ? '#4caf50' : '#f44336'

  const handleBarHover = (idx, event) => {
    if (priceHistory.length === 0) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const currentPrice = priceHistory[idx].price
    const previousPrice = idx > 0 ? priceHistory[idx - 1].price : currentPrice
    const delta = currentPrice - previousPrice
    const deltaPercent = previousPrice !== 0 ? ((delta / previousPrice) * 100).toFixed(2) : 0
    
    setHoveredBar({
      idx,
      price: currentPrice,
      delta: delta.toFixed(2),
      deltaPercent,
      dayOffset: priceHistory.length - idx
    })
    
    setTooltipPos({
      x: rect.left,
      y: rect.top
    })
  }

  const handleBarLeave = () => {
    setHoveredBar(null)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        
        <div className="item-detail-container">
          {/* Info */}
          <div className="detail-info">
            <h2 className="item-name">{item.name}</h2>
            {item.is_legacy && <span className="legacy-banner">LEGACY</span>}
            
            {/* Rarity */}
            <div className="rarity-section">
              <span className="rarity-label">Rarità:</span>
              <span className="rarity-stars">{renderStars(rarityStars)}</span>
              <span className="rarity-text">({rarityStars}/5)</span>
            </div>

            {/* Description */}
            <div className="description-section">
              <h3>Descrizione</h3>
              <p>{item.description}</p>
            </div>

            {/* Valuation & Prices */}
            <div className="valuation-section">
              <div className="price-box">
                <span className="price-label">Prezzo Attuale</span>
                <span className="price-value">{item.current_price.toFixed(2)}</span>
              </div>
              <div className="price-box">
                <span className="price-label">Prezzo Base</span>
                <span className="price-value">{item.base_price.toFixed(2)}</span>
              </div>
              <div className="price-box">
                <span className="price-label">Disponibili</span>
                <span className="price-value">{item.available_copies}/{item.total_copies}</span>
              </div>
            </div>

            {/* Price Trend */}
            <div className="trend-section">
              <h3>Andatura Economica (30 giorni)</h3>
              <div className="price-trend-info">
                <span className="trend-label">Variazione:</span>
                <span className="trend-value" style={{ color: priceChangeColor }}>
                  {priceChange > 0 ? '+' : ''}{priceChange}%
                </span>
              </div>
              
              <div className="price-chart">
                <div className="chart-container">
                  {priceHistory.length > 0 && (
                    <div className="mini-chart">
                      {priceHistory.map((entry, idx) => {
                        const minPrice = Math.min(...priceHistory.map(p => p.price))
                        const maxPrice = Math.max(...priceHistory.map(p => p.price))
                        const range = maxPrice - minPrice || 1
                        const height = ((entry.price - minPrice) / range) * 100
                        const isHovered = hoveredBar?.idx === idx
                        return (
                          <div
                            key={idx}
                            className={`chart-bar ${isHovered ? 'hovered' : ''}`}
                            style={{ height: `${Math.max(5, height)}%` }}
                            title={`${entry.price.toFixed(2)}`}
                            onMouseEnter={(e) => handleBarHover(idx, e)}
                            onMouseLeave={handleBarLeave}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {/* Tooltip al hover */}
                {hoveredBar && (
                  <div className="price-tooltip">
                    <div className="tooltip-content">
                      <div className="tooltip-price">
                        <span className="tooltip-label">Prezzo:</span>
                        <span className="tooltip-value">{hoveredBar.price.toFixed(2)}</span>
                      </div>
                      <div className={`tooltip-delta ${hoveredBar.delta >= 0 ? 'positive' : 'negative'}`}>
                        <span className="tooltip-label">Variazione:</span>
                        <span className="tooltip-value">
                          {hoveredBar.delta >= 0 ? '+' : ''}{hoveredBar.delta} ({hoveredBar.deltaPercent >= 0 ? '+' : ''}{hoveredBar.deltaPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="chart-labels">
                  <span>30 giorni fa</span>
                  <span>Oggi</span>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-label">Min (30g)</span>
                  <span className="stat-value">
                    {priceHistory.length > 0 ? 
                      Math.min(...priceHistory.map(p => p.price)).toFixed(2) : 
                      item.current_price.toFixed(2)
                    }
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Max (30g)</span>
                  <span className="stat-value">
                    {priceHistory.length > 0 ? 
                      Math.max(...priceHistory.map(p => p.price)).toFixed(2) : 
                      item.current_price.toFixed(2)
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetail
